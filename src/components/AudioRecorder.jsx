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
  const [currentSpeaker, setCurrentSpeaker] = useState(1);
  const [speakerSegments, setSpeakerSegments] = useState([]);
  const [lastSpeechTime, setLastSpeechTime] = useState(Date.now());

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
      setFinalText("");
      setInterimText("");
      setCurrentSpeaker(1);
      setSpeakerSegments([]);
      setLastSpeechTime(Date.now());

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

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

      // 음성 인식 시작 (지연 시작)
      setTimeout(() => startSpeechRecognition(), 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("녹음 시작 오류:", error);
      setError("마이크 권한을 허용해주세요.");
    }
  };

  // 개선된 음성 인식 시작
  const startSpeechRecognition = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      setError(
        "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // 최적화된 설정
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let isRestarting = false;
    let restartAttempts = 0;
    const maxRestartAttempts = 5;
    let currentSpeakerNumber = 1;
    let segments = [];
    let silenceTimer = null;
    const SILENCE_THRESHOLD = 1000; // 1초

    recognition.onstart = () => {
      console.log("🎤 음성 인식 시작");
      setIsTranscribing(true);
      setError("");
      isRestarting = false;
    };

    recognition.onaudiostart = () => {
      console.log("🔊 오디오 캡처 시작");
      setError("");
    };

    recognition.onsoundstart = () => {
      console.log("🔉 소리 감지됨");
      setIsListening(true);
      setLastSpeechTime(Date.now());

      // 침묵 타이머 제거
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    recognition.onsoundend = () => {
      console.log("🔇 소리 종료됨");
      setIsListening(false);

      // 1초 침묵 감지 후 화자 변경
      silenceTimer = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTime;

        if (timeSinceLastSpeech >= SILENCE_THRESHOLD) {
          console.log(
            `🔄 ${SILENCE_THRESHOLD / 1000}초 이상 침묵 감지 - 화자 변경`
          );
          currentSpeakerNumber++;
          setCurrentSpeaker(currentSpeakerNumber);
          console.log(`👤 화자 ${currentSpeakerNumber}로 변경`);
        }
      }, SILENCE_THRESHOLD);
    };

    recognition.onresult = (event) => {
      console.log("📝 음성 인식 결과 수신");
      let interimTranscript = "";
      setLastSpeechTime(Date.now());

      // 침묵 타이머 리셋
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal && transcript) {
          console.log(`✅ 화자 ${currentSpeakerNumber} 최종 결과:`, transcript);

          // 화자별 세그먼트 저장 (상태 업데이트로 누적)
          const newSegment = {
            speaker: currentSpeakerNumber,
            text: transcript,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random(),
          };

          // 기존 segments 상태에 추가
          setSpeakerSegments((prevSegments) => {
            const updatedSegments = [...prevSegments, newSegment];

            // 전체 텍스트 업데이트 (모든 화자의 대화 포함)
            const fullText = updatedSegments
              .map((seg) => `[화자 ${seg.speaker}] ${seg.text}`)
              .join("\n\n");

            setFinalText(fullText);
            setTranscriptText(fullText);

            return updatedSegments;
          });
        } else if (!result.isFinal && transcript) {
          interimTranscript += transcript;
          console.log(`⏳ 화자 ${currentSpeakerNumber} 임시 결과:`, transcript);
        }
      }

      // 중간 결과 업데이트 (현재 화자 표시)
      setInterimText(
        interimTranscript
          ? `[화자 ${currentSpeakerNumber}] ${interimTranscript}`
          : ""
      );

      // 새로운 침묵 감지 타이머 시작 (발언 후 1초 침묵 시 화자 변경)
      silenceTimer = setTimeout(() => {
        console.log(
          `🔄 음성 입력 후 ${SILENCE_THRESHOLD / 1000}초 침묵 - 화자 변경`
        );
        currentSpeakerNumber++;
        setCurrentSpeaker(currentSpeakerNumber);
        console.log(`👤 화자 ${currentSpeakerNumber}로 변경`);
      }, SILENCE_THRESHOLD);
    };

    recognition.onerror = (event) => {
      console.error("❌ 음성 인식 오류:", event.error);

      switch (event.error) {
        case "no-speech":
          console.log("🔇 음성 미감지 - 재시작");
          if (
            isRecording &&
            !isRestarting &&
            restartAttempts < maxRestartAttempts
          ) {
            isRestarting = true;
            restartAttempts++;
            setTimeout(() => {
              if (isRecording) {
                try {
                  recognition.start();
                  console.log(
                    `🔄 음성 인식 재시작 ${restartAttempts}/${maxRestartAttempts}`
                  );
                } catch (e) {
                  console.log("재시작 실패:", e);
                }
              }
            }, 100);
          }
          break;

        case "audio-capture":
          setError("마이크에 접근할 수 없습니다. 마이크 설정을 확인해주세요.");
          setIsTranscribing(false);
          break;

        case "not-allowed":
          setError(
            "마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요."
          );
          setIsTranscribing(false);
          break;

        case "network":
          console.log("🌐 네트워크 오류 - 재시도");
          if (
            isRecording &&
            !isRestarting &&
            restartAttempts < maxRestartAttempts
          ) {
            isRestarting = true;
            restartAttempts++;
            setTimeout(() => {
              if (isRecording) {
                try {
                  recognition.start();
                } catch (e) {
                  console.log("네트워크 오류 후 재시작 실패:", e);
                }
              }
            }, 1000);
          }
          break;

        default:
          console.log(`⚠️ 기타 오류: ${event.error}`);
          break;
      }
    };

    recognition.onend = () => {
      console.log("🔚 음성 인식 종료");

      // 녹음 중이고 재시작 중이 아니면 자동 재시작
      if (
        isRecording &&
        !isRestarting &&
        restartAttempts < maxRestartAttempts
      ) {
        console.log("🔄 자동 재시작");
        isRestarting = true;
        setTimeout(() => {
          if (isRecording) {
            try {
              recognition.start();
              restartAttempts++;
            } catch (e) {
              console.log("자동 재시작 실패:", e);
            }
          }
        }, 100);
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
      recognitionRef.current = null;
    }

    setIsTranscribing(false);
    setIsListening(false);
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

      const isOnEC2 =
        window.location.hostname.includes("ec2-") ||
        window.location.hostname.includes("compute.amazonaws.com");
      const apiUrl = isOnEC2
        ? "/api/upload-audio"
        : "http://localhost:3001/api/upload-audio";

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setUploadResult(result);
      console.log("업로드 성공:", result);
    } catch (error) {
      console.error("업로드 오류:", error);
      setError("S3 업로드 중 오류가 발생했습니다: " + error.message);
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
      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/summarize-audio`
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
      }\n\n⏰ 처리 시간: ${new Date(summary.processedAt).toLocaleString()}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setIsSendingEmail(true);
    setError("");
    setEmailSent(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/send-summary-email`
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
    setFinalText("");
    setInterimText("");
  };

  // 예시 녹음본 로드
  const loadExampleAudio = async () => {
    try {
      setError("");
      setIsTranscribingFile(true);
      setTranscriptText("");
      setSummary(null);

      const response = await fetch(exampleAudioFile);
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      setRecordedAudio({
        blob: blob,
        url: audioUrl,
        isExample: true,
      });

      const formData = new FormData();
      formData.append("audio", blob, "Example-Recorded-Conference.mp3");

      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/transcribe-audio`
        : "http://localhost:3001/api/transcribe-audio";

      const transcribeResponse = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const defaultText = `[화자 1] 이번주 목표는 세 기능의 프로토타입을 완성하는 겁니다 

[화자 2] 디자인 시안은 어제 다 나왔으니 오늘부터 개발에 투입할 수 있습니다 

[화자 3] 저는 테스트 환경을 세팅해 둘게요. 5까지 완료하겠습니다`;

        setTranscriptText(defaultText.trim());
        setIsTranscribingFile(false);
        return;
      }

      const transcribeResult = await transcribeResponse.json();
      const transcribedText = transcribeResult.data.text;

      setTranscriptText(transcribedText);
      setIsTranscribingFile(false);

      console.log("음성 변환 완료!");
    } catch (error) {
      console.error("예시 로드 오류:", error);
      setError("예시를 로드하는 중 오류가 발생했습니다.");
      setIsTranscribingFile(false);
    }
  };

  return (
    <div className="audio-recorder">
      <h2>🎙️ 실시간 음성 인식기</h2>

      <div className="recorder-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? "recording" : ""}
          disabled={isUploading}>
          {isRecording ? "🔴 녹음 중지" : "🎤 녹음 시작"}
        </button>
      </div>

      {error && (
        <div className="error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* 실시간 음성 인식 상태 */}
      {isTranscribing && (
        <div className="transcribing">
          <div className="real-time-status">
            <div className="status-header">
              <p>🎤 실시간 음성 인식 중...</p>
              <div
                className={`listening-indicator ${
                  isListening ? "active" : ""
                }`}>
                <span className="status-icon">🎵</span>
                <span className="status-text">
                  {isListening
                    ? `👤 화자 ${currentSpeaker} 발언 중`
                    : "음성 대기 중"}
                </span>
              </div>
              <div className="speaker-info">
                <span className="current-speaker">
                  현재 화자: {currentSpeaker}
                </span>
                <span className="total-speakers">
                  총 화자 수:{" "}
                  {Math.max(
                    currentSpeaker,
                    speakerSegments.length > 0
                      ? Math.max(...speakerSegments.map((s) => s.speaker))
                      : 1
                  )}
                </span>
              </div>
            </div>

            {/* 실시간 음성 인식 결과 표시 */}
            <div
              className={`live-transcription ${isListening ? "active" : ""}`}>
              {finalText || interimText ? (
                <>
                  {finalText && (
                    <div className="final-text">
                      <span className="confirmed-text">{finalText}</span>
                    </div>
                  )}
                  {interimText && (
                    <div className="interim-text">
                      <span className="processing-text">{interimText}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="transcription-placeholder">
                  음성을 말씀해주세요. 1초 침묵 시 자동으로 다른 화자로
                  인식됩니다.
                </div>
              )}

              <div className="transcription-stats">
                <div className="stat-item">
                  <span>📝</span>
                  <span className="stat-value">
                    {finalText.length + interimText.length}자
                  </span>
                </div>
                <div className="stat-item">
                  <span>⚡</span>
                  <span className="stat-value">실시간</span>
                </div>
                <div className="stat-item">
                  <span>🎯</span>
                  <span className="stat-value">
                    {isListening ? "인식중" : "대기중"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="recognition-tips">
            <p>
              <strong>💡 음성 인식 팁:</strong>
            </p>
            <ul>
              <li>
                ✅ <strong>마이크에 가까이</strong> - 명확한 음성으로
              </li>
              <li>
                🔊 <strong>조용한 환경</strong> - 배경소음 최소화
              </li>
              <li>
                🗣️ <strong>또렷한 발음</strong> - 천천히 말하기
              </li>
              <li>
                ⏸️ <strong>1초 쉼</strong> - 화자 변경을 위한 자연스러운 쉼
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 기존 UI 컴포넌트들... */}
      {recordedAudio && (
        <div className="recorded-audio">
          <h3>녹음 완료!</h3>
          <audio controls src={recordedAudio.url}></audio>

          <div className="audio-controls">
            <button onClick={downloadAudio} className="download-btn">
              📁 녹음 파일 다운로드
            </button>
            <button
              onClick={summarizeWithClaude}
              className="summarize-btn"
              disabled={isSummarizing || !transcriptText.trim()}>
              🤖 AI 요약
            </button>
            <button onClick={resetRecording} className="reset-btn">
              🔄 새 녹음
            </button>
          </div>
        </div>
      )}

      {/* 텍스트 영역 */}
      {transcriptText && (
        <div className="transcript-section">
          <h3>📝 음성 인식 결과:</h3>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="음성 인식 결과가 여기에 표시됩니다..."
            rows="8"
            className="transcript-textarea"
          />
          <div className="transcript-footer">
            <p className="transcript-char-count">
              글자 수: {transcriptText.length}자
            </p>
            <div className="transcript-actions">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(transcriptText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="clear-btn"
                disabled={!transcriptText}>
                {copied ? "✅ 복사됨!" : "📋 복사하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 요약 결과 */}
      {summary && (
        <div className="summary-section">
          <h3>🤖 AI 요약:</h3>
          <div
            className="summary-text"
            dangerouslySetInnerHTML={{
              __html: summary.summary
                // 마크다운의 **텍스트** 또는 __텍스트__ 를 <strong>텍스트</strong>로 변환
                .replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>")
                // 마크다운의 *텍스트* 또는 _텍스트_ 를 <em>텍스트</em>로 변환 (굵게 처리된 것 제외)
                .replace(/(\*|_)(.*?)\1/g, "<em>$2</em>")
                // 마크다운의 `코드`를 <code>코드</code>로 변환
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                // 마크다운의 --- 또는 *** 구분선을 <hr>로 변환
                .replace(/(^|\n)(---|\*\*\*)(\n|$)/g, "<hr>")
                // 마크다운의 번호 없는 리스트(-, *, +)를 <ul><li>...</li></ul>로 변환 (간단 버전)
                .replace(
                  /(?:^|\n)[\-\*\+]\s(.+)/g,
                  (match, p1) => `<li>${p1}</li>`
                )
                // 여러 <li>가 연속되면 <ul>로 감싸기
                .replace(
                  /(<li>[\s\S]+?<\/li>)/g,
                  (match) => `<ul>${match}</ul>`
                ),
            }}
          />

          <div className="share-section">
            <h4>📤 요약본 공유하기</h4>

            <div className="copy-section">
              <button onClick={copyToClipboard} className="copy-btn">
                📋 클립보드에 복사
              </button>
              {copied && (
                <span className="copy-success">✅ 복사되었습니다!</span>
              )}
            </div>

            <div className="email-section">
              <p className="email-notice">📧 요약본을 이메일로 전송해보세요!</p>
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
                  {isSendingEmail ? "전송 중..." : "📧 이메일 전송"}
                </button>
              </div>
              {emailSent && (
                <div className="email-success">
                  <p>✅ 이메일이 성공적으로 전송되었습니다!</p>
                  <button
                    onClick={() =>
                      window.open("https://app.officemail.io", "_blank")
                    }
                    className="office-mail-btn"
                    style={{marginTop: "10px"}}>
                    🏢 오피스메일로 이동하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태들 */}
      {isUploading && (
        <div className="uploading">
          <p>☁️ S3에 업로드 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isSummarizing && (
        <div className="summarizing">
          <p>🤖 AI 요약 생성 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isSendingEmail && (
        <div className="sending-email">
          <p>📧 이메일 전송 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {isTranscribingFile && (
        <div className="transcribing">
          <p>🎵 예시 음성 파일을 텍스트로 변환 중...</p>
          <div className="spinner"></div>
        </div>
      )}

      {uploadResult && (
        <div className="upload-result">
          <h3>☁️ 업로드 성공!</h3>
          <p>
            <strong>파일명:</strong> {uploadResult.data.fileName}
          </p>
          <p>
            <strong>크기:</strong>{" "}
            {(uploadResult.data.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
