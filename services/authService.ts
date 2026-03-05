import { User, Company, AuthSession } from "../types";
import { supabase } from "../lib/supabase";

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export interface SignupData {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

/**
 * 1. REGISTER USER
 * Uses supabase.auth.signUp() to trigger the "Confirm Signup" email template.
 * This ensures we get an OTP code if the template uses {{ .Token }}.
 */
export const registerUser = async (data: SignupData) => {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.name,
      },
    },
  });

  if (error) throw error;

  // Store signup data temporarily to create profile after verification
  localStorage.setItem("signupData", JSON.stringify(data));

  return {
    message: "Signup successful. Please check your email for the verification code."
  };
};

/**
 * 2. VERIFY OTP
 * Uses supabase.auth.verifyOtp() with type: 'signup'.
 * This strictly verifies the signup OTP code.
 */
export const verifyUserOtp = async (email: string, token: string): Promise<AuthSession> => {
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Verification failed. No user returned.");

  // Retrieve stored signup data
  const storedData = localStorage.getItem("signupData");
  
  // Handle case where local storage might be empty (e.g. different device/browser)
  // In a real app, you might want to ask for these details again or fetch from a partial profile if it existed.
  // For this flow, we assume the user is on the same device.
  let data: SignupData;
  if (storedData) {
    data = JSON.parse(storedData);
  } else {
    // Fallback or error if data is missing. 
    // If the user is just verifying an existing account, we might not need this.
    // But for a new signup flow, we expect this data.
    // We'll try to proceed if we can fetch an existing profile, otherwise error.
    const { data: existingProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();
      
    if (!existingProfile) {
       throw new Error("Signup data missing and no profile found. Please sign up again.");
    }
    // If profile exists, we don't need 'data' variable for creation logic below.
    data = { name: existingProfile.name, email: existingProfile.email, password: "", companyName: "" }; 
  }

  // Check if User Profile already exists
  const { data: existingProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (existingProfile) {
    // If profile exists, fetch company and return session
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", existingProfile.company_id)
      .single();

    if (companyError) throw companyError;

    return {
      user: {
        id: existingProfile.id,
        name: existingProfile.name,
        email: existingProfile.email,
        role: existingProfile.role,
        companyId: existingProfile.company_id
      },
      company: {
        id: companyData.id,
        name: companyData.name,
        plan: companyData.plan,
        limits: {
          leadsPerDay: companyData.leads_per_day,
          messagesPerDay: companyData.messages_per_day
        },
        createdAt: companyData.created_at
      },
      token: authData.session?.access_token || ""
    };
  }

  // Create Company
  const companyId = `comp_${Date.now()}`;
  const { error: compError } = await supabase
    .from("companies")
    .insert({
      id: companyId,
      name: data.companyName,
      plan: "Starter"
    });

  if (compError) throw compError;

  // Create User Profile
  const { error: profileError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      name: data.name,
      email: data.email,
      role: "Owner",
      company_id: companyId
    });

  if (profileError) throw profileError;

  // Cleanup
  localStorage.removeItem("signupData");

  // Return session
  return {
    user: {
      id: authData.user.id,
      name: data.name,
      email: data.email,
      role: "Owner",
      companyId: companyId
    },
    company: {
      id: companyId,
      name: data.companyName,
      plan: "Starter",
      limits: { leadsPerDay: 50, messagesPerDay: 100 },
      createdAt: new Date().toISOString()
    },
    token: authData.session?.access_token || ""
  };
};

/**
 * 3. RESEND OTP
 * Triggers the "Confirm Signup" email again.
 */
export const resendOtp = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) throw error;
  return { message: "Verification code resent successfully." };
};

// 🔐 LOGIN
export const login = async (email: string, password: string): Promise<AuthSession> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Login failed");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*, companies(*)")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) throw new Error("Could not fetch user profile");

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      companyId: profile.company_id
    },
    company: {
      id: profile.companies.id,
      name: profile.companies.name,
      plan: profile.companies.plan,
      limits: {
        leadsPerDay: profile.companies.leads_per_day,
        messagesPerDay: profile.companies.messages_per_day
      },
      createdAt: profile.companies.created_at
    },
    token: authData.session?.access_token || ""
  };
};

// 🔄 SESSION
export const getCurrentSession = async (): Promise<AuthSession | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, companies(*)")
    .eq("id", session.user.id)
    .single();

  if (!profile) return null;

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      companyId: profile.company_id
    },
    company: {
      id: profile.companies.id,
      name: profile.companies.name,
      plan: profile.companies.plan,
      limits: {
        leadsPerDay: profile.companies.leads_per_day,
        messagesPerDay: profile.companies.messages_per_day
      },
      createdAt: profile.companies.created_at
    },
    token: session.access_token
  };
};

// 🚪 LOGOUT
export const logout = async () => {
  await supabase.auth.signOut();
};
