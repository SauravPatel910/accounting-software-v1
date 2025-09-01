-- Audit Logs table for comprehensive audit trail implementation
-- This table manages audit trails, user action tracking, data change history, and GDPR compliance

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID,
    company_id UUID NOT NULL,
    description TEXT NOT NULL,
    changes JSONB,
    context JSONB,
    result VARCHAR(20) NOT NULL DEFAULT 'success',
    severity VARCHAR(20) NOT NULL DEFAULT 'low',
    error_message TEXT,
    additional_data JSONB,
    tags TEXT[],
    is_system_generated BOOLEAN NOT NULL DEFAULT FALSE,
    requires_retention BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_action_check
CHECK (action IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'cancel', 'restore', 'archive', 'bulk_operation'));

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_entity_type_check
CHECK (entity_type IN ('user', 'company', 'account', 'transaction', 'invoice', 'payment', 'customer', 'vendor', 'product', 'report', 'settings', 'audit_log'));

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_result_check
CHECK (result IN ('success', 'failure', 'partial'));

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_severity_check
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON public.audit_logs (result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_system_generated ON public.audit_logs (is_system_generated);
CREATE INDEX IF NOT EXISTS idx_audit_logs_requires_retention ON public.audit_logs (requires_retention);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_entity ON public.audit_logs (company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs (user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_operations ON public.audit_logs (result, severity, created_at) WHERE result = 'failure';

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes_gin ON public.audit_logs USING gin (changes);
CREATE INDEX IF NOT EXISTS idx_audit_logs_context_gin ON public.audit_logs USING gin (context);
CREATE INDEX IF NOT EXISTS idx_audit_logs_additional_data_gin ON public.audit_logs USING gin (additional_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tags_gin ON public.audit_logs USING gin (tags);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Admins can view all audit logs from their company
CREATE POLICY "Admins can view company audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.company_id = audit_logs.company_id
        )
    );

-- Managers can view audit logs from their company (excluding sensitive admin actions)
CREATE POLICY "Managers can view limited company audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users manager_user
            WHERE manager_user.id = auth.uid()
            AND manager_user.role IN ('admin', 'manager')
            AND manager_user.company_id = audit_logs.company_id
        )
        AND NOT (action IN ('delete', 'export') AND entity_type = 'user')
    );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (
        user_id = auth.uid()
        AND entity_type = 'user'
        AND entity_id = auth.uid()::text
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Only admins can delete audit logs (for retention policy compliance)
CREATE POLICY "Admins can delete expired audit logs" ON public.audit_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
        )
        AND requires_retention = false
    );

-- Create GDPR requests table
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_type VARCHAR(20) NOT NULL,
    subject_user_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    company_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reason TEXT,
    requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_date TIMESTAMP WITH TIME ZONE,
    result JSONB,
    additional_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints for GDPR requests
ALTER TABLE public.gdpr_requests
ADD CONSTRAINT gdpr_requests_type_check
CHECK (request_type IN ('access', 'portability', 'deletion', 'rectification'));

ALTER TABLE public.gdpr_requests
ADD CONSTRAINT gdpr_requests_status_check
CHECK (status IN ('pending', 'processing', 'completed', 'rejected'));

