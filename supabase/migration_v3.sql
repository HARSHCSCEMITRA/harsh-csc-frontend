-- Table for storing subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY, -- e.g. 'single_monthly', 'single_yearly', 'multi_monthly', 'multi_yearly'
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    allowed_devices INTEGER NOT NULL DEFAULT 1,
    billing TEXT NOT NULL, -- 'monthly' or 'yearly'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plans
DROP POLICY IF EXISTS "Allow public read subscription_plans" ON public.subscription_plans;
CREATE POLICY "Allow public read subscription_plans"
ON public.subscription_plans
FOR SELECT
TO public
USING (true);

-- Allow service_role full access
DROP POLICY IF EXISTS "Allow service_role full access to subscription_plans" ON public.subscription_plans;
CREATE POLICY "Allow service_role full access to subscription_plans"
ON public.subscription_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Seed initial plans
INSERT INTO public.subscription_plans (id, name, price, allowed_devices, billing, description) VALUES
('single_monthly', 'Single Device - Monthly', 50, 1, 'monthly', 'Single device license for 30 days'),
('single_yearly', 'Single Device - Yearly', 500, 1, 'yearly', 'Single device license for 365 days (Best Value)'),
('multi_monthly', 'Multiple Devices - Monthly', 150, 3, 'monthly', 'Up to 3 devices license for 30 days'),
('multi_yearly', 'Multiple Devices - Yearly', 1500, 3, 'yearly', 'Up to 3 devices license for 365 days (Best Value)')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    allowed_devices = EXCLUDED.allowed_devices,
    billing = EXCLUDED.billing,
    description = EXCLUDED.description;
