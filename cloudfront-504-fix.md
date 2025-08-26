# CloudFront 504 Gateway Timeout 해결 가이드

## 1. EC2 서버 확인

### SSH로 EC2 접속 후 확인
```bash
# 서버 프로세스 확인
sudo systemctl status node-server
# 또는
pm2 status
# 또는
ps aux | grep node

# 서버가 실행 중이 아니면 시작
cd /path/to/server
npm start
# 또는
pm2 start server.js
```

## 2. CloudFront Origin 설정 수정

### CloudFront Console에서:
1. 해당 Distribution 선택
2. Origins 탭 → Edit
3. **Origin Domain**: ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com
4. **Origin Protocol**: HTTP only
5. **HTTP Port**: 3001 (중요! 서버가 실행되는 포트)
6. Save changes

## 3. EC2 보안 그룹 수정

### EC2 Console에서:
1. 인스턴스의 Security Group 선택
2. Inbound rules → Edit
3. 다음 규칙 추가:
   ```
   Type: Custom TCP
   Port: 3001
   Source: 0.0.0.0/0
   ```

## 4. CloudFront Timeout 설정 증가

### Behaviors 탭에서:
1. Default behavior → Edit
2. **Origin connection timeout**: 10 seconds (기본 3초)
3. **Origin response timeout**: 60 seconds (기본 30초)
4. Save changes

## 5. 서버 CORS 설정 확인

서버 코드에서 CloudFront URL 허용:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://[cloudfront-id].cloudfront.net',
    'http://ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com'
  ],
  credentials: true
};
```

## 6. 빠른 해결책

포트 80으로 서버 실행하기 (임시):
```bash
# EC2에서
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3001
```

또는 Nginx 리버스 프록시 설정:
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

## 7. 배포 후 테스트

변경사항 적용 후:
1. CloudFront invalidation 생성 (캐시 초기화)
2. 몇 분 대기 (전파 시간)
3. https://[cloudfront-id].cloudfront.net/transcribe 접속 테스트