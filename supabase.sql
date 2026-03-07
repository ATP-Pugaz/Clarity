-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text,
  email text UNIQUE,
  mobile text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type text CHECK (plan_type IN ('monthly', 'yearly')),
  trial_start_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
  trial_end_date timestamp with time zone,
  subscription_status text DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'Pending Verification', 'expired', 'canceled')),
  payment_screenshot text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" 
ON public.subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
ON public.subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger to create user row after OTP/Auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, mobile)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'username',
    COALESCE(new.phone, new.raw_user_meta_data->>'phone')
  );
  
  -- Create trial subscription automatically
  INSERT INTO public.subscriptions (user_id, trial_end_date, subscription_status)
  VALUES (new.id, CURRENT_TIMESTAMP + INTERVAL '7 days', 'trialing');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage bucket for payment screenshots
insert into storage.buckets (id, name, public) 
values ('payment_screenshots', 'payment_screenshots', false)
on conflict do nothing;

create policy "Users can insert own payment screenshot"
on storage.objects for insert
with check (
  bucket_id = 'payment_screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
