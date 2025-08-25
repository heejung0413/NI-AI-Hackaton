# 🎙️ AI 음성 인식 및 요약 서비스

실시간 음성 인식, 화자 구분, AI 요약, 이메일 전송 기능을 제공하는 웹 애플리케이션입니다.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![AWS](https://img.shields.io/badge/AWS-S3-orange)
![Claude AI](https://img.shields.io/badge/Claude-AI-purple)

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [API 엔드포인트](#api-엔드포인트)
- [배포](#배포)
- [환경 변수](#환경-변수)

## 🚀 주요 기능

### 1. 실시간 음성 인식
- **화자 구분**: 1초 침묵 감지로 자동 화자 변경
- **실시간 변환**: Chrome Web Speech API를 활용한 실시간 음성-텍스트 변환
- **다화자 지원**: 여러 명이 참여하는 회의 녹음 지원

### 2. AI 요약
- **Claude AI 통합**: Claude AI를 활용한 지능형 요약
- **이모지 활용**: 보기 쉬운 형식으로 요약 제공
- **핵심 키워드 추출**: 중요한 내용을 키워드로 정리

### 3. 공유 기능
- **이메일 전송**: 요약본을 이메일로 자동 발송
- **클립보드 복사**: 원클릭으로 요약 내용 복사
- **다운로드**: 녹음 파일 다운로드 지원

### 4. 추가 기능
- **예시 파일**: 샘플 회의 녹음 파일 제공
- **S3 업로드**: AWS S3에 녹음 파일 자동 저장
- **반응형 디자인**: 모바일 및 데스크톱 지원

## 🛠️ 기술 스택

### Frontend
- **React** 19.1.1 - UI 라이브러리
- **React Router** 7.8.1 - 라우팅
- **Vite** 7.1.2 - 빌드 도구
- **Web Speech API** - 음성 인식

### Backend
- **Node.js** - 런타임
- **Express** 5.1.0 - 웹 프레임워크
- **Multer** 2.0.2 - 파일 업로드
- **Nodemailer** - 이메일 전송

### Cloud & AI
- **AWS S3** - 파일 저장소
- **Claude AI** - 텍스트 요약
- **AWS EC2** - 서버 호스팅

## 🏁 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- Yarn 패키지 매니저
- AWS 계정 (S3 사용)
- Claude AI API 키
- SMTP 이메일 서버 정보

### 설치 및 실행

1. 프로젝트 클론
```bash
git clone [repository-url]
cd NI-AI-Hackaton
```

2. 의존성 설치
```bash
yarn install
cd server && npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에 필요한 환경 변수 입력
```

4. 개발 서버 실행
```bash
# Frontend와 Backend 동시 실행
yarn dev:full

# 또는 개별 실행
yarn dev        # Frontend (포트 5173)
yarn server     # Backend (포트 3001)
```

## 📁 프로젝트 구조

```
NI-AI-Hackaton/
├── src/                      # Frontend 소스 코드
│   ├── components/           # React 컴포넌트
│   │   ├── AudioRecorder.jsx # 메인 음성 녹음 컴포넌트
│   │   └── AudioRecorder.css
│   ├── App.jsx              # 라우팅 설정
│   ├── ChatRoom.jsx         # 채팅방 컴포넌트
│   ├── Calendar.jsx         # 캘린더 컴포넌트
│   ├── Call.jsx             # 통화 컴포넌트
│   └── Officemail.jsx       # 오피스메일 컴포넌트
├── server/                   # Backend 서버
│   ├── server.js            # Express 서버 메인 파일
│   └── package.json
├── public/                   # 정적 파일
├── aws-s3-setup/            # AWS S3 설정 스크립트
├── docs/                    # 문서
└── package.json             # Frontend 패키지 설정
```

## 🔌 API 엔드포인트

### 1. 헬스 체크
```
GET /api/health
```

### 2. 음성 파일 업로드
```
POST /api/upload-audio
Content-Type: multipart/form-data
Body: audio (file)
```

### 3. 음성 변환
```
POST /api/transcribe-audio
Content-Type: multipart/form-data
Body: audio (file)
```

### 4. 텍스트 요약
```
POST /api/summarize-audio
Content-Type: application/json
Body: {
  text: string,
  audioFileName: string
}
```

### 5. 이메일 전송
```
POST /api/send-summary-email
Content-Type: application/json
Body: {
  email: string,
  summary: string,
  originalText: string,
  audioFileName: string
}
```

## 🚀 배포

### AWS EC2 배포

1. EC2 인스턴스 설정
```bash
# deploy-setup.sh 실행
chmod +x deploy-setup.sh
./deploy-setup.sh
```

2. 애플리케이션 배포
```bash
# deploy.sh 실행
chmod +x deploy.sh
./deploy.sh
```

### Vercel 배포 (Frontend)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## 🔐 환경 변수

### Backend (.env)
```env
# 서버 설정
PORT=3001

# AWS S3 설정
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=ni-ai-hackaton

# Claude AI API
ANTHROPIC_API_KEY=your_claude_api_key

# 이메일 설정 (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📝 사용 방법

1. **녹음 시작**: "녹음 시작" 버튼 클릭
2. **음성 입력**: 마이크에 대고 말하기 (1초 침묵 시 화자 자동 변경)
3. **녹음 중지**: "녹음 중지" 버튼 클릭
4. **요약 생성**: "Claude AI 요약" 버튼 클릭
5. **공유하기**: 
   - 클립보드 복사 또는
   - 이메일 주소 입력 후 전송

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 👥 팀원

- 프로젝트 개발팀

## 🙏 감사의 말

- Claude AI - 강력한 AI 요약 기능 제공
- AWS - 안정적인 클라우드 인프라
- React 커뮤니티 - 훌륭한 오픈소스 도구들
