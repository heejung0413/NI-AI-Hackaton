# 배포 가이드

## 자동 배포 스크립트 사용법

### 1. 스크립트 실행 권한 부여
```bash
chmod +x deploy.sh
```

### 2. 배포 실행
```bash
# EC2 인스턴스 1번 (ec2-13-125-174-173) 배포 (기본값)
./deploy.sh 1

# EC2 인스턴스 2번 (ec2-54-90-225-252) 배포
./deploy.sh 2

# 기본값으로 1번 인스턴스 배포
./deploy.sh
```

## 배포 프로세스

### 1단계: 연결 테스트
- EC2 인스턴스 SSH 연결 확인
- SSH 키 파일과 호스트 유효성 검증

### 2단계: 서버 코드 배포
- `server.js` 파일 전송
- `package.json` 및 환경 변수 파일 전송

### 3단계: 프론트엔드 소스 압축
- React 소스 코드 압축
- 설정 파일들 포함

### 4단계: 파일 전송
- 압축된 프론트엔드 파일을 EC2로 전송

### 5단계: 프론트엔드 빌드
- EC2에서 의존성 설치
- 환경 변수 자동 설정
- Vite 빌드 실행

### 6단계: 서버 재시작
- 서버 의존성 설치
- PM2로 Node.js 서버 재시작

### 7단계: 배포 검증
- 웹사이트 접속 테스트
- API 헬스체크

## EC2 인스턴스 정보

### 인스턴스 1번
- **호스트**: ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com
- **SSH 키**: key2.pem
- **프로젝트 경로**: ~/NI-AI-Hackaton
- **서버 경로**: ~/server

### 인스턴스 2번
- **호스트**: ec2-54-90-225-252.compute-1.amazonaws.com
- **SSH 키**: key1.pem
- **프로젝트 경로**: ~/NI-AI-Hackaton
- **서버 경로**: ~/server

## 주요 기능

### 🎯 자동화된 작업
- SSH 키 자동 선택
- 환경 변수 자동 설정
- 의존성 자동 설치
- 빌드 및 배포 검증
- 컬러 출력으로 진행 상황 표시

### 🔧 오류 처리
- SSH 연결 실패 시 즉시 중단
- 빌드 실패 시 배포 중단
- 단계별 성공/실패 상태 표시

### 🧹 자동 정리
- 임시 파일 자동 삭제
- 압축 파일 정리

## 수동 배포 (비상시)

스크립트가 실패할 경우 수동으로 배포:

```bash
# 1. 서버 코드 전송
scp -i key2.pem server/server.js ec2-user@ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com:~/server/

# 2. 프론트엔드 파일 압축 및 전송
tar -czf frontend.tar.gz src/ package.json vite.config.js index.html .env
scp -i key2.pem frontend.tar.gz ec2-user@ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com:/tmp/

# 3. EC2에서 빌드 및 재시작
ssh -i key2.pem ec2-user@ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com
cd ~/NI-AI-Hackaton
tar -xzf /tmp/frontend.tar.gz
npm install
npm run build
cd ~/server
pm2 restart ai-backend
```

## 문제 해결

### SSH 연결 실패
- SSH 키 파일 권한 확인: `chmod 600 key*.pem`
- EC2 인스턴스 상태 확인
- 보안 그룹 설정 확인

### 빌드 실패
- Node.js 버전 확인
- 의존성 설치 문제 확인
- 환경 변수 설정 확인

### 서버 재시작 실패
- PM2 프로세스 상태 확인: `pm2 list`
- 포트 3001 사용 중 여부 확인
- 서버 로그 확인: `pm2 logs`

## 배포 후 확인사항

1. **웹사이트 접속**: http://ec2-host-address
2. **API 상태**: http://ec2-host-address/api/health
3. **기능 테스트**: 음성 녹음, AI 요약, 이메일 전송
4. **브라우저 캐시**: 강제 새로고침 (Ctrl+F5)

## 보안 주의사항

- SSH 키 파일을 버전 관리에 포함하지 마세요
- 환경 변수에 API 키가 노출되지 않도록 주의하세요
- 정기적으로 의존성 보안 업데이트를 확인하세요