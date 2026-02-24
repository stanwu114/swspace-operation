#!/bin/bash
# ============================================================
# ReMe 记忆服务启动脚本
# 默认使用 HTTP 模式，监听 8002 端口
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

# 检查虚拟环境
if [ ! -d "$VENV_DIR" ]; then
    echo "[ERROR] 未找到 Python 虚拟环境: $VENV_DIR"
    echo "请先运行: python3.12 -m venv $VENV_DIR && $VENV_DIR/bin/pip install reme-ai"
    exit 1
fi

# 加载 .env 配置
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep -v '^\s*$' | xargs)
    echo "[INFO] 已加载 .env 配置"
fi

# 默认参数（可通过环境变量覆盖）
REME_PORT="${REME_PORT:-8002}"
REME_LLM_MODEL="${REME_LLM_MODEL:-gpt-4o-mini}"
REME_EMBEDDING_MODEL="${REME_EMBEDDING_MODEL:-text-embedding-3-small}"
REME_VECTOR_BACKEND="${REME_VECTOR_BACKEND:-local}"

echo "[INFO] 启动 ReMe 记忆服务..."
echo "[INFO] 端口: $REME_PORT"
echo "[INFO] LLM 模型: $REME_LLM_MODEL"
echo "[INFO] Embedding 模型: $REME_EMBEDDING_MODEL"
echo "[INFO] 向量存储: $REME_VECTOR_BACKEND"

cd "$SCRIPT_DIR"
exec "$VENV_DIR/bin/reme" \
    backend=http \
    http.port="$REME_PORT" \
    llm.default.model_name="$REME_LLM_MODEL" \
    embedding_model.default.model_name="$REME_EMBEDDING_MODEL" \
    vector_store.default.backend="$REME_VECTOR_BACKEND"
