-- Companies table for multi-tenant company structure
-- This file contains the complete database schema for companies and related functionality

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    registration_number VARCHAR(50),
    industry VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(500),
    address JSONB,
    settings JSONB NOT NULL DEFAULT '{
        "defaultCurrency": "USD",
        "timezone": "UTC",
        "dateFormat": "YYYY-MM-DD",
        "numberFormat": "1,234.56",
        "fiscalYearStart": 1,
        "multiCurrencyEnabled": false,
        "autoBackupEnabled": true,
        "emailNotificationsEnabled": true,
        "invoiceAutoNumbering": true,
        "invoiceNumberPrefix": "INV",
        "nextInvoiceNumber": 1
    }'::jsonb,
    preferences JSONB NOT NULL DEFAULT '{
        "theme": {"mode": "light", "primaryColor": "#007bff"},
        "dashboard": {"defaultView": "overview", "showCharts": true},
        "reports": {"defaultPeriod": "monthly", "autoGenerate": false},
        "notifications": {"email": true, "browser": true, "mobile": false},
        "ui": {"compactMode": false, "showSidebar": true}
    }'::jsonb,
    subscription JSONB NOT NULL DEFAULT '{
        "tier": "free",
        "billingCycle": "monthly",
        "startDate": null,
        "endDate": null,
        "maxUsers": 3,
        "maxStorage": 1,
        "apiRateLimit": 1000,
        "advancedFeaturesEnabled": false,
        "customBrandingEnabled": false,
        "prioritySupportEnabled": false
    }'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'inactive', 'trial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies USING gin((subscription->>'tier'));

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant access control
-- Policy for company administrators (can access their own company)
CREATE POLICY companies_admin_policy ON companies
    FOR ALL
    USING (
        -- Allow access if user is an admin of this company
        EXISTS (
            SELECT 1 FROM users
            WHERE users.company_id = companies.id
            AND users.id = auth.uid()::uuid
            AND users.role IN ('admin', 'manager')
            AND users.status = 'active'
        )
    );

-- Policy for system administrators (can access all companies)
CREATE POLICY companies_system_admin_policy ON companies
    FOR ALL
    USING (
        -- Allow access if user is a system administrator
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::uuid
            AND users.role = 'admin'
            AND users.status = 'active'
            AND users.company_id IS NULL -- System admin
        )
    );

-- Policy for read-only access by company users
CREATE POLICY companies_user_read_policy ON companies
    FOR SELECT
    USING (
        -- Allow read access for any active user in the company
        EXISTS (
            SELECT 1 FROM users
            WHERE users.company_id = companies.id
            AND users.id = auth.uid()::uuid
            AND users.status = 'active'
        )
    );

-- Create function to validate company subscription limits
CREATE OR REPLACE FUNCTION validate_company_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_users_count INTEGER;
    max_users_allowed INTEGER;
BEGIN
    -- Extract max users from subscription
    max_users_allowed := (NEW.subscription->>'maxUsers')::INTEGER;

    -- Count current active users in the company
    SELECT COUNT(*) INTO current_users_count
    FROM users
    WHERE company_id = NEW.id
    AND status = 'active';

    -- Check if we're exceeding the limit
    IF current_users_count > max_users_allowed THEN
        RAISE EXCEPTION 'Company has exceeded maximum allowed users (%). Current: %, Max: %',
            max_users_allowed, current_users_count, max_users_allowed;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate subscription limits
DROP TRIGGER IF EXISTS validate_subscription_limits ON companies;
CREATE TRIGGER validate_subscription_limits
    BEFORE UPDATE OF subscription ON companies
    FOR EACH ROW
    EXECUTE FUNCTION validate_company_subscription_limits();

