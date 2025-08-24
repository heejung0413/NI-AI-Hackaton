const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com',
    'https://ec2-13-125-174-173.ap-northeast-2.compute.amazonaws.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// AWS S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Claude API 클라이언트 설정
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Nodemailer 설정
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Multer 설정 (메모리에 파일 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
  }
});

// S3에 오디오 파일 업로드
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    console.log('API 호출됨 - 업로드 요청');
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));
    console.log('File:', req.file ? 'present' : 'missing');
    
    if (!req.file) {
      console.log('파일이 없음');
      return res.status(400).json({ error: '오디오 파일이 필요합니다.' });
    }

    console.log('업로드된 파일:', req.file.originalname, req.file.size, 'bytes');

    // 파일명 생성 (타임스탬프 포함)
    const timestamp = Date.now();
    const fileName = `audio-${timestamp}.webm`;
    const s3Key = `audio-files/${fileName}`;

    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'ni-ai-hackaton',
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'audio/webm',
    });

    const result = await s3Client.send(command);
    console.log('S3 업로드 성공:', result);

    // S3 URL 생성
    const s3Url = `https://${process.env.S3_BUCKET_NAME || 'ni-ai-hackaton'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    res.json({
      success: true,
      message: '오디오 파일이 S3에 성공적으로 업로드되었습니다.',
      data: {
        fileName: fileName,
        s3Key: s3Key,
        s3Url: s3Url,
        fileSize: req.file.size,
        uploadTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('S3 업로드 오류:', error);
    res.status(500).json({
      error: 'S3 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 건강 상태 확인 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Audio Upload API'
  });
});

// 오디오 텍스트 요약 (Claude API 사용)
app.post('/api/summarize-audio', async (req, res) => {
  try {
    console.log('텍스트 요약 요청:', req.body);
    
    const { text, audioFileName } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    console.log('Claude API 요약 요청 중...');

    // Claude API를 사용하여 텍스트 요약
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `다음 음성 녹음 내용을 이모지를 활용하여 보기 좋게 요약해주세요.

요약 형식:
📌 **핵심 요약** (1-2문장으로 전체 내용 요약)

📝 **주요 내용**
• (관련 이모지) 첫 번째 주요 포인트
• (관련 이모지) 두 번째 주요 포인트
• (관련 이모지) 세 번째 주요 포인트
(필요한 만큼 추가)

💡 **핵심 키워드**
#키워드1 #키워드2 #키워드3

---
음성 녹음 내용:
${text}`
        }
      ]
    });

    const summary = message.content[0].text;
    console.log('Claude API 요약 완료');

    res.json({
      success: true,
      data: {
        audioFileName: audioFileName || '알 수 없음',
        originalText: text,
        summary: summary,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('텍스트 요약 오류:', error);
    res.status(500).json({
      error: '텍스트 요약 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 이메일로 요약 전송
app.post('/api/send-summary-email', async (req, res) => {
  try {
    console.log('이메일 전송 요청:', req.body);
    
    const { email, summary, originalText, audioFileName } = req.body;
    
    if (!email || !summary) {
      return res.status(400).json({ error: '이메일 주소와 요약 내용이 필요합니다.' });
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '올바른 이메일 주소를 입력해주세요.' });
    }

    // HTML 형식의 이메일 본문 생성
    const htmlContent = `
      <div style="font-family: 'Noto Sans KR', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2e7d32; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
          🎙️ 음성 녹음 요약본
        </h1>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">
            <strong>파일명:</strong> ${audioFileName || '음성 녹음'}<br>
            <strong>요약 생성 시간:</strong> ${new Date().toLocaleString('ko-KR')}
          </p>
        </div>

        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #2e7d32; margin-top: 0;">📊 Claude AI 요약</h2>
          <div style="white-space: pre-wrap; line-height: 1.8;">
${summary}
          </div>
        </div>

        ${originalText ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">📝 원본 텍스트</h3>
          <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">
${originalText}
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">
            이 이메일은 AI 음성 요약 서비스에서 자동으로 발송되었습니다.<br>
            Powered by Claude AI & AWS
          </p>
        </div>
      </div>
    `;

    // 이메일 옵션 설정
    const mailOptions = {
      from: `AI 음성 요약 서비스 <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎙️ 음성 녹음 요약본 - ${new Date().toLocaleDateString('ko-KR')}`,
      html: htmlContent,
      text: `음성 녹음 요약본\n\n${summary}\n\n원본 텍스트:\n${originalText || '없음'}`
    };

    // 이메일 전송
    const info = await transporter.sendMail(mailOptions);
    console.log('이메일 전송 성공:', info.messageId);

    res.json({
      success: true,
      message: '이메일이 성공적으로 전송되었습니다.',
      data: {
        email: email,
        messageId: info.messageId,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('이메일 전송 오류:', error);
    res.status(500).json({
      error: '이메일 전송 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 업로드된 파일 목록 조회 (선택사항)
app.get('/api/files', (req, res) => {
  res.json({
    message: '파일 목록 기능은 추후 구현 예정입니다.'
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. (최대 50MB)' });
    }
  }
  
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`💾 S3 버킷: ${process.env.S3_BUCKET_NAME || 'ni-ai-hackaton'}`);
  console.log(`🌏 AWS 리전: ${process.env.AWS_REGION || 'us-east-1'}`);
});