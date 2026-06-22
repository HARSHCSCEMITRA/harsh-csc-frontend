-- Migration v2: Support multi-device licensing and customer email tracking
ALTER TABLE public.software_licenses ADD COLUMN IF NOT EXISTS allowed_devices INTEGER DEFAULT 1;
ALTER TABLE public.software_licenses ADD COLUMN IF NOT EXISTS customer_email TEXT;
