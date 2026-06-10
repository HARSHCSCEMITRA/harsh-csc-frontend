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
CREATE POLICY "Allow service_role full access to software_trials" 
ON public.software_trials 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

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

