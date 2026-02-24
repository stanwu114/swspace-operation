-- =====================================================
-- Expense Management Tables
-- =====================================================

-- Expense table (费用表)
CREATE TABLE expense (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL,                                      -- 费用发生日期
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'TRAVEL', 'BUSINESS', 'MANAGEMENT', 'OTHER'
    )),                                                              -- 费用类别
    amount DECIMAL(12, 2) NOT NULL,                                  -- 费用金额
    tax_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,                       -- 税率 (如 0.06 表示6%)
    project_id UUID REFERENCES project(id) ON DELETE SET NULL,       -- 关联项目（可选）
    description TEXT,                                                -- 费用描述/备注
    created_by UUID REFERENCES employee(id) ON DELETE SET NULL,      -- 创建人
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_date ON expense(expense_date);
CREATE INDEX idx_expense_category ON expense(category);
CREATE INDEX idx_expense_project ON expense(project_id);
CREATE INDEX idx_expense_created_by ON expense(created_by);

-- Expense Attachment table (费用附件表)
CREATE TABLE expense_attachment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_attachment_expense ON expense_attachment(expense_id);

-- Apply updated_at trigger to expense table
CREATE TRIGGER update_expense_updated_at BEFORE UPDATE ON expense FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Extend external_message_log for file support
-- =====================================================

ALTER TABLE external_message_log ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE external_message_log ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE external_message_log ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
