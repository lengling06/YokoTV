#!/bin/bash

# Git 拉取更新并重新构建脚本
# 适用于有 Git 访问权限的服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== YokoTV Git 更新脚本 ===${NC}"

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 当前目录不是 Git 仓库${NC}"
    echo -e "${YELLOW}请先执行: git clone https://github.com/YOUR_USERNAME/YokoTV.git${NC}"
    exit 1
fi

echo -e "${BLUE}步骤 1/6: 检查工作目录状态...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}警告: 工作目录有未提交的更改${NC}"
    echo -e "${YELLOW}将暂存当前更改...${NC}"
    git stash push -m "Auto stash before update $(date)"
fi

echo -e "${BLUE}步骤 2/6: 拉取最新代码...${NC}"
git fetch origin
git pull origin main || git pull origin master

echo -e "${BLUE}步骤 3/6: 停止当前服务...${NC}"
docker-compose down

echo -e "${BLUE}步骤 4/6: 备份数据...${NC}"
if [ -d "./data" ]; then
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r ./data "$BACKUP_DIR/"
    echo -e "${GREEN}数据已备份到: $BACKUP_DIR${NC}"
fi

echo -e "${BLUE}步骤 5/6: 重新构建镜像...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}步骤 6/6: 启动服务...${NC}"
docker-compose up -d

echo -e "${GREEN}=== 更新完成! ===${NC}"
echo -e "${YELLOW}服务状态:${NC}"
docker-compose ps

# 恢复之前暂存的更改（如果有）
if git stash list | grep -q "Auto stash before update"; then
    echo -e "${YELLOW}是否要恢复之前暂存的更改? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git stash pop
        echo -e "${GREEN}已恢复暂存的更改${NC}"
    fi
fi
