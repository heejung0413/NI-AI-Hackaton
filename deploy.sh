#!/bin/bash

# 배포 스크립트 - NI-AI-Hackaton 프로젝트
# 사용법: ./deploy.sh [ec2-instance-number]
# 예시: ./deploy.sh 1 (ec2-13-125-174-173 배포) 
#      ./deploy.sh 2 (ec2-54-90-225-252 배포)

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# EC2 인스턴스 정보
EC2_INSTANCE_1="ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com"
EC2_INSTANCE_2="ec2-54-90-225-252.compute-1.amazonaws.com"
EC2_USER="ec2-user"
PROJECT_PATH="~/NI-AI-Hackaton"
SERVER_PATH="~/server"

# 기본값 설정
INSTANCE_NUM=${1:-1}

# EC2 인스턴스 선택
if [ "$INSTANCE_NUM" = "1" ]; then
    EC2_HOST=$EC2_INSTANCE_1
    KEY_FILE="key2.pem"
    API_URL="http://$EC2_INSTANCE_1"
elif [ "$INSTANCE_NUM" = "2" ]; then
    EC2_HOST=$EC2_INSTANCE_2
    KEY_FILE="key1.pem"
    API_URL="http://$EC2_INSTANCE_2"
else
    echo -e "${RED}오류: 잘못된 인스턴스 번호입니다. 1 또는 2를 입력하세요.${NC}"
    exit 1
fi

# SSH 명령어 함수
ssh_exec() {
    ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$1"
}

# SCP 명령어 함수
scp_file() {
    scp -i "$KEY_FILE" -o StrictHostKeyChecking=no "$1" "$EC2_USER@$EC2_HOST:$2"
}

echo -e "${GREEN}=== NI-AI-Hackaton 프로젝트 배포 시작 ===${NC}"
echo -e "${YELLOW}대상 서버: $EC2_HOST${NC}"
echo -e "${YELLOW}SSH 키: $KEY_FILE${NC}"
echo ""

# 1. 연결 테스트
echo -e "${GREEN}[1/7] EC2 인스턴스 연결 테스트...${NC}"
if ssh_exec "echo '연결 성공'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 연결 성공${NC}"
else
    echo -e "${RED}✗ 연결 실패. SSH 키와 호스트를 확인하세요.${NC}"
    exit 1
fi

# 2. 서버 코드 배포
echo -e "${GREEN}[2/7] 서버 코드 배포 중...${NC}"
scp_file "server/server.js" "$SERVER_PATH/"
scp_file "server/package.json" "$SERVER_PATH/"
scp_file "server/.env" "$SERVER_PATH/"
echo -e "${GREEN}✓ 서버 코드 배포 완료${NC}"

# 3. 프론트엔드 소스 준비
echo -e "${GREEN}[3/7] 프론트엔드 소스 압축 중...${NC}"
tar -czf frontend-deploy.tar.gz src/ package.json vite.config.js index.html .env
echo -e "${GREEN}✓ 압축 완료${NC}"

# 4. 프론트엔드 파일 전송
echo -e "${GREEN}[4/7] 프론트엔드 파일 전송 중...${NC}"
scp_file "frontend-deploy.tar.gz" "/tmp/"
echo -e "${GREEN}✓ 전송 완료${NC}"

# 5. EC2에서 프론트엔드 빌드
echo -e "${GREEN}[5/7] 프론트엔드 빌드 중...${NC}"
ssh_exec "cd $PROJECT_PATH && tar -xzf /tmp/frontend-deploy.tar.gz > /dev/null 2>&1"

# 환경 변수 업데이트
ssh_exec "cd $PROJECT_PATH && sed -i 's|VITE_API_URL=.*|VITE_API_URL=$API_URL|' .env"

# npm 설치 및 빌드
echo "  - 의존성 설치 중..."
ssh_exec "cd $PROJECT_PATH && npm install > /dev/null 2>&1"

echo "  - 빌드 실행 중..."
if ssh_exec "cd $PROJECT_PATH && npm run build 2>&1 | grep -q 'built in'"; then
    echo -e "${GREEN}✓ 빌드 완료${NC}"
else
    echo -e "${RED}✗ 빌드 실패${NC}"
    exit 1
fi

# 6. 서버 재시작
echo -e "${GREEN}[6/7] 서버 재시작 중...${NC}"

# 서버 의존성 설치 (필요한 경우)
ssh_exec "cd $SERVER_PATH && npm install > /dev/null 2>&1"

# PM2로 서버 재시작
if ssh_exec "cd $SERVER_PATH && pm2 restart ai-backend || pm2 restart ni-ai-backend || pm2 start server.js --name ai-backend" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 서버 재시작 완료${NC}"
else
    echo -e "${RED}✗ 서버 재시작 실패${NC}"
fi

# 7. 배포 검증
echo -e "${GREEN}[7/7] 배포 검증 중...${NC}"

# 웹사이트 접속 테스트
echo -n "  - 웹사이트 접속 테스트: "
if curl -s -I "http://$EC2_HOST" | head -1 | grep -q "200"; then
    echo -e "${GREEN}✓ 성공${NC}"
else
    echo -e "${RED}✗ 실패${NC}"
fi

# API 헬스체크
echo -n "  - API 헬스체크: "
if curl -s "http://$EC2_HOST/api/health" | grep -q "OK"; then
    echo -e "${GREEN}✓ 정상${NC}"
else
    echo -e "${RED}✗ 실패${NC}"
fi

# 정리
rm -f frontend-deploy.tar.gz

echo ""
echo -e "${GREEN}=== 배포 완료! ===${NC}"
echo -e "${YELLOW}웹사이트: http://$EC2_HOST${NC}"
echo -e "${YELLOW}API 서버: http://$EC2_HOST/api/${NC}"
echo ""
echo -e "${YELLOW}브라우저에서 강제 새로고침(Ctrl+F5)하여 최신 버전을 확인하세요.${NC}"