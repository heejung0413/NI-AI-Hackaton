#!/bin/bash

# EC2 인스턴스 초기 설정 스크립트

echo "=== AWS EC2 배포 환경 설정 시작 ==="

# 1. 시스템 업데이트
echo "1. 시스템 패키지 업데이트..."
sudo yum update -y

# 2. Node.js 설치 (Amazon Linux 2용)
echo "2. Node.js 18.x 설치..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. PM2 설치 (프로세스 관리자)
echo "3. PM2 설치..."
sudo npm install -g pm2

# 4. Nginx 설치 (리버스 프록시)
echo "4. Nginx 설치..."
sudo amazon-linux-extras install nginx1 -y

# 5. Git 설치
echo "5. Git 설치..."
sudo yum install -y git

# 6. 프로젝트 디렉토리 생성
echo "6. 프로젝트 디렉토리 생성..."
mkdir -p ~/app

# 7. 버전 확인
echo "=== 설치된 버전 확인 ==="
node --version
npm --version
pm2 --version
nginx -v

echo "=== 환경 설정 완료 ==="
echo "다음 단계: 프로젝트 파일을 ~/app 디렉토리에 업로드하세요"