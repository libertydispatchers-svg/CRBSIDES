-- ==========================================
-- CURBSIDES - Supabase Database Schema Setup
-- Paste this script directly into your Supabase SQL Editor
-- ==========================================

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    borough TEXT NOT NULL,
    logo_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read vendors" ON public.vendors
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow owners to edit public vendor profile" ON public.vendors
    FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- 3. Locations Table (Real-time GPS tracking for food trucks)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read locations" ON public.locations
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow vendors to update their active GPS location" ON public.locations
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE vendors.id = locations.vendor_id AND vendors.owner_id = auth.uid()
        )
    );

-- 4. Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    open_time TIME WITHOUT TIME ZONE NOT NULL,
    close_time TIME WITHOUT TIME ZONE NOT NULL,
    UNIQUE (vendor_id, day_of_week)
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read schedules" ON public.schedules
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow owners to manage their schedule days" ON public.schedules
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.vendors
            WHERE vendors.id = schedules.vendor_id AND vendors.owner_id = auth.uid()
        )
    );

-- Trigger to create public profile row automatically on Supabase auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'role', 'customer')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
