-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "vector";  -- Requires pgvector, enable when available
-- CREATE EXTENSION IF NOT EXISTS "postgis";  -- Requires postgis, enable when available

-- =====================================================
-- Organization Management Tables
-- =====================================================

-- Department table (supports tree structure)
CREATE TABLE department (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES department(id) ON DELETE SET NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_department_parent ON department(parent_id);

-- Position table
CREATE TABLE position (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    responsibilities TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_position_department ON position(department_id);

-- Employee table (supports both human and AI)
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    employee_type VARCHAR(20) NOT NULL CHECK (employee_type IN ('HUMAN', 'AI')),
    -- Human employee fields
    phone VARCHAR(50),
    source_company VARCHAR(200),
    -- Common fields
    position_id UUID REFERENCES position(id) ON DELETE SET NULL,
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    daily_cost DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_type ON employee(employee_type);
CREATE INDEX idx_employee_department ON employee(department_id);
CREATE INDEX idx_employee_position ON employee(position_id);

-- AI Employee Configuration table
CREATE TABLE ai_employee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employee(id) ON DELETE CASCADE,
    api_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    model_name VARCHAR(100),
    role_prompt TEXT,
    connection_status VARCHAR(20) DEFAULT 'UNKNOWN' CHECK (connection_status IN ('CONNECTED', 'FAILED', 'UNKNOWN')),
    last_test_time TIMESTAMP,
    available_models JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_config_employee ON ai_employee_config(employee_id);

-- =====================================================
-- Project Management Tables
-- =====================================================

-- Project table
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_no VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(200) NOT NULL,
    project_category VARCHAR(50) NOT NULL CHECK (project_category IN (
        'PRE_SALE', 'PLANNING', 'RESEARCH', 'BLUEBIRD', 'DELIVERY', 'STRATEGIC'
    )),
    objective TEXT,
    content TEXT,
    leader_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    start_date DATE,
    client_name VARCHAR(200),
    client_contact VARCHAR(100),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'
    )),
    subcontract_entity VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_category ON project(project_category);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_leader ON project(leader_id);

-- Project Document table
CREATE TABLE project_document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploader_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_doc_project ON project_document(project_id);

