#!/bin/bash

# 배포 스크립트

echo "=== 프로젝트 배포 시작 ==="

# 1. 프로젝트 빌드
echo "1. 프로젝트 빌드..."
npm install
npm run build

# 2. EC2로 빌드 파일 전송
echo "2. EC2로 파일 전송..."
EC2_HOST="ec2-54-90-225-252.compute-1.amazonaws.com"
PEM_KEY="key1.pem"

# dist 폴더 전송
scp -i $PEM_KEY -r dist/* ec2-user@$EC2_HOST:~/app/dist/

# nginx 설정 파일 전송
scp -i $PEM_KEY nginx.conf ec2-user@$EC2_HOST:~/

echo "3. EC2에서 실행할 명령어:"
echo "   sudo cp ~/nginx.conf /etc/nginx/conf.d/app.conf"
echo "   sudo systemctl restart nginx"
echo "   sudo systemctl enable nginx"

echo "=== 배포 완료 ==="
echo "브라우저에서 http://$EC2_HOST 로 접속하세요"