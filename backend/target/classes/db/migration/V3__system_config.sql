-- System configuration table for global settings
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookup by key
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Add comment
COMMENT ON TABLE system_config IS 'System-wide configuration storage';
COMMENT ON COLUMN system_config.config_key IS 'Unique configuration key';
COMMENT ON COLUMN system_config.config_value IS 'Configuration value (JSON for complex configs)';
