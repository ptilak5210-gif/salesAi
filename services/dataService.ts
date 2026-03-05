import { supabase } from "../lib/supabase";
import { Lead, Deal, Meeting, Message } from "../types";

export const fetchLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(l => ({
    id: l.id,
    name: l.name,
    email: l.email,
    company: l.company,
    role: l.role,
    status: l.status,
    score: l.score,
    source: l.source,
    lastContact: l.last_contact
  }));
};

export const createLead = async (lead: Partial<Lead>): Promise<Lead> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Map camelCase to snake_case for insert
  const dbLead = {
    name: lead.name,
    email: lead.email,
    company: lead.company,
    role: lead.role,
    status: lead.status,
    score: lead.score,
    source: lead.source,
    last_contact: lead.lastContact,
    user_id: user?.id
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(dbLead)
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    company: data.company,
    role: data.role,
    status: data.status,
    score: data.score,
    source: data.source,
    lastContact: data.last_contact
  };
};

export const fetchDeals = async (): Promise<Deal[]> => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    leadName: d.lead_name,
    amount: parseFloat(d.amount),
    stage: d.stage,
    probability: d.probability
  }));
};

export const fetchMeetings = async (): Promise<Meeting[]> => {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchMessages = async (leadId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const sendMessage = async (message: Partial<Message>): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, user_id: user?.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};
