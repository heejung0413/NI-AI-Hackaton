# S3 버킷 설정 가이드

이 디렉토리는 `ni-ai-hackaton` S3 버킷을 AWS Transcribe 서비스와 연동하기 위한 설정 파일들을 포함합니다.

## 파일 설명

- `cors-policy.json`: 브라우저에서 S3에 직접 접근할 수 있도록 CORS 정책 설정
- `bucket-policy.json`: AWS Transcribe 서비스가 버킷에 접근할 수 있도록 권한 설정
- `setup-s3.sh`: 위 정책들을 자동으로 적용하는 스크립트

## 사용 방법

### 1. AWS CLI 설치 및 설정
```bash
# AWS CLI가 설치되어 있지 않다면
brew install awscli  # macOS
# 또는
sudo yum install aws-cli  # Amazon Linux

# AWS 자격 증명 설정
aws configure
```

### 2. S3 버킷 정책 적용
```bash
cd aws-s3-setup
./setup-s3.sh
```

### 3. IAM 사용자 권한 확인
IAM 사용자에게 다음 권한이 있는지 확인:
- `s3:PutObject` - 오디오 파일 업로드
- `s3:GetObject` - 파일 읽기
- `transcribe:StartTranscriptionJob` - Transcribe 작업 시작
- `transcribe:GetTranscriptionJob` - 작업 상태 확인

## 주의사항

1. **보안**: `.env` 파일에 AWS 자격 증명을 추가해야 합니다
2. **리전**: 현재 `us-east-1` 리전으로 설정되어 있습니다
3. **CORS**: 로컬 개발(`localhost:5173`)과 EC2 배포 URL이 포함되어 있습니다

## 문제 해결

### CORS 오류 발생 시
1. 브라우저 개발자 도구에서 정확한 오류 메시지 확인
2. `cors-policy.json`에 해당 도메인 추가
3. `./setup-s3.sh` 다시 실행

### 권한 오류 발생 시
1. IAM 사용자 권한 확인
2. S3 버킷 정책이 올바르게 적용되었는지 확인
3. AWS 콘솔에서 버킷 권한 탭 확인