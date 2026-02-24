// Common types
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// Organization types
export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  children?: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  name: string;
  departmentId: string;
  departmentName?: string;
  responsibilities: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeType = 'HUMAN' | 'AI';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: string;
  name: string;
  employeeType: EmployeeType;
  phone: string | null;
  sourceCompany: string | null;
  positionId: string | null;
  positionName?: string;
  departmentId: string | null;
  departmentName?: string;
  dailyCost: number;
  status: EmployeeStatus;
  aiConfig?: AIEmployeeConfig;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionStatus = 'CONNECTED' | 'FAILED' | 'UNKNOWN';

export interface AIEmployeeConfig {
  id: string;
  employeeId: string;
  apiUrl: string;
  apiKey: string;
  modelName: string | null;
  rolePrompt: string | null;
  connectionStatus: ConnectionStatus;
  lastTestTime: string | null;
  availableModels: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// Project types
export type ProjectCategory = 'PRE_SALE' | 'PLANNING' | 'RESEARCH' | 'BLUEBIRD' | 'DELIVERY' | 'STRATEGIC';
export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  projectNo: string;
  projectName: string;
  projectCategory: ProjectCategory;
  objective: string | null;
  content: string | null;
  leaderId: string | null;
  leaderName?: string;
  startDate: string | null;
  clientName: string | null;
  clientContact: string | null;
  status: ProjectStatus;
  subcontractEntity: string | null;
  totalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  documentName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  uploaderId: string | null;
  uploaderName?: string;
  uploadTime: string;
}

export interface ProjectWeeklyReport {
  id: string;
  projectId: string;
  weekStartDate: string;
  weekEndDate: string;
  content: string | null;
  generatedByTaskId: string | null;
  createdAt: string;
}

export type CostType = 'LABOR' | 'PROCUREMENT' | 'OTHER';

export interface ProjectCost {
  id: string;
  projectId: string;
  costType: CostType;
  amount: number;
  description: string | null;
  costDate: string;
}

