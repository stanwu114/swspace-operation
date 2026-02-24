-- V7: 简化线索模块，删除谋划功能，添加标签功能

-- 删除 lead_plan 表
DROP TABLE IF EXISTS lead_plan;

-- 为 lead 表添加 tags 字段（使用逗号分隔的字符串存储标签）
ALTER TABLE lead ADD COLUMN IF NOT EXISTS tags VARCHAR(500);

-- 为标签创建索引以支持模糊搜索
CREATE INDEX IF NOT EXISTS idx_lead_tags ON lead(tags);
