import React, { useState, useRef } from "react";
import "./AudioRecorder.css";
import exampleAudioFile from "../assets/Example-Recorded-Conference.mp3";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // 녹음 시작
  const startRecording = async () => {
    try {
      setError("");
      setRecordedAudio(null);
      setTranscriptText("");
      setSummary(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ blob: audioBlob, url: audioUrl });
      };

      // 음성 인식 시작
      setTimeout(() => startSpeechRecognition(), 500);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("녹음 시작 오류:", error);
      setError("마이크 권한을 허용해주세요.");
    }
  };

  // 음성 인식 시작
  const startSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // 최적화된 설정
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ko-KR";
      recognition.maxAlternatives = 3; // 5에서 3으로 줄임

      // 추가 최적화 설정
      if ("webkitSpeechRecognition" in window) {
        // Chrome/Edge 전용 설정
        try {
          recognition.audioTrack = true;
          recognition.enableOfflineMode = false;
        } catch (e) {
          console.log("Chrome 전용 설정 적용 실패:", e);
        }
      }

      let finalTranscript = "";
      let noSpeechTimeout = null;
      let restartTimeout = null;
      let lastSpeechTime = Date.now();
      let restartAttempts = 0;
      const maxRestartAttempts = 10;

      recognition.onstart = () => {
        setIsTranscribing(true);
        setIsListening(false);
        setInterimText("");
        setFinalText("");
        restartAttempts = 0;
        setError(""); // 에러 초기화
        console.log("🎤 음성 인식 시작됨");
        console.log("설정:", {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang,
          maxAlternatives: recognition.maxAlternatives,
        });
      };

      recognition.onaudiostart = () => {
        console.log("🔊 오디오 캡처 시작됨");
        setError(""); // 오디오 캡처 성공 시 에러 초기화
        // 오디오가 시작되면 무음 타이머 시작 (30초로 연장)
        noSpeechTimeout = setTimeout(() => {
          console.log("⏰ 30초간 음성 없음 - 재시작 시도");
          if (
            recognition &&
            isRecording &&
            restartAttempts < maxRestartAttempts
          ) {
            try {
              console.log("자동 재시작 중...");
              recognition.stop();
            } catch (e) {
              console.log("재시작을 위한 중지 실패:", e);
            }
          }
        }, 30000); // 15초에서 30초로 연장
      };

      recognition.onsoundstart = () => {
        console.log("🔉 소리 감지됨");
        setIsListening(true);
        lastSpeechTime = Date.now();
        if (noSpeechTimeout) {
          clearTimeout(noSpeechTimeout);
          noSpeechTimeout = null;
        }
      };

      recognition.onspeechstart = () => {
        console.log("🗣️ 음성 감지됨");
        setIsListening(true);
        lastSpeechTime = Date.now();
      };

      recognition.onsoundend = () => {
        console.log("🔇 소리 종료됨");
        setIsListening(false);
      };

      recognition.onspeechend = () => {
        console.log("🔈 음성 종료됨");
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        console.log("📝 음성 인식 결과:", event);
        let interimTranscript = "";
        lastSpeechTime = Date.now();

        // 타이머 리셋
        if (noSpeechTimeout) {
          clearTimeout(noSpeechTimeout);
          noSpeechTimeout = null;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          console.log(`결과 ${i}:`, {
            텍스트: transcript,
            신뢰도: confidence,
            최종: result.isFinal,
            대안개수: result.length,
          });

          // 모든 대안 출력 (디버깅용)
          for (let j = 0; j < Math.min(result.length, 3); j++) {
            console.log(
              `  대안 ${j}: "${result[j].transcript}" (신뢰도: ${result[j].confidence})`
            );
          }

          if (result.isFinal) {
            finalTranscript += transcript + " ";
            setFinalText(finalTranscript);
            console.log("✅ 최종 인식 결과 추가:", transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        // 중간 결과 업데이트
        setInterimText(interimTranscript);

        // 전체 텍스트 업데이트
        const currentText = finalTranscript + interimTranscript;
        setTranscriptText(currentText);
        console.log("📄 현재 텍스트 길이:", currentText.length);
      };

      recognition.onerror = (event) => {
        console.error("❌ 음성 인식 오류:", {
          error: event.error,
          message: event.message,
          timeStamp: event.timeStamp,
        });

        // 타이머 정리
        if (noSpeechTimeout) {
          clearTimeout(noSpeechTimeout);
          noSpeechTimeout = null;
        }
        if (restartTimeout) {
          clearTimeout(restartTimeout);
          restartTimeout = null;
        }

        switch (event.error) {
          case "no-speech":
            console.log("🔇 음성 미감지 - 자동 재시작 시도");
            if (isRecording && restartAttempts < maxRestartAttempts) {
              restartAttempts++;
              restartTimeout = setTimeout(() => {
                try {
                  recognition.start();
                  console.log(
                    `🔄 음성 인식 재시작 ${restartAttempts}/${maxRestartAttempts}`
                  );
                } catch (e) {
                  console.log("재시작 실패:", e);
                }
              }, 500);
            } else if (restartAttempts >= maxRestartAttempts) {
              console.log("⚠️ 최대 재시작 횟수 도달");
              setError(
                "음성이 지속적으로 감지되지 않습니다. 마이크를 확인하거나 직접 텍스트를 입력해주세요."
              );
              setIsTranscribing(false);
            }
            break;

          case "audio-capture":
            setError(
              "마이크에 접근할 수 없습니다. 마이크 설정을 확인해주세요."
            );
            setIsTranscribing(false);
            break;

          case "not-allowed":
            setError(
              "마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요."
            );
            setIsTranscribing(false);
            break;

          case "network":
            console.log("🌐 네트워크 오류 - 재시도 중");
            if (isRecording && restartAttempts < maxRestartAttempts) {
              restartAttempts++;
              restartTimeout = setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {
                  console.log("네트워크 오류 후 재시작 실패:", e);
                }
              }, 1000);
            }
            break;

          case "service-not-allowed":
            setError(
              "음성 인식 서비스를 사용할 수 없습니다. 인터넷 연결을 확인해주세요."
            );
            setIsTranscribing(false);
            break;

          case "bad-grammar":
            console.log("⚠️ 문법 오류 - 계속 시도");
            break;

          default:
            console.log(`⚠️ 알 수 없는 오류: ${event.error}`);
            if (isRecording && restartAttempts < maxRestartAttempts) {
              restartAttempts++;
              restartTimeout = setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {
                  console.log("알 수 없는 오류 후 재시작 실패:", e);
                }
              }, 1000);
            } else {
              setIsTranscribing(false);
            }
            break;
        }
      };

      recognition.onend = () => {
        console.log("🔚 음성 인식 종료됨");

        // 타이머 정리
        if (noSpeechTimeout) {
          clearTimeout(noSpeechTimeout);
          noSpeechTimeout = null;
        }

        // 녹음 중이면 자동으로 재시작
        if (isRecording && restartAttempts < maxRestartAttempts) {
          console.log("🔄 녹음 중이므로 자동 재시작");
          restartTimeout = setTimeout(() => {
            try {
              recognition.start();
              restartAttempts++;
              console.log(
                `재시작 시도 ${restartAttempts}/${maxRestartAttempts}`
              );
            } catch (e) {
              console.log("자동 재시작 실패:", e);
              if (e.name === "InvalidStateError") {
                console.log("이미 시작된 상태입니다.");
              }
            }
          }, 300);
        } else {
          setIsTranscribing(false);
          console.log("🏁 음성 인식 완전 종료");
        }
      };

      recognitionRef.current = recognition;

      // 첫 시작
      try {
        recognition.start();
        console.log("🚀 음성 인식 첫 시작");
      } catch (e) {
        console.error("음성 인식 시작 실패:", e);
        setError("음성 인식을 시작할 수 없습니다: " + e.message);
      }
    } else {
      setError(
        "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요."
      );
    }
  };

  // 녹음 정지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }

    // 음성 인식 정지
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // 오디오 파일 다운로드
  const downloadAudio = () => {
    if (!recordedAudio) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `recording-${timestamp}.webm`;

    const link = document.createElement("a");
    link.href = recordedAudio.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // S3에 업로드
  const uploadToS3 = async () => {
    if (!recordedAudio) return;

    setIsUploading(true);
    setError("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", recordedAudio.blob, "recording.webm");

      console.log("FormData 생성:", formData.get("audio"));

      // Nginx 프록시를 통해 API 호출
      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/upload-audio" // Nginx 프록시 경로
        : "http://localhost:3001/api/upload-audio";

      console.log("API URL:", apiUrl);
      console.log("현재 hostname:", window.location.hostname);
      console.log("EC2 환경:", isOnEC2);

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setUploadResult(result);
      console.log("업로드 성공:", result);
    } catch (error) {
      console.error("업로드 오류 상세:", error);
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        setError("네트워크 연결 오류: 서버에 연결할 수 없습니다.");
      } else {
        setError("S3 업로드 중 오류가 발생했습니다: " + error.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Claude API로 텍스트 요약
  const summarizeWithClaude = async () => {
    if (!transcriptText.trim()) {
      setError("요약할 텍스트가 없습니다. 먼저 음성을 녹음해주세요.");
      return;
    }

    setIsSummarizing(true);
    setError("");
    setSummary(null);

    try {
      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/summarize-audio"
        : "http://localhost:3001/api/summarize-audio";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: transcriptText,
          audioFileName: uploadResult?.data?.fileName || "녹음 파일",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error}`);
      }

      const result = await response.json();
      setSummary(result.data);
      console.log("요약 성공:", result);
    } catch (error) {
      console.error("요약 오류:", error);
      setError("요약 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  // 클립보드에 복사
  const copyToClipboard = async () => {
    if (!summary) return;

    try {
      const textToCopy = `🎙️ 음성 녹음 요약본\n\n${
        summary.summary
      }\n\n📝 원본 텍스트:\n${summary.originalText}\n\n⏰ 처리 시간: ${new Date(
        summary.processedAt
      ).toLocaleString()}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

      // 3초 후 복사 메시지 제거
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      setError("클립보드 복사 중 오류가 발생했습니다.");
    }
  };

  // 이메일로 요약 전송
  const sendSummaryEmail = async () => {
    if (!emailAddress || !summary) {
      setError("이메일 주소와 요약 내용이 필요합니다.");
      return;
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setIsSendingEmail(true);
    setError("");
    setEmailSent(false);

    try {
      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/send-summary-email"
        : "http://localhost:3001/api/send-summary-email";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailAddress,
          summary: summary.summary,
          originalText: summary.originalText,
          audioFileName: uploadResult?.data?.fileName || "음성 녹음",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setEmailSent(true);
      console.log("이메일 전송 성공:", result);

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setEmailSent(false);
      }, 3000);
    } catch (error) {
      console.error("이메일 전송 오류:", error);
      setError("이메일 전송 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 새 녹음 시작
  const resetRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setError("");
    setUploadResult(null);
    setTranscriptText("");
    setSummary(null);
    setEmailAddress("");
    setEmailSent(false);
    setCopied(false);
  };

  // 예시 녹음본 로드
  const loadExampleAudio = async () => {
    try {
      setError("");
      setIsTranscribingFile(true);
      setTranscriptText("");
      setSummary(null); // 이전 요약 초기화

      // 오디오 파일 로드
      const response = await fetch(exampleAudioFile);
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      setRecordedAudio({
        blob: blob,
        url: audioUrl,
        isExample: true,
      });

      // 서버로 파일을 전송하여 텍스트 변환
      const formData = new FormData();
      formData.append("audio", blob, "Example-Recorded-Conference.mp3");

      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/transcribe-audio"
        : "http://localhost:3001/api/transcribe-audio";

      console.log("음성 변환 API 호출:", apiUrl);
      const transcribeResponse = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("응답 상태:", transcribeResponse.status);

      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        console.error("음성 변환 실패:", errorText);

        // API가 없으면 기본 텍스트 사용
        const defaultText = `
안녕하세요, 저는 김철수 팀장입니다. 오늘 회의의 주요 안건은 다음과 같습니다.

첫째, 신규 프로젝트 진행 상황입니다. 현재 프로젝트는 전체 일정의 65% 정도 진행되었으며, 
개발팀은 핵심 기능 구현을 완료했습니다. 다만 UI/UX 팀에서 디자인 수정 요청이 있어 
일정이 약 일주일 정도 지연될 것으로 예상됩니다.

둘째, 예산 집행 현황입니다. 3분기까지 전체 예산의 72%가 집행되었으며, 
남은 예산으로 4분기 마케팅 캠페인과 인프라 확장을 진행할 예정입니다.

셋째, 인력 충원 계획입니다. 백엔드 개발자 2명과 데이터 분석가 1명을 추가로 채용할 예정이며, 
다음 주부터 면접을 시작할 계획입니다.

마지막으로 고객 피드백 분석 결과를 공유드리겠습니다. 전반적인 만족도는 4.2점으로 
전분기 대비 0.3점 상승했습니다. 특히 고객 지원 서비스에 대한 만족도가 크게 개선되었습니다.

질문이 있으시면 말씀해 주세요. 없으시다면 다음 회의는 2주 후 같은 시간에 진행하겠습니다.
감사합니다.`;

        console.log("기본 텍스트 사용");
        setTranscriptText(defaultText.trim());
        setIsTranscribingFile(false);
        return;
      }

      const transcribeResult = await transcribeResponse.json();
      const transcribedText = transcribeResult.data.text;

      // 변환된 텍스트 설정
      setTranscriptText(transcribedText);
      setIsTranscribingFile(false);

      console.log("음성 변환 완료!");
    } catch (error) {
      console.error("예시 로드 오류:", error);
      setError("예시를 로드하는 중 오류가 발생했습니다.");
      setIsTranscribingFile(false);
    }
  };

  // 예시 텍스트 AI 요약
  const summarizeExampleText = async (text) => {
    setIsSummarizing(true);
    setError("");
    setSummary(null);

    try {
      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/summarize-audio"
        : "http://localhost:3001/api/summarize-audio";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          audioFileName: "예시 회의 녹음본",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error}`);
      }

      const result = await response.json();
      setSummary(result.data);
      console.log("예시 요약 성공:", result);
    } catch (error) {
      console.error("예시 요약 오류:", error);
      setError("예시 요약 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="audio-recorder">
      <h2>음성 녹음기</h2>

      <div className="recorder-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? "recording" : ""}
          disabled={isUploading}>
          {isRecording ? "녹음 중지" : "녹음 시작"}
        </button>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {isUploading && (
        <div className="uploading">
          <p>S3에 업로드 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isSummarizing && (
        <div className="summarizing">
          <p>Claude AI로 요약 생성 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isSendingEmail && (
        <div className="sending-email">
          <p>이메일 전송 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isTranscribingFile && (
        <div className="transcribing">
          <p>🎵 예시 음성 파일을 텍스트로 변환 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isTranscribing && (
        <div className="transcribing">
          <div className="real-time-status">
            <div className="status-header">
              <p>🎤 실시간 음성 인식 중...</p>
              <div
                className={`listening-indicator ${
                  isListening ? "active" : ""
                }`}>
                <span className="indicator-dot"></span>
                <span className="indicator-text">
                  {isListening ? "음성 감지됨" : "음성 대기 중"}
                </span>
              </div>
            </div>

            {/* 실시간 음성 인식 결과 표시 */}
            <div className="live-transcription">
              <div className="final-text">
                {finalText && (
                  <span className="confirmed-text">{finalText}</span>
                )}
              </div>
              <div className="interim-text">
                {interimText && (
                  <span className="processing-text">
                    {interimText}
                    <span className="cursor-blink">|</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="recognition-status">
            <div className="recognition-tips">
              <p>
                <strong>💡 실시간 팁:</strong>
              </p>
              <ul>
                <li>
                  ✅ <strong>직접 마이크에 말하기</strong> - 최고의 인식률
                </li>
                <li>
                  ⚠️ <strong>뉴스/외부 소리</strong> - 인식률이 낮을 수 있음
                </li>
                <li>
                  🔊 <strong>배경 소음</strong> - 조용한 환경에서 사용
                </li>
                <li>
                  🗣️ <strong>명확한 발음</strong> - 또렷하게 말하기
                </li>
              </ul>
              <p className="debug-info">
                위에서 실시간으로 인식되는 텍스트를 확인할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="spinner"></div>
        </div>
      )}

      {recordedAudio && (
        <div className="recorded-audio">
          <h3>녹음 완료!</h3>
          <audio controls src={recordedAudio.url}></audio>

          <div className="audio-controls">
            <button onClick={downloadAudio} className="download-btn">
              파일 다운로드
            </button>
            <button
              onClick={loadExampleAudio}
              className="example-btn"
              disabled={isTranscribingFile || isSummarizing}>
              {isTranscribingFile ? "변환 중..." : "🎵 예시 녹음본"}
            </button>
            <button
              onClick={summarizeWithClaude}
              className="summarize-btn"
              disabled={isSummarizing || !transcriptText.trim()}>
              Claude AI 요약
            </button>
            <button onClick={resetRecording} className="reset-btn">
              새 녹음
            </button>
          </div>
        </div>
      )}

      {(transcriptText || recordedAudio) && (
        <div className="transcript-section">
          <h3>음성 인식 결과:</h3>
          <div className="transcript-help">
            <p>
              💡 <strong>음성 인식 최적화 가이드:</strong>
            </p>
            <ul>
              <li>
                ✅ <strong>직접 마이크 말하기</strong> → 95% 이상 정확도
              </li>
              <li>
                ⚠️ <strong>뉴스/방송 소리</strong> → 30-60% 정확도 (화질, 음질에
                따라)
              </li>
              <li>
                🔊 <strong>스피커 볼륨</strong> → 마이크가 잘 듣도록 적당히 크게
              </li>
              <li>
                🎧 <strong>헤드셋 사용</strong> → 외부 소음 차단으로 정확도 향상
              </li>
              <li>
                📝 <strong>수동 입력</strong> → 아래 텍스트 박스에 직접 타이핑
                가능
              </li>
            </ul>
            <div className="alternative-input-guide">
              <h4>🎯 권장 사용법:</h4>
              <p>
                <strong>뉴스 분석 시:</strong> 뉴스를 재생하고 동시에 녹음하되,
                인식이 안 되면 주요 내용을 직접 타이핑하세요.
              </p>
              <p>
                <strong>회의 요약 시:</strong> 직접 마이크에 말하면서 녹음하면
                최고의 결과를 얻을 수 있습니다.
              </p>
            </div>
          </div>
          <div className="transcript-text">
            <div className="input-method-tabs">
              <div className="tabs">
                <button
                  className={`tab-button ${!transcriptText ? "active" : ""}`}
                  onClick={() => setTranscriptText("")}
                  disabled={isTranscribing}>
                  🎤 음성 인식
                </button>
                <button
                  className={`tab-button ${transcriptText ? "active" : ""}`}
                  onClick={() =>
                    document.querySelector(".transcript-textarea").focus()
                  }>
                  ⌨️ 직접 입력
                </button>
              </div>
            </div>
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder={
                isTranscribing
                  ? "음성을 인식하고 있습니다. 인식이 잘 안 되면 여기에 직접 입력하세요..."
                  : "음성 인식 결과가 여기에 표시됩니다. 직접 입력도 가능합니다..."
              }
              rows="8"
              className="transcript-textarea"
            />
            <div className="transcript-footer">
              <p className="transcript-char-count">
                글자 수: {transcriptText.length}자
                {transcriptText.length > 0 && (
                  <span className="word-count">
                    (
                    {
                      transcriptText
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length
                    }
                    단어)
                  </span>
                )}
              </p>
              <div className="transcript-actions">
                <button
                  onClick={() => setTranscriptText("")}
                  className="clear-btn"
                  disabled={!transcriptText || isTranscribing}>
                  🗑️ 텍스트 지우기
                </button>
                <button
                  onClick={() => {
                    const sampleText =
                      "여기에 뉴스 내용이나 회의 내용을 직접 입력하세요. 예: 오늘 경제 뉴스에서는 주식 시장의 상승세와 부동산 정책 변화에 대해 다뤘습니다.";
                    setTranscriptText(sampleText);
                  }}
                  className="sample-btn"
                  disabled={isTranscribing}>
                  📄 샘플 텍스트
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className="summary-section">
          <h3>AI 요약:</h3>
          <div className="summary-content">
            <div className="summary-text">{summary.summary}</div>
            <div className="summary-meta">
              <p>
                <strong>처리 시간:</strong>{" "}
                {new Date(summary.processedAt).toLocaleString()}
              </p>
              <p>
                <strong>원본 텍스트 길이:</strong> {summary.originalText.length}
                자
              </p>
            </div>
          </div>

          {/* 공유 섹션 */}
          <div className="share-section">
            <h4>📤 요약본 공유하기</h4>

            {/* 클립보드 복사 */}
            <div className="copy-section">
              <button onClick={copyToClipboard} className="copy-btn">
                📋 클립보드에 복사ㄴㄴ
              </button>
              {copied && (
                <span className="copy-success">✅ 복사되었습니다!</span>
              )}
            </div>

            {/* 이메일 전송 섹션 */}
            <div className="email-section">
              <p className="email-notice">요약본을 이메일로 전송해보세요!</p>
              <div className="email-form">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="이메일 주소를 입력하세요"
                  className="email-input"
                  disabled={isSendingEmail}
                />
                <button
                  onClick={sendSummaryEmail}
                  className="send-email-btn"
                  disabled={isSendingEmail || !emailAddress}>
                  {isSendingEmail ? "전송 중..." : "이메일 전송"}
                </button>
              </div>
              {emailSent && (
                <div className="email-success">
                  ✅ 이메일이 성공적으로 전송되었습니다!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="upload-result">
          <h3>업로드 성공!</h3>
          <p>
            <strong>파일명:</strong> {uploadResult.data.fileName}
          </p>
          <p>
            <strong>크기:</strong>{" "}
            {(uploadResult.data.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
          <p>
            <strong>업로드 시간:</strong>{" "}
            {new Date(uploadResult.data.uploadTime).toLocaleString()}
          </p>
          <p>
            <strong>S3 URL:</strong>
          </p>
          <a
            href={uploadResult.data.s3Url}
            target="_blank"
            rel="noopener noreferrer"
            className="s3-link">
            {uploadResult.data.s3Url}
          </a>
        </div>
      )}

      {/* <div className="instructions">
        <h3>사용 방법:</h3>
        <ol>
          <li>"녹음 시작" 버튼을 클릭하여 마이크 권한을 허용하세요</li>
          <li>음성을 녹음하세요</li>
          <li>"녹음 중지" 버튼을 클릭하여 녹음을 완료하세요</li>
          <li>재생하여 확인한 후:</li>
          <ul>
            <li>"파일 다운로드": 로컬에 파일 저장</li>
            <li>"S3에 업로드": AWS S3 버킷에 파일 업로드</li>
          </ul>
        </ol>
      </div> */}
    </div>
  );
};

export default AudioRecorder;
