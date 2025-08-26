# CloudFront HTTPS 설정 가이드

## 1. CloudFront 배포 생성

### AWS Console에서 설정
1. AWS Console 로그인
2. CloudFront 서비스로 이동
3. "Create Distribution" 클릭

### Origin 설정
- **Origin Domain**: ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com
- **Protocol**: HTTP only
- **HTTP Port**: 80
- **Origin Path**: 비워둠
- **Origin Shield**: No

### Cache Behavior 설정
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- **Cache Policy**: CachingDisabled
- **Origin Request Policy**: AllViewer

### Distribution 설정
- **Price Class**: Use only North America and Europe
- **Alternate Domain Names**: 비워둠
- **SSL Certificate**: Default CloudFront Certificate
- **Standard Logging**: Off

## 2. EC2 보안 그룹 설정

EC2 인스턴스의 보안 그룹에 다음 인바운드 규칙 추가:
- **Type**: HTTP
- **Port**: 80
- **Source**: 0.0.0.0/0

## 3. 배포 대기

- CloudFront 배포는 15-20분 정도 소요됩니다.
- Status가 "Deployed"가 되면 사용 가능합니다.

## 4. 새 URL 사용

배포 완료 후:
- CloudFront Domain Name: https://[distribution-id].cloudfront.net
- 이 URL을 사용하여 HTTPS로 접속 가능합니다.

## 5. 애플리케이션 업데이트 필요 사항

### React 앱 (.env 파일)
```
VITE_API_URL=https://[distribution-id].cloudfront.net
```

### 서버 CORS 설정
서버의 CORS 설정에 CloudFront URL 추가 필요

## 주의사항
- CloudFront는 기본적으로 캐싱을 하므로 실시간 애플리케이션의 경우 캐싱을 비활성화해야 합니다.
- 배포 후 DNS 전파로 인해 몇 분 정도 추가로 기다려야 할 수 있습니다.