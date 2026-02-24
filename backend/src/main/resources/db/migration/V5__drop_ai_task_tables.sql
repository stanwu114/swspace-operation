-- Drop AI Task module tables and related objects
DROP TRIGGER IF EXISTS update_ai_task_updated_at ON ai_task;
DROP TABLE IF EXISTS ai_task_execution CASCADE;
DROP TABLE IF EXISTS ai_task CASCADE;