-- Update the users table to reference companies
-- Add company_id foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_company_id_fkey'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on users.company_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Insert sample companies for development
INSERT INTO companies (
    name,
    legal_name,
    email,
    phone,
    website,
    tax_id,
    registration_number,
    industry,
    description,
    address,
    status
) VALUES
(
    'Acme Corporation',
    'Acme Corporation LLC',
    'admin@acme.com',
    '+1-555-0123',
    'https://acme.com',
    'TAX123456789',
    'REG987654321',
    'Technology',
    'Leading technology solutions provider',
    '{
        "street1": "123 Business Ave",
        "street2": "Suite 100",
        "city": "San Francisco",
        "state": "California",
        "postalCode": "94105",
        "country": "United States"
    }'::jsonb,
    'active'
),
(
    'Beta Industries',
    'Beta Industries Inc.',
    'info@beta.com',
    '+1-555-0456',
    'https://beta.com',
    'TAX987654321',
    'REG123456789',
    'Manufacturing',
    'Industrial manufacturing and distribution',
    '{
        "street1": "456 Industrial Blvd",
        "city": "Detroit",
        "state": "Michigan",
        "postalCode": "48201",
        "country": "United States"
    }'::jsonb,
    'active'
),
(
    'Gamma Consulting',
    'Gamma Consulting LLC',
    'contact@gamma.com',
    '+1-555-0789',
    'https://gamma.com',
    'TAX456789123',
    'REG654321987',
    'Consulting',
    'Business strategy and management consulting',
    '{
        "street1": "789 Consultant Row",
        "city": "New York",
        "state": "New York",
        "postalCode": "10001",
        "country": "United States"
    }'::jsonb,
    'trial'
) ON CONFLICT (email) DO NOTHING;

-- Update subscription start dates for sample companies
UPDATE companies
SET subscription = subscription || jsonb_build_object('startDate', CURRENT_TIMESTAMP::text)
WHERE subscription->>'startDate' IS NULL;

-- Grant necessary permissions
GRANT ALL ON companies TO authenticated;
GRANT ALL ON companies TO service_role;

-- Create a view for company statistics
CREATE OR REPLACE VIEW company_stats AS
SELECT
    c.id,
    c.name,
    c.status,
    c.subscription->>'tier' as subscription_tier,
    COUNT(u.id) as total_users,
    COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN u.role = 'manager' THEN 1 END) as manager_users,
    COUNT(CASE WHEN u.role = 'user' THEN 1 END) as regular_users,
    c.created_at,
    c.updated_at
FROM companies c
LEFT JOIN users u ON c.id = u.company_id
GROUP BY c.id, c.name, c.status, c.subscription, c.created_at, c.updated_at;

-- Grant access to the view
GRANT SELECT ON company_stats TO authenticated;
GRANT SELECT ON company_stats TO service_role;

-- Create function to get company by subdomain (for future multi-tenant routing)
CREATE OR REPLACE FUNCTION get_company_by_subdomain(subdomain_param TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    legal_name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(20),
    settings JSONB,
    preferences JSONB,
    subscription JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.legal_name,
        c.email,
        c.status,
        c.settings,
        c.preferences,
        c.subscription
    FROM companies c
    WHERE LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]', '', 'g')) = LOWER(subdomain_param)
    AND c.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_feature(
    company_id_param UUID,
    feature_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    subscription_data JSONB;
    feature_enabled BOOLEAN DEFAULT FALSE;
BEGIN
    SELECT subscription INTO subscription_data
    FROM companies
    WHERE id = company_id_param;

    IF subscription_data IS NULL THEN
        RETURN FALSE;
    END IF;

    CASE feature_name
        WHEN 'advanced_features' THEN
            feature_enabled := (subscription_data->>'advancedFeaturesEnabled')::BOOLEAN;
        WHEN 'custom_branding' THEN
            feature_enabled := (subscription_data->>'customBrandingEnabled')::BOOLEAN;
        WHEN 'priority_support' THEN
            feature_enabled := (subscription_data->>'prioritySupportEnabled')::BOOLEAN;
        WHEN 'multi_currency' THEN
            -- Check both subscription and settings
            feature_enabled := (subscription_data->>'advancedFeaturesEnabled')::BOOLEAN;
        ELSE
            feature_enabled := FALSE;
    END CASE;

    RETURN feature_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_company_by_subdomain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_subscription_feature(UUID, TEXT) TO authenticated;
