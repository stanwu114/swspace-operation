# 费用管理模块设计规划

## 概述
在财务管理下开发费用管理模块，支持流水式记账、条件筛选、Excel导出，以及通过Telegram上传发票并由AI自动识别填充。

## 功能1: 费用管理模块

### 1.1 数据库设计

#### Expense 表
```sql
CREATE TABLE expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,           -- 费用发生日期
    category VARCHAR(50) NOT NULL,        -- 费用类别
    amount DECIMAL(12,2) NOT NULL,        -- 费用金额
    tax_rate DECIMAL(5,2) NOT NULL,       -- 税率 (如 0.06 表示6%)
    project_id UUID,                      -- 关联项目（可选）
    description TEXT,                     -- 费用描述/备注
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE INDEX idx_expense_date ON expense(expense_date);
CREATE INDEX idx_expense_category ON expense(category);
CREATE INDEX idx_expense_project ON expense(project_id);
```

#### ExpenseAttachment 表
```sql
CREATE TABLE expense_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense FOREIGN KEY (expense_id) REFERENCES expense(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachment_expense ON expense_attachment(expense_id);
```

### 1.2 后端实现

#### Entity 层
- `Expense.java` - 费用实体
- `ExpenseAttachment.java` - 费用附件实体
- `ExpenseCategory.java` - 费用类别枚举 (TRAVEL, BUSINESS, MANAGEMENT, OTHER)

#### Repository 层
- `ExpenseRepository.java` - JPA Repository，支持复杂筛选查询

#### Service 层
- `ExpenseService.java` - 业务逻辑
  - `createExpense()` - 创建费用
  - `updateExpense()` - 更新费用
  - `deleteExpense()` - 删除费用
  - `getExpenseById()` - 获取单条
  - `searchExpenses()` - 条件搜索
  - `exportToExcel()` - Excel导出

#### Controller 层
- `ExpenseController.java` - REST API
  - `POST /api/expenses` - 创建
  - `PUT /api/expenses/{id}` - 更新
  - `DELETE /api/expenses/{id}` - 删除
  - `GET /api/expenses/{id}` - 获取单条
  - `GET /api/expenses` - 列表查询（支持筛选参数）
  - `POST /api/expenses/export` - 导出Excel
  - `POST /api/expenses/{id}/attachments` - 上传附件
  - `DELETE /api/expenses/{id}/attachments/{attachmentId}` - 删除附件

#### DTO 层
- `ExpenseDTO.java` - 响应DTO
- `ExpenseForm.java` - 创建/更新表单
- `ExpenseSearchParams.java` - 搜索参数
- `ExpenseAttachmentDTO.java` - 附件DTO

### 1.3 前端实现

#### Redux Slice
- `expenseSlice.ts` - 状态管理

#### API Service
- `expenseApi.ts` - API 调用封装

#### 页面组件
- `ExpenseList.tsx` - 费用列表页
  - 筛选表单（日期范围、类别、项目）
  - 数据表格（支持选择）
  - 一键全选/取消按钮
  - 导出Excel按钮
- `ExpenseForm.tsx` - 费用表单（新建/编辑）
- `ExpenseDetail.tsx` - 费用详情（含附件管理）

#### 路由配置
- 添加到财务管理子菜单

---

## 功能2: Telegram发票上传与AI处理

### 2.1 Telegram适配器增强

#### 消息类型扩展
```java
public enum MessageType {
    TEXT,
    IMAGE,      // photo
    DOCUMENT,   // document (PDF, etc.)
    VOICE,
    VIDEO
}
```

#### TelegramAdapter 增强
- `parseIncomingMessage()` - 识别文件类型消息
- `downloadFile()` - 从Telegram下载文件
- `getFileInfo()` - 获取文件信息

### 2.2 文件处理流程

```
Telegram用户发送发票图片/PDF + 项目名称
    ↓
TelegramAdapter 解析消息，识别为文件类型
    ↓
下载文件到临时目录
    ↓
存储消息为 PENDING 状态（含文件路径）
    ↓
前端轮询获取待处理消息
    ↓
AI助手识别发票内容（调用Vision API或文档解析）
    ↓
AI助手调用 create_expense Tool 自动创建费用记录
    ↓
附件自动关联到费用记录
    ↓
同步回复到Telegram
```

### 2.3 AI Tool 定义

#### create_expense Tool
```java
@Tool(name = "create_expense", description = "创建费用记录")
public String createExpense(
    @ToolParam(description = "费用发生日期，格式 YYYY-MM-DD") String expenseDate,
    @ToolParam(description = "费用类别: TRAVEL/BUSINESS/MANAGEMENT/OTHER") String category,
    @ToolParam(description = "费用金额") Double amount,
    @ToolParam(description = "税率，如0.06表示6%") Double taxRate,
    @ToolParam(description = "关联项目名称或ID，可选") String projectRef,
    @ToolParam(description = "费用描述") String description,
    @ToolParam(description = "附件文件路径，可选") String attachmentPath
) { ... }
```

### 2.4 MessageLog 扩展

```sql
ALTER TABLE message_log ADD COLUMN file_path VARCHAR(500);
ALTER TABLE message_log ADD COLUMN file_type VARCHAR(50);
ALTER TABLE message_log ADD COLUMN file_name VARCHAR(255);
```

### 2.5 前端处理增强

AIAssistantPanel 处理包含文件的Telegram消息时：
1. 显示文件预览（如果是图片）
2. 将文件内容（base64/URL）传递给AI
3. AI识别后自动调用 create_expense Tool

---

## 实施步骤

### 阶段1: 费用管理基础模块
1. 创建数据库迁移脚本
2. 实现后端 Entity/Repository/Service/Controller
3. 实现前端 Redux/API/页面组件
4. 测试基础CRUD功能

### 阶段2: Excel导出功能
1. 添加 Apache POI 依赖
2. 实现 ExcelExportService
3. 实现导出API和前端交互

### 阶段3: Telegram文件处理
1. 扩展 MessageLog 表结构
2. 增强 TelegramAdapter 支持文件类型
3. 实现 Telegram 文件下载
4. 更新前端轮询逻辑处理文件消息

### 阶段4: AI发票识别
1. 实现 create_expense AI Tool
2. 配置AI Vision能力识别发票图片
3. 集成完整流程测试

---

## 技术依赖

- Apache POI: Excel导出
- Telegram Bot API: getFile 接口下载文件
- AI Vision API: 图片内容识别（使用现有AI配置）
