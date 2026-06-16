-- Table for tracking 7-day trials bound to hardware Machine ID
CREATE TABLE IF NOT EXISTS public.software_trials (
    machine_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL
);

-- Table for tracking subscription license keys
CREATE TABLE IF NOT EXISTS public.software_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    order_ref TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    plan TEXT NOT NULL, -- 'monthly' or 'yearly'
    machine_id TEXT, -- hardware node lock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.software_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;

-- Allow public read/write since API verification and activation calls are made server-side
-- (Alternatively, we use Service Role key in the Vercel function, which bypasses RLS policies)
DROP POLICY IF EXISTS "Allow service_role full access to software_trials" ON public.software_trials;
CREATE POLICY "Allow service_role full access to software_trials" 
ON public.software_trials 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full access to software_licenses" ON public.software_licenses;
CREATE POLICY "Allow service_role full access to software_licenses" 
ON public.software_licenses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_software_licenses_key ON public.software_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_software_licenses_order ON public.software_licenses(order_ref);

-- Table for storing admin passwords and configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default admin password (HarshCSC@2026)
INSERT INTO public.admin_settings (key, value)
VALUES ('admin_password', 'HarshCSC@2026')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Table for storing user and admin login details
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- SHA-256 hash of password
    role TEXT DEFAULT 'user' NOT NULL, -- 'admin' or 'user'
    reset_token TEXT,
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full access to users" ON public.users;
CREATE POLICY "Allow service_role full access to users" 
ON public.users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Seed initial admin user: username 'admin', email 'harshcscemitra@gmail.com', password 'HarshCSC@2026'
-- SHA-256 hash of 'HarshCSC@2026' is 'c0e583fb0d04daf9f5fd5409a68ba47e9afab0f9317fd178d7312eed50a2ae6b'
INSERT INTO public.users (username, email, password_hash, role)
VALUES ('admin', 'harshcscemitra@gmail.com', 'c0e583fb0d04daf9f5fd5409a68ba47e9afab0f9317fd178d7312eed50a2ae6b', 'admin')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email;

-- Table for managing hardware lock / PC reset requests
CREATE TABLE IF NOT EXISTS public.license_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL REFERENCES public.software_licenses(license_key) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for license_resets
ALTER TABLE public.license_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full access to license_resets" ON public.license_resets;
CREATE POLICY "Allow service_role full access to license_resets" 
ON public.license_resets 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

