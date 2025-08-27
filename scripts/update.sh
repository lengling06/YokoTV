#!/bin/bash

# YokoTV 一键更新脚本
# 使用方法: ./update.sh [tag]
# 例如: ./update.sh latest 或 ./update.sh v1.0.0

set -e  # 出错时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认镜像信息
DEFAULT_IMAGE="ghcr.io/lengling06/yokotv"
DEFAULT_TAG="latest"

# 获取标签参数
TAG=${1:-$DEFAULT_TAG}
IMAGE="${DEFAULT_IMAGE}:${TAG}"

echo -e "${BLUE}=== YokoTV 更新脚本 ===${NC}"
echo -e "${YELLOW}准备更新到镜像: ${IMAGE}${NC}"

# 检查 Docker 是否运行
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}错误: Docker 未运行或无权限访问${NC}"
    exit 1
fi

# 检查 docker-compose 文件是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 找不到 docker-compose.yml 文件${NC}"
    echo -e "${YELLOW}请确保在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}步骤 1/5: 拉取最新镜像...${NC}"
docker pull $IMAGE

echo -e "${BLUE}步骤 2/5: 停止当前服务...${NC}"
docker-compose down

echo -e "${BLUE}步骤 3/5: 备份数据（如果存在）...${NC}"
if [ -d "./data" ]; then
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r ./data "$BACKUP_DIR/"
    echo -e "${GREEN}数据已备份到: $BACKUP_DIR${NC}"
fi

echo -e "${BLUE}步骤 4/5: 更新 docker-compose.yml 中的镜像标签...${NC}"
# 使用 sed 更新镜像标签
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|image: ghcr.io/lengling06/yokotv:.*|image: $IMAGE|g" docker-compose.yml
else
    # Linux
    sed -i "s|image: ghcr.io/lengling06/yokotv:.*|image: $IMAGE|g" docker-compose.yml
fi

echo -e "${BLUE}步骤 5/5: 启动更新后的服务...${NC}"
docker-compose up -d

echo -e "${GREEN}=== 更新完成! ===${NC}"
echo -e "${YELLOW}服务状态:${NC}"
docker-compose ps

echo -e "${YELLOW}查看日志:${NC}"
echo "docker-compose logs -f yokotv-core"

echo -e "${YELLOW}访问地址:${NC}"
echo "http://localhost:3000"
