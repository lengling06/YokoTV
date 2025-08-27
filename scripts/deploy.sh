#!/bin/bash

# YokoTV 一键部署脚本
# 下载最新代码并部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
REPO_URL="https://github.com/MoonTechLab/LunaTV/archive/refs/heads/main.zip"
TEMP_DIR="/tmp/yokotv-update"
INSTALL_DIR="${1:-$(pwd)}"

echo -e "${BLUE}=== YokoTV 一键部署脚本 ===${NC}"
echo -e "${YELLOW}安装目录: $INSTALL_DIR${NC}"

# 检查必要工具
check_requirements() {
    echo -e "${BLUE}检查必要工具...${NC}"
    
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        echo -e "${RED}错误: 需要 curl 或 wget${NC}"
        exit 1
    fi
    
    if ! command -v unzip >/dev/null 2>&1; then
        echo -e "${RED}错误: 需要 unzip${NC}"
        exit 1
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}错误: 需要 Docker${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo -e "${RED}错误: 需要 docker-compose${NC}"
        exit 1
    fi
}

# 下载最新代码
download_latest() {
    echo -e "${BLUE}步骤 1/6: 下载最新代码...${NC}"
    
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    if command -v curl >/dev/null 2>&1; then
        curl -L "$REPO_URL" -o "$TEMP_DIR/latest.zip"
    else
        wget "$REPO_URL" -O "$TEMP_DIR/latest.zip"
    fi
    
    cd "$TEMP_DIR"
    unzip -q latest.zip
    
    # 查找解压后的目录
    EXTRACTED_DIR=$(find . -maxdepth 1 -type d -name "*-main" -o -name "*-master" | head -n1)
    if [ -z "$EXTRACTED_DIR" ]; then
        echo -e "${RED}错误: 无法找到解压目录${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}代码下载完成${NC}"
}

# 备份当前部署
backup_current() {
    echo -e "${BLUE}步骤 2/6: 备份当前部署...${NC}"
    
    if [ -d "$INSTALL_DIR" ] && [ "$(ls -A $INSTALL_DIR)" ]; then
        BACKUP_DIR="$INSTALL_DIR/../yokotv-backup-$(date +%Y%m%d_%H%M%S)"
        
        echo -e "${YELLOW}停止当前服务...${NC}"
        cd "$INSTALL_DIR"
        docker-compose down 2>/dev/null || true
        
        echo -e "${YELLOW}创建备份...${NC}"
        cp -r "$INSTALL_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}备份已保存到: $BACKUP_DIR${NC}"
    fi
}

# 部署新版本
deploy_new() {
    echo -e "${BLUE}步骤 3/6: 部署新版本...${NC}"
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    
    # 复制新文件
    cp -r "$TEMP_DIR/$EXTRACTED_DIR/"* "$INSTALL_DIR/"
    
    # 设置执行权限
    chmod +x "$INSTALL_DIR/scripts/"*.sh 2>/dev/null || true
    
    echo -e "${GREEN}文件复制完成${NC}"
}

# 配置环境
setup_environment() {
    echo -e "${BLUE}步骤 4/6: 配置环境...${NC}"
    
    cd "$INSTALL_DIR"
    
    # 检查并创建环境配置文件
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}创建环境配置文件...${NC}"
        cat > .env << EOF
# YokoTV 环境配置
USERNAME=admin
PASSWORD=admin_password
NEXT_PUBLIC_STORAGE_TYPE=kvrocks
KVROCKS_URL=redis://moontv-kvrocks:6666
EOF
        echo -e "${GREEN}已创建 .env 文件，请根据需要修改配置${NC}"
    fi
    
    # 检查 docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}创建 docker-compose.yml...${NC}"
        # 这里可以创建一个默认的 docker-compose.yml
        echo -e "${RED}请手动创建 docker-compose.yml 文件${NC}"
    fi
}

# 启动服务
start_services() {
    echo -e "${BLUE}步骤 5/6: 启动服务...${NC}"
    
    cd "$INSTALL_DIR"
    
    # 拉取最新镜像
    docker-compose pull
    
    # 启动服务
    docker-compose up -d
    
    echo -e "${GREEN}服务启动完成${NC}"
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}步骤 6/6: 验证部署...${NC}"
    
    cd "$INSTALL_DIR"
    
    echo -e "${YELLOW}等待服务启动...${NC}"
    sleep 10
    
    echo -e "${YELLOW}服务状态:${NC}"
    docker-compose ps
    
    echo -e "${YELLOW}检查服务健康状态...${NC}"
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务运行正常${NC}"
    else
        echo -e "${YELLOW}! 服务可能还在启动中，请稍后检查${NC}"
    fi
}

# 清理临时文件
cleanup() {
    echo -e "${BLUE}清理临时文件...${NC}"
    rm -rf "$TEMP_DIR"
}

# 主执行流程
main() {
    check_requirements
    download_latest
    backup_current
    deploy_new
    setup_environment
    start_services
    verify_deployment
    cleanup
    
    echo -e "${GREEN}=== 部署完成! ===${NC}"
    echo -e "${YELLOW}访问地址: http://localhost:3000${NC}"
    echo -e "${YELLOW}查看日志: cd $INSTALL_DIR && docker-compose logs -f${NC}"
}

# 错误处理
trap 'echo -e "${RED}部署过程中出现错误${NC}"; cleanup; exit 1' ERR

# 执行主流程
main "$@"