// Contract types
export type ContractType = 'PAYMENT' | 'RECEIPT';
export type ContractStatus = 'DRAFT' | 'SIGNED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED';
export type PaymentNodeStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface Contract {
  id: string;
  contractNo: string;
  partyA: string;
  partyB: string;
  contractType: ContractType;
  amount: number;
  projectId: string | null;
  projectName?: string;
  subcontractEntity: string | null;
  signingDate: string | null;
  contractFilePath: string | null;
  status: ContractStatus;
  bidInfo?: BidInfo;
  paymentNodes?: PaymentNode[];
  paidAmount?: number;
  completedNodes?: number;
  totalNodes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentNode {
  id: string;
  contractId: string;
  nodeName: string;
  nodeOrder: number;
  plannedAmount: number;
  plannedDate: string;
  actualAmount: number | null;
  actualDate: string | null;
  status: PaymentNodeStatus;
  remarks: string | null;
}

export interface BidInfo {
  id: string;
  contractId: string;
  bidUnit: string | null;
  bidAnnounceDate: string | null;
  bidAnnounceDocPath: string | null;
  bidSubmitDate: string | null;
  bidSubmitDocPath: string | null;
  winDate: string | null;
  winDocPath: string | null;
}

// AI Assistant types
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MemoryType = 'FACT' | 'PREFERENCE' | 'WORKFLOW' | 'CONTEXT';

export interface MessageAttachment {
  type: 'image' | 'document';
  fileName: string;
  filePath?: string;
  fileType: string;
  base64?: string; // data URL for Vision API
}

export interface AIConversation {
  id: string;
  moduleName: string;
  contextId: string | null;
  title: string | null;
  conversationSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  attachments: MessageAttachment[] | null;
  tokensUsed: number | null;
  messageTime: string;
}

export interface AIMemory {
  id: string;
  conversationId: string | null;
  memoryType: MemoryType;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Form types for creating/updating
export interface DepartmentForm {
  name: string;
  parentId?: string | null;
  description?: string;
  sortOrder?: number;
}

export interface PositionForm {
  name: string;
  departmentId: string;
  responsibilities?: string;
  sortOrder?: number;
}

export interface EmployeeForm {
  name: string;
  employeeType: EmployeeType;
  phone?: string;
  sourceCompany?: string;
  positionId?: string;
  departmentId?: string;
  dailyCost?: number;
}

export interface AIEmployeeConfigForm {
  apiUrl: string;
  apiKey: string;
  modelName?: string;
  rolePrompt?: string;
}

export interface ProjectForm {
  projectName: string;
  projectCategory: ProjectCategory;
  objective?: string;
  content?: string;
  leaderId?: string;
  startDate?: string;
  clientName?: string;
  clientContact?: string;
  subcontractEntity?: string;
}

export interface ContractForm {
  partyA: string;
  partyB: string;
  contractType: ContractType;
  amount: number;
  projectId?: string;
  subcontractEntity?: string;
  signingDate?: string;
}

export interface PaymentNodeForm {
  nodeName: string;
  nodeOrder?: number;
  plannedAmount: number;
  plannedDate: string;
  remarks?: string;
}

export interface BidInfoForm {
  bidUnit?: string;
  bidAnnounceDate?: string;
  bidSubmitDate?: string;
  winDate?: string;
}

// Organization Chart types
export type ChartNodeType = 'company' | 'department' | 'position' | 'employee';

export interface ChartNode {
  id: string;
  name: string;
  type: ChartNodeType;
  children?: ChartNode[];
  // 用于点击跳转的关联信息
  departmentId?: string;
  positionId?: string;
  employeeId?: string;
}

// Chat types
export interface ChatMessage {
  role: MessageRole;
  content: string;
  attachments?: File[];
}

export interface ChatRequest {
  conversationId?: string;
  moduleName: string;
  contextId?: string;
  message: string;
  attachments?: MessageAttachment[];
}

// External Messaging types
export type PlatformType = 'TELEGRAM' | 'WECHAT';
export type BindingStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type ProcessingStatus = 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface PlatformConfig {
  id: string;
  platformType: PlatformType;
  platformName: string;
  configData: Record<string, unknown>;
  webhookUrl: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBinding {
  id: string;
  employeeId: string;
  employeeName: string;
  platformType: PlatformType;
  platformUserId: string;
  platformUsername: string | null;
  bindingStatus: string;
  boundAt: string | null;
  createdAt: string;
}

export interface BindingCode {
  employeeId: string;
  bindingCode: string;
  expiresAt: string;
  deepLinkUrl: string | null;
}

export interface MessageLog {
  id: string;
  bindingId: string | null;
  platformType: PlatformType;
  conversationId: string | null;
  direction: MessageDirection;
  messageType: string;
  content: string | null;
  processingStatus: ProcessingStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}

// Expense Management types
export type ExpenseCategory = 'TRAVEL' | 'BUSINESS' | 'MANAGEMENT' | 'OTHER';

export interface Expense {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  categoryDisplayName: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  amountWithTax: number;
  projectId: string | null;
  projectName: string | null;
  description: string | null;
  createdById: string | null;
  createdByName: string | null;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface ExpenseForm {
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  taxRate?: number;
  projectId?: string;
  description?: string;
  createdById?: string;
}

export interface ExpenseSearchParams {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  projectId?: string;
}

// Lead Management types
export type LeadStatus = 
  | 'NEW' 
  | 'VALIDATING' 
  | 'PLANNED' 
  | 'INITIAL_CONTACT' 
  | 'DEEP_FOLLOW' 
  | 'PROPOSAL_SUBMITTED' 
  | 'NEGOTIATION' 
  | 'WON' 
  | 'LOST';

export interface Lead {
  id: string;
  leadName: string;
  sourceChannel: string | null;
  customerName: string;
  contactPerson: string | null;
  contactPhone: string | null;
  estimatedAmount: number | null;
  description: string | null;
  tags: string[];
  status: LeadStatus;
  ownerId: string | null;
  ownerName: string | null;
  logCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTrackingLog {
  id: string;
  leadId: string;
  logDate: string;
  logTitle: string;
  logContent: string;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface LeadForm {
  leadName: string;
  sourceChannel?: string;
  customerName: string;
  contactPerson?: string;
  contactPhone?: string;
  estimatedAmount?: number;
  description?: string;
  tags?: string[];
  status?: LeadStatus;
  ownerId?: string;
}

export interface LeadTrackingLogForm {
  logDate: string;
  logTitle: string;
  logContent: string;
}

export interface LeadSearchParams {
  status?: LeadStatus;
  ownerId?: string;
  customerName?: string;
  tag?: string;
}

// AI Task types
export type TaskType = 'INTELLIGENCE' | 'DOCUMENT' | 'DATA_ANALYSIS' | 'REPORT' | 'OTHER';
export type TaskStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';
export type ExecutionMode = 'SCHEDULED' | 'PERIODIC' | 'CUSTOM';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ScheduleConfig {
  cronExpression?: string;
  intervalMinutes?: number;
  scheduledTime?: string;
}

export interface AITask {
  id: string;
  taskName: string;
  taskType: TaskType;
  description: string | null;
  executionMode: ExecutionMode;
  scheduleConfig: ScheduleConfig;
  positionId: string | null;
  positionName?: string;
  employeeId: string | null;
  employeeName?: string;
  projectId: string | null;
  projectName?: string;
  status: TaskStatus;
  apiEndpoint: string | null;
  promptTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AITaskForm {
  taskName: string;
  taskType: TaskType;
  description?: string;
  executionMode: ExecutionMode;
  scheduleConfig: ScheduleConfig;
  positionId?: string;
  employeeId?: string;
  projectId?: string;
  status?: TaskStatus;
  apiEndpoint?: string;
  promptTemplate?: string;
}

export interface AITaskExecution {
  id: string;
  taskId: string;
  executorId: string | null;
  executorName?: string;
  startTime: string;
  endTime: string | null;
  status: ExecutionStatus;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  tokensUsed: number | null;
  createdAt: string;
}
