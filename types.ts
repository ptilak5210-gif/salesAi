
export type LeadStatus = 'New' | 'Contacted' | 'Replied' | 'Qualified' | 'Closed';
export type LeadScoreTag = 'Hot' | 'Warm' | 'Cold';
export type Channel = 'WhatsApp' | 'LinkedIn' | 'Email';
export type UserRole = 'ADMIN' | 'CLIENT' | 'Owner' | 'Agent'; // Updated roles
export type PlanType = 'Starter' | 'Pro' | 'Business';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  plan: PlanType;
  limits: {
    leadsPerDay: number;
    messagesPerDay: number;
  };
  createdAt: string;
}

export interface AuthSession {
  user: User;
  company: Company;
  token: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: LeadStatus;
  score: LeadScoreTag;
  source: string;
  lastContact: string;
}

export interface Message {
  id: string;
  lead_id?: string; // Added for Supabase
  sender: 'user' | 'lead' | 'ai';
  content: string;
  timestamp: Date;
  channel: Channel;
}

export interface Conversation {
  leadId: string;
  messages: Message[];
  unreadCount: number;
}

export interface Deal {
  id: string;
  leadName: string;
  amount: number;
  stage: 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won';
  probability: number;
}

export interface Meeting {
  id: string;
  title: string;
  attendee: string;
  date: string;
  time: string;
  type: 'Zoom' | 'Google Meet';
}

export interface DashboardStats {
  totalLeads: number;
  activeCampaigns: number;
  repliesReceived: number;
  meetingsBooked: number;
  conversionRate: number;
}
