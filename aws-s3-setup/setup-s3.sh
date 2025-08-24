#!/bin/bash

# S3 버킷 설정 스크립트
BUCKET_NAME="ni-ai-hackaton"
REGION="us-east-1"

echo "=== S3 버킷 설정 시작 ==="

# 1. CORS 정책 적용
echo "1. CORS 정책 적용 중..."
aws s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file://cors-policy.json \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ CORS 정책이 성공적으로 적용되었습니다."
else
    echo "❌ CORS 정책 적용 실패"
fi

# 2. 버킷 정책 적용
echo -e "\n2. 버킷 정책 적용 중..."
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file://bucket-policy.json \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ 버킷 정책이 성공적으로 적용되었습니다."
else
    echo "❌ 버킷 정책 적용 실패"
fi

# 3. 버킷 설정 확인
echo -e "\n3. 현재 버킷 설정 확인:"
echo "CORS 설정:"
aws s3api get-bucket-cors --bucket $BUCKET_NAME --region $REGION 2>/dev/null || echo "CORS 설정 없음"

echo -e "\n버킷 정책:"
aws s3api get-bucket-policy --bucket $BUCKET_NAME --region $REGION 2>/dev/null || echo "버킷 정책 없음"

echo -e "\n=== S3 버킷 설정 완료 ==="
echo "버킷 이름: $BUCKET_NAME"
echo "리전: $REGION"