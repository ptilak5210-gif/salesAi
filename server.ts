import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database Initialization
  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL: DATABASE_URL environment variable is missing!");
    console.error("Please set DATABASE_URL in your environment variables.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Initializing database tables...");
    await pool.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS public.companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        plan TEXT DEFAULT 'Starter',
        leads_per_day INTEGER DEFAULT 50,
        messages_per_day INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'Owner',
        company_id TEXT REFERENCES public.companies(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES public.users(id),
        name TEXT NOT NULL,
        email TEXT,
        company TEXT,
        role TEXT,
        status TEXT DEFAULT 'New',
        score TEXT DEFAULT 'Cold',
        source TEXT,
        last_contact TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES public.users(id),
        lead_name TEXT NOT NULL,
        amount NUMERIC,
        stage TEXT,
        probability INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES public.users(id),
        title TEXT NOT NULL,
        attendee TEXT NOT NULL,
        date TEXT,
        time TEXT,
        type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES public.users(id),
        lead_id UUID REFERENCES public.leads(id),
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        channel TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Grant permissions to Supabase roles
      GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

      -- Disable RLS on all tables to ensure immediate access
      ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
      
      -- Notify PostgREST to reload schema cache (if possible via SQL)
      NOTIFY pgrst, 'reload schema';
    `);
    console.log("Database tables verified/created and permissions granted.");
  } catch (err) {
    console.error("Database initialization error:", err);
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
