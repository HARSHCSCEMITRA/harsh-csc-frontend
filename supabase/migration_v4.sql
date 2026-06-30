-- Table for storing universal khata codes
CREATE TABLE IF NOT EXISTS public.khata_codes (
    khata TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for storing village codes
CREATE TABLE IF NOT EXISTS public.village_codes (
    village_id TEXT PRIMARY KEY,
    village_code TEXT NOT NULL,
    district_name TEXT,
    tehsil_name TEXT,
    village_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.khata_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_codes ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access to public.khata_codes
DROP POLICY IF EXISTS "Allow service_role full access to khata_codes" ON public.khata_codes;
CREATE POLICY "Allow service_role full access to khata_codes"
ON public.khata_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role full access to public.village_codes
DROP POLICY IF EXISTS "Allow service_role full access to village_codes" ON public.village_codes;
CREATE POLICY "Allow service_role full access to village_codes"
ON public.village_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