-- Create indexes for GDPR requests
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_subject_user_id ON public.gdpr_requests (subject_user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_requested_by ON public.gdpr_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_company_id ON public.gdpr_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests (status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON public.gdpr_requests (request_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_created_at ON public.gdpr_requests (created_at);

-- Create data retention policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    retention_days INTEGER NOT NULL,
    minimum_severity VARCHAR(20),
    archive_before_deletion BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints for retention policies
ALTER TABLE public.data_retention_policies
ADD CONSTRAINT retention_policies_entity_type_check
CHECK (entity_type IN ('user', 'company', 'account', 'transaction', 'invoice', 'payment', 'customer', 'vendor', 'product', 'report', 'settings', 'audit_log'));

ALTER TABLE public.data_retention_policies
ADD CONSTRAINT retention_policies_severity_check
CHECK (minimum_severity IN ('low', 'medium', 'high', 'critical') OR minimum_severity IS NULL);

-- Create indexes for retention policies
CREATE INDEX IF NOT EXISTS idx_retention_policies_entity_type ON public.data_retention_policies (entity_type);
CREATE INDEX IF NOT EXISTS idx_retention_policies_is_active ON public.data_retention_policies (is_active);

-- Create audit alerts table
CREATE TABLE IF NOT EXISTS public.audit_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    related_audit_log_id UUID,
    company_id UUID NOT NULL,
    triggered_by UUID,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints for audit alerts
ALTER TABLE public.audit_alerts
ADD CONSTRAINT audit_alerts_type_check
CHECK (type IN ('security', 'compliance', 'suspicious', 'system'));

ALTER TABLE public.audit_alerts
ADD CONSTRAINT audit_alerts_severity_check
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Create indexes for audit alerts
CREATE INDEX IF NOT EXISTS idx_audit_alerts_type ON public.audit_alerts (type);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_severity ON public.audit_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_company_id ON public.audit_alerts (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_is_resolved ON public.audit_alerts (is_resolved);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_created_at ON public.audit_alerts (created_at);

-- Create foreign key constraints
ALTER TABLE public.audit_logs
ADD CONSTRAINT fk_audit_logs_user_id
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs
ADD CONSTRAINT fk_audit_logs_company_id
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.gdpr_requests
ADD CONSTRAINT fk_gdpr_requests_subject_user_id
FOREIGN KEY (subject_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.gdpr_requests
ADD CONSTRAINT fk_gdpr_requests_requested_by
FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.gdpr_requests
ADD CONSTRAINT fk_gdpr_requests_company_id
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.data_retention_policies
ADD CONSTRAINT fk_retention_policies_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.audit_alerts
ADD CONSTRAINT fk_audit_alerts_related_audit_log_id
FOREIGN KEY (related_audit_log_id) REFERENCES public.audit_logs(id) ON DELETE SET NULL;

ALTER TABLE public.audit_alerts
ADD CONSTRAINT fk_audit_alerts_company_id
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.audit_alerts
ADD CONSTRAINT fk_audit_alerts_triggered_by
FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_alerts
ADD CONSTRAINT fk_audit_alerts_resolved_by
FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Create updated_at trigger function for GDPR requests
CREATE OR REPLACE FUNCTION update_gdpr_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for GDPR requests updated_at
DROP TRIGGER IF EXISTS update_gdpr_requests_updated_at ON public.gdpr_requests;
CREATE TRIGGER update_gdpr_requests_updated_at
    BEFORE UPDATE ON public.gdpr_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_gdpr_requests_updated_at();

-- Create updated_at trigger for retention policies
DROP TRIGGER IF EXISTS update_retention_policies_updated_at ON public.data_retention_policies;
CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON public.data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for audit log statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    company_id_param UUID DEFAULT NULL,
    start_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_logs BIGINT,
    logs_by_action JSONB,
    logs_by_entity_type JSONB,
    logs_by_result JSONB,
    logs_by_severity JSONB,
    unique_users BIGINT,
    failed_operations BIGINT,
    system_generated_logs BIGINT,
    user_generated_logs BIGINT
) AS $$
DECLARE
    base_query TEXT;
    where_clause TEXT := '';
BEGIN
    -- Build WHERE clause based on parameters
    IF company_id_param IS NOT NULL THEN
        where_clause := where_clause || ' AND company_id = ''' || company_id_param || '''';
    END IF;

    IF start_date_param IS NOT NULL THEN
        where_clause := where_clause || ' AND created_at >= ''' || start_date_param || '''';
    END IF;

    IF end_date_param IS NOT NULL THEN
        where_clause := where_clause || ' AND created_at <= ''' || end_date_param || '''';
    END IF;

    -- Remove leading ' AND '
    IF where_clause <> '' THEN
        where_clause := 'WHERE ' || substring(where_clause from 6);
    END IF;

    -- Build and execute the query
    base_query := 'SELECT
        COUNT(*) as total_logs,
        jsonb_object_agg(action, action_count) as logs_by_action,
        jsonb_object_agg(entity_type, entity_count) as logs_by_entity_type,
        jsonb_object_agg(result, result_count) as logs_by_result,
        jsonb_object_agg(severity, severity_count) as logs_by_severity,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE result = ''failure'') as failed_operations,
        COUNT(*) FILTER (WHERE is_system_generated = true) as system_generated_logs,
        COUNT(*) FILTER (WHERE is_system_generated = false) as user_generated_logs
    FROM (
        SELECT *,
            COUNT(*) OVER (PARTITION BY action) as action_count,
            COUNT(*) OVER (PARTITION BY entity_type) as entity_count,
            COUNT(*) OVER (PARTITION BY result) as result_count,
            COUNT(*) OVER (PARTITION BY severity) as severity_count
        FROM audit_logs ' || where_clause || '
    ) stats_data';

    RETURN QUERY EXECUTE base_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for GDPR data export
CREATE OR REPLACE FUNCTION export_user_data_for_gdpr(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB := '{}';
    table_data JSONB;
    table_name TEXT;
BEGIN
    -- Export data from all relevant tables
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'audit_logs', 'gdpr_requests')
    LOOP
        EXECUTE format(
            'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM %I t WHERE user_id = $1 OR id = $1',
            table_name
        ) INTO table_data USING user_id_param;

        user_data := user_data || jsonb_build_object(table_name, table_data);
    END LOOP;

    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for automated audit log cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    policy RECORD;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Process each active retention policy
    FOR policy IN
        SELECT * FROM data_retention_policies
        WHERE is_active = true
    LOOP
        cutoff_date := NOW() - INTERVAL '1 day' * policy.retention_days;

        -- Delete logs based on policy
        IF policy.minimum_severity IS NOT NULL THEN
            DELETE FROM audit_logs
            WHERE entity_type = policy.entity_type
            AND created_at < cutoff_date
            AND requires_retention = false
            AND severity IN (
                SELECT unnest(ARRAY['low', 'medium', 'high', 'critical'][1:
                    CASE policy.minimum_severity
                        WHEN 'low' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'high' THEN 3
                        WHEN 'critical' THEN 4
                    END - 1
                ])
            );
        ELSE
            DELETE FROM audit_logs
            WHERE entity_type = policy.entity_type
            AND created_at < cutoff_date
            AND requires_retention = false;
        END IF;

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END LOOP;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default retention policies
INSERT INTO public.data_retention_policies (
    entity_type,
    retention_days,
    minimum_severity,
    archive_before_deletion,
    created_by
) VALUES
(
    'user',
    2555, -- 7 years
    'medium',
    true,
    '00000000-0000-0000-0000-000000000001' -- System/Admin user
),
(
    'transaction',
    2555, -- 7 years
    'low',
    true,
    '00000000-0000-0000-0000-000000000001'
),
(
    'invoice',
    2555, -- 7 years
    'low',
    true,
    '00000000-0000-0000-0000-000000000001'
),
(
    'audit_log',
    1095, -- 3 years
    'medium',
    true,
    '00000000-0000-0000-0000-000000000001'
),
(
    'settings',
    365, -- 1 year
    'low',
    false,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.gdpr_requests TO authenticated;
GRANT ALL ON public.data_retention_policies TO authenticated;
GRANT ALL ON public.audit_alerts TO authenticated;

GRANT SELECT ON public.audit_logs TO anon;
GRANT EXECUTE ON FUNCTION get_audit_statistics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data_for_gdpr(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_audit_logs() TO authenticated;

-- Create sample audit logs for demonstration
INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    user_id,
    company_id,
    description,
    result,
    severity,
    is_system_generated
) VALUES
(
    'login',
    'user',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'User login successful',
    'success',
    'low',
    false
),
(
    'create',
    'company',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Company profile created',
    'success',
    'medium',
    false
),
(
    'update',
    'user',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'User profile updated',
    'success',
    'low',
    false
)
ON CONFLICT DO NOTHING;
