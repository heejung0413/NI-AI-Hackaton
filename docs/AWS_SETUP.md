# AWS Transcribe 설정 가이드

## 1. AWS 계정 설정

### IAM 사용자 생성
1. AWS 콘솔에서 IAM 서비스로 이동
2. "사용자" → "사용자 추가" 클릭
3. 사용자 이름 입력 (예: transcribe-user)
4. "프로그래밍 방식 액세스" 선택
5. 다음 권한 정책 연결:
   - `AmazonTranscribeFullAccess`
   - `AmazonS3FullAccess` (또는 특정 버킷에 대한 제한된 권한)

### 액세스 키 생성
1. IAM 사용자 생성 완료 후 액세스 키 ID와 비밀 액세스 키 저장
2. `.env` 파일 생성 (`.env.example` 참고)

## 2. S3 버킷 설정

### 버킷 생성
```bash
aws s3 mb s3://your-transcribe-bucket --region us-east-1
```

### 버킷 정책 설정
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowTranscribeAccess",
            "Effect": "Allow",
            "Principal": {
                "Service": "transcribe.amazonaws.com"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::your-transcribe-bucket/*"
        }
    ]
}
```

### CORS 설정 (브라우저에서 직접 업로드 시)
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5173", "http://your-domain.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

## 3. EC2 인스턴스에서 사용 (권장)

EC2 인스턴스에 배포된 경우, IAM Role을 사용하는 것이 더 안전합니다:

1. EC2 콘솔에서 인스턴스 선택
2. "작업" → "보안" → "IAM 역할 수정"
3. 다음 정책이 포함된 역할 생성/선택:
   - `AmazonTranscribeFullAccess`
   - `AmazonS3FullAccess`

## 4. 환경 변수 설정

### 로컬 개발
`.env` 파일 생성:
```
REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
REACT_APP_S3_BUCKET_NAME=your-bucket-name
```

### EC2 배포
```bash
export REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
export REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
export REACT_APP_S3_BUCKET_NAME=your-bucket-name
```

## 5. 보안 주의사항

1. **절대 액세스 키를 코드에 하드코딩하지 마세요**
2. `.env` 파일을 `.gitignore`에 추가하세요
3. 프로덕션에서는 IAM Role 사용을 권장합니다
4. 최소 권한 원칙을 따라 필요한 권한만 부여하세요

## 6. 지원되는 오디오 형식

AWS Transcribe는 다음 형식을 지원합니다:
- MP3
- MP4
- WAV
- FLAC
- AMR
- OGG
- WebM

## 7. 언어 지원

한국어: `ko-KR`
영어: `en-US`
일본어: `ja-JP`
중국어: `zh-CN`

더 많은 언어는 [AWS Transcribe 문서](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) 참조