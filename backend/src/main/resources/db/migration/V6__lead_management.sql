-- V6: Lead Management Module
-- 线索谋划模块：线索管理、谋划方案、跟踪日志

-- 1. Lead table (线索表)
CREATE TABLE lead (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_name VARCHAR(200) NOT NULL,
    source_channel VARCHAR(100),
    customer_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    estimated_amount DECIMAL(15, 2),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'VALIDATING', 'PLANNED', 'INITIAL_CONTACT', 
        'DEEP_FOLLOW', 'PROPOSAL_SUBMITTED', 'NEGOTIATION', 'WON', 'LOST'
    )),
    owner_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_status ON lead(status);
CREATE INDEX idx_lead_owner ON lead(owner_id);
CREATE INDEX idx_lead_customer ON lead(customer_name);
CREATE INDEX idx_lead_created ON lead(created_at);

-- Apply updated_at trigger
CREATE TRIGGER update_lead_updated_at
    BEFORE UPDATE ON lead
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Lead Plan table (谋划方案表)
CREATE TABLE lead_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    plan_timing VARCHAR(200),
    plan_goal TEXT NOT NULL,
    plan_strategy TEXT NOT NULL,
    created_by UUID REFERENCES employee(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_plan_lead ON lead_plan(lead_id);
CREATE INDEX idx_lead_plan_creator ON lead_plan(created_by);

-- Apply updated_at trigger
CREATE TRIGGER update_lead_plan_updated_at
    BEFORE UPDATE ON lead_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Lead Tracking Log table (跟踪日志表)
CREATE TABLE lead_tracking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    log_title VARCHAR(200) NOT NULL,
    log_content TEXT NOT NULL,
    created_by UUID REFERENCES employee(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_log_lead ON lead_tracking_log(lead_id);
CREATE INDEX idx_lead_log_date ON lead_tracking_log(log_date);
CREATE INDEX idx_lead_log_creator ON lead_tracking_log(created_by);

-- Add comments
COMMENT ON TABLE lead IS '线索表 - 存储市场线索基本信息';
COMMENT ON TABLE lead_plan IS '谋划方案表 - 存储线索的谋划策略';
COMMENT ON TABLE lead_tracking_log IS '跟踪日志表 - 日记式记录线索跟进过程';
