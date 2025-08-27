@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM YokoTV 一键更新脚本 (Windows版本)
REM 使用方法: update.bat [tag]
REM 例如: update.bat latest 或 update.bat v1.0.0

echo === YokoTV 更新脚本 ===

REM 默认镜像信息
set DEFAULT_IMAGE=ghcr.io/lengling06/yokotv
set DEFAULT_TAG=latest

REM 获取标签参数
if "%1"=="" (
    set TAG=%DEFAULT_TAG%
) else (
    set TAG=%1
)

set IMAGE=%DEFAULT_IMAGE%:%TAG%

echo 准备更新到镜像: %IMAGE%

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker 未运行或无权限访问
    pause
    exit /b 1
)

REM 检查 docker-compose 文件是否存在
if not exist "docker-compose.yml" (
    echo 错误: 找不到 docker-compose.yml 文件
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 步骤 1/5: 拉取最新镜像...
docker pull %IMAGE%
if errorlevel 1 (
    echo 拉取镜像失败
    pause
    exit /b 1
)

echo 步骤 2/5: 停止当前服务...
docker-compose down

echo 步骤 3/5: 备份数据（如果存在）...
if exist "data" (
    set BACKUP_DIR=backups\%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set BACKUP_DIR=!BACKUP_DIR: =0!
    mkdir "!BACKUP_DIR!" 2>nul
    xcopy "data" "!BACKUP_DIR!\data" /E /I /Q
    echo 数据已备份到: !BACKUP_DIR!
)

echo 步骤 4/5: 更新 docker-compose.yml 中的镜像标签...
powershell -Command "(Get-Content docker-compose.yml) -replace 'image: ghcr\.io/lengling06/yokotv:.*', 'image: %IMAGE%' | Set-Content docker-compose.yml"

echo 步骤 5/5: 启动更新后的服务...
docker-compose up -d

echo === 更新完成! ===
echo 服务状态:
docker-compose ps

echo.
echo 查看日志: docker-compose logs -f yokotv-core
echo 访问地址: http://localhost:3000

pause