-- Project Weekly Report table
CREATE TABLE project_weekly_report (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    content TEXT,
    generated_by_task_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weekly_report_project ON project_weekly_report(project_id);
CREATE INDEX idx_weekly_report_week ON project_weekly_report(week_start_date);

-- Project Cost table
CREATE TABLE project_cost (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    cost_type VARCHAR(50) NOT NULL CHECK (cost_type IN ('LABOR', 'PROCUREMENT', 'OTHER')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    cost_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_cost_project ON project_cost(project_id);

-- =====================================================
-- AI Task Tables
-- =====================================================

-- AI Task table
CREATE TABLE ai_task (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(200) NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
        'INTELLIGENCE', 'DOCUMENT', 'DATA_ANALYSIS', 'REPORT', 'OTHER'
    )),
    description TEXT,
    execution_mode VARCHAR(30) NOT NULL CHECK (execution_mode IN (
        'SCHEDULED', 'PERIODIC', 'CUSTOM'
    )),
    schedule_config JSONB NOT NULL,
    position_id UUID REFERENCES position(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    project_id UUID REFERENCES project(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED')),
    api_endpoint VARCHAR(200),
    prompt_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_task_type ON ai_task(task_type);
CREATE INDEX idx_ai_task_status ON ai_task(status);
CREATE INDEX idx_ai_task_project ON ai_task(project_id);

-- AI Task Execution table
CREATE TABLE ai_task_execution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES ai_task(id) ON DELETE CASCADE,
    executor_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    tokens_used INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_execution_task ON ai_task_execution(task_id);
CREATE INDEX idx_task_execution_status ON ai_task_execution(status);
CREATE INDEX idx_task_execution_time ON ai_task_execution(start_time);

-- =====================================================
-- Contract Management Tables
-- =====================================================

-- Contract table
CREATE TABLE contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_no VARCHAR(50) NOT NULL UNIQUE,
    party_a VARCHAR(200) NOT NULL,
    party_b VARCHAR(200) NOT NULL,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('PAYMENT', 'RECEIPT')),
    amount DECIMAL(14, 2) NOT NULL,
    project_id UUID REFERENCES project(id) ON DELETE SET NULL,
    subcontract_entity VARCHAR(200),
    signing_date DATE,
    contract_file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SIGNED', 'EXECUTING', 'COMPLETED', 'CANCELLED'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_type ON contract(contract_type);
CREATE INDEX idx_contract_project ON contract(project_id);
CREATE INDEX idx_contract_status ON contract(status);

-- Payment Node table
CREATE TABLE payment_node (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    node_name VARCHAR(100) NOT NULL,
    node_order INT NOT NULL DEFAULT 0,
    planned_amount DECIMAL(14, 2) NOT NULL,
    planned_date DATE NOT NULL,
    actual_amount DECIMAL(14, 2),
    actual_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'COMPLETED', 'OVERDUE'
    )),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_node_contract ON payment_node(contract_id);
CREATE INDEX idx_payment_node_status ON payment_node(status);

-- Bid Info table
CREATE TABLE bid_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL UNIQUE REFERENCES contract(id) ON DELETE CASCADE,
    bid_unit VARCHAR(200),
    bid_announce_date DATE,
    bid_announce_doc_path VARCHAR(500),
    bid_submit_date DATE,
    bid_submit_doc_path VARCHAR(500),
    win_date DATE,
    win_doc_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bid_info_contract ON bid_info(contract_id);

-- =====================================================
-- AI Assistant Tables
-- =====================================================

-- AI Conversation table
CREATE TABLE ai_conversation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name VARCHAR(50) NOT NULL,
    context_id UUID,
    title VARCHAR(200),
    conversation_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversation_module ON ai_conversation(module_name);
CREATE INDEX idx_ai_conversation_context ON ai_conversation(context_id);

-- AI Message table
CREATE TABLE ai_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversation(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
    content TEXT NOT NULL,
    attachments JSONB,
    tokens_used INT,
    message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_message_conversation ON ai_message(conversation_id);
CREATE INDEX idx_ai_message_time ON ai_message(message_time);

-- AI Memory table (with vector for RAG)
CREATE TABLE ai_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversation(id) ON DELETE SET NULL,
    memory_type VARCHAR(30) NOT NULL CHECK (memory_type IN (
        'FACT', 'PREFERENCE', 'WORKFLOW', 'CONTEXT'
    )),
    content TEXT NOT NULL,
    embedding TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_memory_type ON ai_memory(memory_type);
CREATE INDEX idx_ai_memory_conversation ON ai_memory(conversation_id);
-- CREATE INDEX idx_ai_memory_embedding ON ai_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- Project Number Sequence
-- =====================================================

CREATE SEQUENCE project_no_seq START WITH 1 INCREMENT BY 1;

-- Function to generate project number
CREATE OR REPLACE FUNCTION generate_project_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_no IS NULL OR NEW.project_no = '' THEN
        NEW.project_no := 'PRJ-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(nextval('project_no_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_project_no
    BEFORE INSERT ON project
    FOR EACH ROW
    EXECUTE FUNCTION generate_project_no();

-- =====================================================
-- Contract Number Sequence
-- =====================================================

CREATE SEQUENCE contract_no_seq START WITH 1 INCREMENT BY 1;

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_no IS NULL OR NEW.contract_no = '' THEN
        NEW.contract_no := 'CON-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(nextval('contract_no_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_contract_no
    BEFORE INSERT ON contract
    FOR EACH ROW
    EXECUTE FUNCTION generate_contract_no();

-- =====================================================
-- Updated At Trigger Function
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_department_updated_at BEFORE UPDATE ON department FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_position_updated_at BEFORE UPDATE ON position FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_updated_at BEFORE UPDATE ON employee FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_employee_config_updated_at BEFORE UPDATE ON ai_employee_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_weekly_report_updated_at BEFORE UPDATE ON project_weekly_report FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_task_updated_at BEFORE UPDATE ON ai_task FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_updated_at BEFORE UPDATE ON contract FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_node_updated_at BEFORE UPDATE ON payment_node FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bid_info_updated_at BEFORE UPDATE ON bid_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversation_updated_at BEFORE UPDATE ON ai_conversation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON ai_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
