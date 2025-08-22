import React, { useState, useEffect } from "react";
import "./Call.css";

const Call = () => {
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants] = useState([
    {
      id: 1,
      name: "한성우",
      avatar:
        "https://i.namu.wiki/i/IzZNZMwZo3_qZ1fAHJ6Iu05VMyHxwOuboM-UkIx_Ggtiu9es8sq96g67ojeh23qEw-hCI4oO2STMYhKK5Vi20w.webp",
      isVideoOn: true,
      isMuted: false,
      isHost: true,
    },
    {
      id: 2,
      name: "김슬예",
      avatar:
        "https://data.onnada.com/character/201102/C4528_2048931622_76016405_2.JPG",
      isVideoOn: true,
      isMuted: false,
      isHost: false,
    },
    {
      id: 3,
      name: "나 (임희정)",
      avatar:
        "https://i.namu.wiki/i/0CGPK4s1T2AUebeIYXxDmgvZ5daUjMAPjUwfljMI3_NdjQzsOkurt3K2gKci-xMGYtxDnkS9K5PzSZUWpnkkRw.webp",
      isVideoOn: !isVideoOff,
      isMuted: isMuted,
      isHost: false,
    },
  ]);

  // 통화 시간 카운터
  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    // 실제 앱에서는 라우터로 이동하거나 통화 종료 처리
    alert("통화가 종료되었습니다.");
    window.location.href = "/chat";
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="call-container">
      {/* 헤더 */}
      <div className="call-header">
        <div className="call-info">
          <h2 className="call-title">성우님, 슬예님과의 회의</h2>
          <div className="call-duration">{formatDuration(callDuration)}</div>
        </div>
        <div className="call-actions">
          <button className="minimize-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 12h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button className="expand-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18-5v3a2 2 0 0 1-2 2h-3m0 14h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 참가자 비디오 영역 */}
      <div className="video-grid">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`video-participant ${participant.id === 3 ? "me" : ""}`}>
            <div className="video-container">
              {participant.isVideoOn ? (
                <div className="video-placeholder">
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="participant-avatar-large"
                  />
                </div>
              ) : (
                <div className="video-off">
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="participant-avatar"
                  />
                  <div className="video-off-text">카메라 꺼짐</div>
                </div>
              )}

              <div className="participant-overlay">
                <div className="participant-name">
                  {participant.name}
                  {participant.isHost && (
                    <span className="host-badge">호스트</span>
                  )}
                </div>
                <div className="participant-status">
                  {participant.isMuted && (
                    <div className="muted-indicator">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none">
                        <path
                          d="M17 14h.01M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 18v3h6v-3M3 17a6 6 0 0 0 12 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 4l-18 16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 컨트롤 */}
      <div className="call-controls">
        <div className="controls-left">
          <div className="participants-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{participants.length}명</span>
          </div>
        </div>

        <div className="controls-center">
          <button
            className={`control-button ${isMuted ? "muted" : ""}`}
            onClick={toggleMute}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {isMuted ? (
                <>
                  <path
                    d="M17 14h.01M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 18v3h6v-3M3 17a6 6 0 0 0 12 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 4l-18 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 18v3h6v-3M3 17a6 6 0 0 0 12 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          </button>

          <button
            className={`control-button ${isVideoOff ? "video-off" : ""}`}
            onClick={toggleVideo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {isVideoOff ? (
                <>
                  <path
                    d="M16 16v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 1l22 22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <polygon
                    points="23,7 16,12 23,17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="1"
                    y="5"
                    width="15"
                    height="14"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          </button>

          <button className="control-button end-call" onClick={handleEndCall}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 11l4 4 4-4M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button className="control-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button className="control-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="controls-right">
          <button className="more-options">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* 연결 상태 표시 */}
      <div className="connection-status">
        <div className="status-indicator">
          <div className="signal-strength">
            <div className="signal-bar"></div>
            <div className="signal-bar"></div>
            <div className="signal-bar"></div>
            <div className="signal-bar active"></div>
          </div>
          <span>연결 양호</span>
        </div>
      </div>
    </div>
  );
};

export default Call;
