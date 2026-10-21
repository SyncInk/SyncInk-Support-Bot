-- 013_owner_control_panel.sql
-- Owner Control Panel, Role-Based Access Control & Audit Logging

CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'staff', 'developer', 'reviewer'
    granted_by BIGINT NOT NULL,
    granted_by_name VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user
ON admin_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_admin_roles_role
ON admin_roles (role);

-- Seed Initial Protected Primary Owner (ID: 930306512864280607)
INSERT INTO admin_roles (user_id, username, role, granted_by, granted_by_name, notes)
VALUES (
    930306512864280607,
    'SyncInk Owner',
    'owner',
    930306512864280607,
    'System Bootstrap',
    'Protected Primary Server Owner (Immutable)'
)
ON CONFLICT (user_id) DO NOTHING;

-- Audit Logging for Privileged Operations
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'ROLE_GRANTED', 'ROLE_REVOKED', 'SETTINGS_UPDATED', 'LOGIN_SUCCESS', 'LOGIN_FAILED'
    target_id VARCHAR(64),
    target_name VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
ON admin_audit_logs (created_at DESC);

-- Application Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value, description, updated_by)
VALUES
    ('recruitment_enabled', 'true', 'Whether public staff and developer applications are active', 'system'),
    ('staff_apply_channel', '1538896833852481556', 'Discord Channel ID for staff application notifications', 'system'),
    ('developer_apply_channel', '1538896901007736872', 'Discord Channel ID for developer application notifications', 'system'),
    ('support_server_invite', 'https://discord.gg/PmxfJwmQuB', 'Official public Discord support server invitation URL', 'system'),
    ('telemetry_mode', 'LIVE', 'Operational telemetry status mode (LIVE or SNAPSHOT)', 'system')
ON CONFLICT (key) DO NOTHING;
