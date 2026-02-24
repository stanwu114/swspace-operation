#!/bin/bash
# ============================================================
# swcom-qoder backend 编译启动脚本
# 自动配置 JAVA_HOME 为 openjdk@17（Homebrew 安装）
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 自动检测 Java 17 路径
if [ -d "/opt/homebrew/Cellar/openjdk@17" ]; then
    JDK17_VERSION=$(ls /opt/homebrew/Cellar/openjdk@17/ | sort -V | tail -1)
    export JAVA_HOME="/opt/homebrew/Cellar/openjdk@17/${JDK17_VERSION}/libexec/openjdk.jdk/Contents/Home"
elif [ -d "/usr/local/Cellar/openjdk@17" ]; then
    JDK17_VERSION=$(ls /usr/local/Cellar/openjdk@17/ | sort -V | tail -1)
    export JAVA_HOME="/usr/local/Cellar/openjdk@17/${JDK17_VERSION}/libexec/openjdk.jdk/Contents/Home"
elif [ -n "$JAVA_HOME" ]; then
    echo "[INFO] 使用环境变量 JAVA_HOME: $JAVA_HOME"
else
    echo "[ERROR] 未找到 Java 17，请通过 Homebrew 安装: brew install openjdk@17"
    exit 1
fi

echo "[INFO] JAVA_HOME=$JAVA_HOME"
echo "[INFO] Java version: $($JAVA_HOME/bin/java -version 2>&1 | head -1)"

ACTION="${1:-run}"

case "$ACTION" in
    compile)
        echo "[INFO] 编译项目..."
        "$SCRIPT_DIR/mvnw" clean compile -f "$SCRIPT_DIR/pom.xml"
        ;;
    package)
        echo "[INFO] 打包项目..."
        "$SCRIPT_DIR/mvnw" clean package -DskipTests -f "$SCRIPT_DIR/pom.xml"
        ;;
    test)
        echo "[INFO] 运行测试..."
        "$SCRIPT_DIR/mvnw" test -f "$SCRIPT_DIR/pom.xml"
        ;;
    run)
        echo "[INFO] 启动后端服务..."
        "$SCRIPT_DIR/mvnw" spring-boot:run -f "$SCRIPT_DIR/pom.xml"
        ;;
    clean)
        echo "[INFO] 清理构建产物..."
        "$SCRIPT_DIR/mvnw" clean -f "$SCRIPT_DIR/pom.xml"
        ;;
    *)
        echo "用法: $0 {compile|package|test|run|clean}"
        echo "  compile  - 编译项目"
        echo "  package  - 打包项目 (跳过测试)"
        echo "  test     - 运行测试"
        echo "  run      - 启动后端服务 (默认)"
        echo "  clean    - 清理构建产物"
        exit 1
        ;;
esac
