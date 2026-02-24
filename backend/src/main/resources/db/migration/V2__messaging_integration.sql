-- =====================================================
-- External Messaging Platform Integration
-- =====================================================

-- 1. Messaging platform configuration table
CREATE TABLE messaging_platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_type VARCHAR(30) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    webhook_url VARCHAR(500),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mpc_platform_type ON messaging_platform_config(platform_type);

-- 2. External user binding table
CREATE TABLE external_user_binding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    platform_type VARCHAR(30) NOT NULL,
    platform_user_id VARCHAR(100) NOT NULL,
    platform_username VARCHAR(255),
    binding_code VARCHAR(10),
    binding_status VARCHAR(20) DEFAULT 'PENDING',
    bound_at TIMESTAMP,
    code_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (platform_type, platform_user_id)
);

CREATE INDEX idx_eub_employee ON external_user_binding(employee_id);
CREATE INDEX idx_eub_platform_user ON external_user_binding(platform_type, platform_user_id);
CREATE INDEX idx_eub_binding_code ON external_user_binding(binding_code);
CREATE INDEX idx_eub_status ON external_user_binding(binding_status);

-- 3. External message log table
CREATE TABLE external_message_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    binding_id UUID REFERENCES external_user_binding(id) ON DELETE SET NULL,
    platform_type VARCHAR(30) NOT NULL,
    conversation_id UUID REFERENCES ai_conversation(id) ON DELETE SET NULL,
    direction VARCHAR(10) NOT NULL,
    message_type VARCHAR(30) DEFAULT 'TEXT',
    content TEXT,
    raw_payload JSONB,
    processing_status VARCHAR(20) DEFAULT 'RECEIVED',
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eml_binding ON external_message_log(binding_id);
CREATE INDEX idx_eml_platform ON external_message_log(platform_type);
CREATE INDEX idx_eml_conversation ON external_message_log(conversation_id);
CREATE INDEX idx_eml_status ON external_message_log(processing_status);
CREATE INDEX idx_eml_created ON external_message_log(created_at);

-- 4. Async message task table
CREATE TABLE async_message_task (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_log_id UUID REFERENCES external_message_log(id) ON DELETE SET NULL,
    binding_id UUID REFERENCES external_user_binding(id) ON DELETE SET NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    priority INT DEFAULT 5,
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_amt_status ON async_message_task(status);
CREATE INDEX idx_amt_binding ON async_message_task(binding_id);
CREATE INDEX idx_amt_priority ON async_message_task(priority, created_at);

-- Apply updated_at triggers
CREATE TRIGGER update_messaging_platform_config_updated_at BEFORE UPDATE ON messaging_platform_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
