-- Users table for multi-tenant user management
-- This table manages user profiles, preferences, and multi-tenant associations

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    company_id UUID NOT NULL, -- Multi-tenant association
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    preferences JSONB DEFAULT '{}',
    avatar_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'manager', 'accountant', 'user', 'read_only'));

ALTER TABLE public.users
ADD CONSTRAINT users_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (
        auth.uid()::text = id::text AND
        -- Prevent users from changing their role, status, or company_id
        role = (SELECT role FROM public.users WHERE id = auth.uid()) AND
        status = (SELECT status FROM public.users WHERE id = auth.uid()) AND
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    );

-- Admins can view users from their company
CREATE POLICY "Admins can view company users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.company_id = users.company_id
        )
    );

-- Admins can manage users from their company
CREATE POLICY "Admins can manage company users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.company_id = users.company_id
        )
    );

-- Managers can view users from their company
CREATE POLICY "Managers can view company users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users manager_user
            WHERE manager_user.id = auth.uid()
            AND manager_user.role IN ('admin', 'manager')
            AND manager_user.company_id = users.company_id
        )
    );

-- Create a basic companies table for foreign key reference
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE public.users
ADD CONSTRAINT fk_users_company_id
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create some sample data for development
INSERT INTO public.companies (id, name, slug) VALUES
('00000000-0000-0000-0000-000000000001', 'Demo Company', 'demo-company'),
('00000000-0000-0000-0000-000000000002', 'Test Corp', 'test-corp')
ON CONFLICT (slug) DO NOTHING;

-- Create sample users
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    company_id,
    status,
    preferences
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    'Admin',
    'User',
    'admin',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"language": "en", "timezone": "UTC", "currency": "INR"}'
),
(
    '00000000-0000-0000-0000-000000000002',
    'manager@demo.com',
    'Manager',
    'User',
    'manager',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"language": "en", "timezone": "UTC", "currency": "INR"}'
),
(
    '00000000-0000-0000-0000-000000000003',
    'user@demo.com',
    'Regular',
    'User',
    'user',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"language": "en", "timezone": "UTC", "currency": "INR"}'
)
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.companies TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.companies TO anon;
