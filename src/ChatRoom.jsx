import React, { useState, useRef, useEffect } from "react";
import "./ChatRoom.css";
import officemailLogo from "./assets/officemail.svg";

const ChatRoom = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: [
        "-Bedrock 연동은 완료했지만 Structured Output과 스트리밍 동시 지원에서 문제가 발생하고 있습니다.",
        "-현재 스트리밍 답변 API에서 에러가 많이 발생해서 일단 이전 API로 돌려놓았습니다.",
        "-Groq의 분당 토큰 제한이 25만 TPM이라 프로덕션 환경에서는 엔터프라이즈 계정이 필요할 것 같습니다.",
        "-GPT OSS 120B 모델 테스트 결과 3.9초로 속도가 빠르고 성능도 79점으로 양호합니다.",
      ].join("\n"),
      name: "한성우",
      sender: "other",
      time: "오후 2:30",
      avatar:
        "https://i.namu.wiki/i/IzZNZMwZo3_qZ1fAHJ6Iu05VMyHxwOuboM-UkIx_Ggtiu9es8sq96g67ojeh23qEw-hCI4oO2STMYhKK5Vi20w.webp",
    },
    {
      id: 2,
      text: [
        "-Bedrock 이슈가 해결되지 않으면 다음 주에 전체 백엔드를 Groq으로 전환하겠습니다",
        "-장기적으로 온프레미스 대응을 위해 오픈소스 모델 최적화 방향으로 가는 게 좋겠습니다",
      ].join("\n"),
      sender: "me",
      name: "임희정",
      time: "오후 2:32",
      avatar:
        "https://i.namu.wiki/i/0CGPK4s1T2AUebeIYXxDmgvZ5daUjMAPjUwfljMI3_NdjQzsOkurt3K2gKci-xMGYtxDnkS9K5PzSZUWpnkkRw.webp",
    },
    {
      id: 3,
      text: [
        "-제품소개서 초안이 완성되었고 팀 피드백을 받아서 내일부터 외부 배포 예정입니다",
        "-AI 인박스, 출처 표시, 일반 인박스 간의 UI 일관성이 부족해서 통일성 작업이 필요합니다",
        "-GPT-5 기준으로 모델 평가를 다시 진행해서 목요일까지 결과를 공유하겠습니다",
        "-사용자 피드백을 보면 출처보다는 주제 요약 표시가 훨씬 더 효과적인 것 같습니다",
      ].join("\n"),
      sender: "other",
      name: "김슬예",
      time: "오후 2:33",
      avatar:
        "https://data.onnada.com/character/201102/C4528_2048931622_76016405_2.JPG",
    },
  ]);

  const [listItems, setListItems] = useState([
    {
      id: 1,
      title: "회의 주제 1",
      description: "AI 기술 동향 분석",
      completed: false,
    },
    {
      id: 2,
      title: "회의 주제 2",
      description: "프로젝트 진행 상황 점검",
      completed: true,
    },
    {
      id: 3,
      title: "회의 주제 3",
      description: "다음 단계 계획 수립",
      completed: false,
    },
    {
      id: 4,
      title: "회의 주제 4",
      description: "리소스 배분 계획",
      completed: false,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [summaryCompleted, setSummaryCompleted] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [showRawDataPopup, setShowRawDataPopup] = useState(false);
  const messagesEndRef = useRef(null);

  // 요약 데이터
  const summaryData = {
    title: "AI 프로젝트 회의 요약",
    date: "2025년 8월 22일",
    participants: ["한성우", "김슬예", "임희정"],
    duration: "45분",
    keyPoints: [
      {
        topic: "AI 기술 동향 분석",
        details:
          "최신 AI 기술 트렌드와 업계 동향에 대한 논의. GPT-4와 같은 대규모 언어 모델의 발전과 실무 적용 가능성 검토",
      },
      {
        topic: "프로젝트 진행 상황 점검",
        details:
          "현재 진행 중인 AI 요약 기능 개발 현황 공유. 전체 진행률 75% 달성, 주요 기능 구현 완료",
      },
      {
        topic: "다음 단계 계획 수립",
        details:
          "향후 2주간의 개발 로드맵 확정. UI/UX 개선 작업과 성능 최적화 우선 진행 예정",
      },
      {
        topic: "리소스 배분 계획",
        details:
          "팀원별 역할 분담 및 일정 조정. 프론트엔드 2명, 백엔드 1명 추가 투입 결정",
      },
    ],
    actionItems: [
      {
        assignee: "한성우",
        task: "AI 모델 성능 최적화 방안 연구",
        dueDate: "8월 29일",
      },
      {
        assignee: "김슬예",
        task: "사용자 인터페이스 개선안 작성",
        dueDate: "8월 26일",
      },
      {
        assignee: "임희정",
        task: "테스트 시나리오 작성 및 QA 진행",
        dueDate: "8월 30일",
      },
    ],
    nextMeeting: "2025년 8월 29일 오후 2시",
  };

  // 원본 요약 데이터 (가공되지 않은 JSON 형태)
  const rawSummaryData = {
    meeting_id: "MTG_20250822_001",
    timestamp: "2025-08-22T14:00:00Z",
    participants: [
      {
        user_id: "user_001",
        name: "한성우",
        role: "Backend Developer",
        avatar_url:
          "https://i.namu.wiki/i/IzZNZMwZo3_qZ1fAHJ6Iu05VMyHxwOuboM-UkIx_Ggtiu9es8sq96g67ojeh23qEw-hCI4oO2STMYhKK5Vi20w.webp",
      },
      {
        user_id: "user_002",
        name: "김슬예",
        role: "Frontend Developer",
        avatar_url:
          "https://data.onnada.com/character/201102/C4528_2048931622_76016405_2.JPG",
      },
      {
        user_id: "user_003",
        name: "임희정",
        role: "QA Engineer",
        avatar_url:
          "https://i.namu.wiki/i/0CGPK4s1T2AUebeIYXxDmgvZ5daUjMAPjUwfljMI3_NdjQzsOkurt3K2gKci-xMGYtxDnkS9K5PzSZUWpnkkRw.webp",
      },
    ],
    duration_minutes: 45,
    raw_transcript: [
      {
        speaker: "한성우",
        timestamp: "14:30:15",
        content:
          "Bedrock 연동은 완료했지만 Structured Output과 스트리밍 동시 지원에서 문제가 발생하고 있습니다.",
      },
      {
        speaker: "한성우",
        timestamp: "14:31:22",
        content:
          "현재 스트리밍 답변 API에서 에러가 많이 발생해서 일단 이전 API로 돌려놓았습니다.",
      },
      {
        speaker: "한성우",
        timestamp: "14:32:45",
        content:
          "Groq의 분당 토큰 제한이 25만 TPM이라 프로덕션 환경에서는 엔터프라이즈 계정이 필요할 것 같습니다.",
      },
      {
        speaker: "임희정",
        timestamp: "14:35:12",
        content:
          "Bedrock 이슈가 해결되지 않으면 다음 주에 전체 백엔드를 Groq으로 전환하겠습니다",
      },
      {
        speaker: "김슬예",
        timestamp: "14:37:30",
        content:
          "제품소개서 초안이 완성되었고 팀 피드백을 받아서 내일부터 외부 배포 예정입니다",
      },
    ],
    ai_analysis: {
      sentiment_score: 0.65,
      key_topics: [
        "bedrock_integration",
        "api_streaming",
        "groq_migration",
        "product_launch",
        "ui_consistency",
      ],
      action_items_detected: 3,
      next_meeting_scheduled: true,
      meeting_effectiveness_score: 8.2,
    },
    metadata: {
      recording_quality: "high",
      transcription_accuracy: 94.5,
      processing_time_ms: 2840,
      model_version: "summary-ai-v2.1.3",
    },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 마운트 시 초기 로딩
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSummaryConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSummaryCompleted(true);
    }, 2000);
  };

  const closeSummaryPopup = () => {
    setShowSummaryPopup(false);
    setIsLoading(false);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setEditingMessage(null);
    setEditText("");
  };

  const handleSaveEdit = () => {
    // 여기에 실제 수정 기능을 구현할 수 있습니다
    console.log("수정된 텍스트:", editText);
    closeEditPopup();
  };

  const toggleListItem = (id) => {
    setListItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleCreateTrelloTicket = (item) => {
    // 트렐로 티켓 생성 로직
    alert(`트렐로에 "${item.title}" 티켓이 생성되었습니다.`);
    // 실제 구현에서는 Trello API 호출
  };

  const handleSaveToCalendar = (item) => {
    // 캘린더 저장 로직
    alert(`"${item.title}"이 캘린더에 저장되었습니다.`);
    // 실제 구현에서는 Calendar API 호출 또는 라우터 이동
  };

  // 초기 로딩 화면
  if (isInitialLoading) {
    return (
      <div className="chat-container">
        {/* 헤더 */}
        <div className="chat-header">
          <button className="back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="chat-user-info">
            <img
              src={officemailLogo}
              alt="AI 요약본"
              className="header-avatar"
            />
            <span> AI 요약본</span>
          </div>
          <div className="header-spacer"></div>
          <button className="menu-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* 초기 로딩 스피너 */}
        <div className="initial-loading-area">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div className="loading-text">AI 요약이 진행중입니다...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* 헤더 */}
      <div className="chat-header">
        <button className="back-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="chat-user-info">
          <img src={officemailLogo} alt="AI 요약본" className="header-avatar" />
          <span> AI 요약본</span>
        </div>
        {summaryCompleted && (
          <div className="header-buttons">
            <button
              className="json-view-button"
              onClick={() => setShowRawDataPopup(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 12c0 1-2 2-4 2s-4-1-4-2 2-2 4-2 4 1 4 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <text
                  x="12"
                  y="12.8"
                  textAnchor="middle"
                  fontSize="4"
                  fill="currentColor"
                  fontWeight="bold"
                  fontFamily="monospace">
                  {}
                </text>
              </svg>
              <span>원본 데이터 보기</span>
            </button>
            <button
              className="summary-view-button"
              onClick={() => setShowSummaryPopup(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14,2 14,8 20,8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline
                  points="10,9 9,9 8,9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>요약 보기</span>
            </button>
            <button
              className="officemail-button"
              onClick={() => (window.location.href = "/officemail")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="15,3 21,3 21,9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="14"
                  x2="21"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>메일 보기</span>
            </button>
          </div>
        )}
        <button className="menu-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* 분할된 메인 컨텐츠 영역 */}
      <div className="split-content">
        {/* 메시지 영역 (상단) */}
        <div className="messages-area">
          <div className="date-divider">
            <span>2025년 8월 22일</span>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.sender === "me" ? "sent" : "received"
              }`}>
              {message.sender === "other" && (
                <img
                  src={message.avatar}
                  alt="Avatar"
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                <div className="message-header">
                  <div className="message-name">{message.name}</div>
                  {message.sender === "other" && (
                    <button
                      className="edit-message-button"
                      onClick={() => handleEditMessage(message)}
                      title="메시지 수정">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none">
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="message-bubble">
                  <p>{message.text}</p>
                </div>
                <span className="message-time">{message.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <img
                src="https://via.placeholder.com/40"
                alt="Avatar"
                className="message-avatar"
              />
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 로딩 스피너 영역 */}
        {/* {isLoading && (
          <div className="loading-area">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <div className="loading-text">
                AI가 회의 안건을 분석하고 있습니다...
              </div>
            </div>
          </div>
        )} */}

        {/* 리스트 영역 (하단) - 조건부 렌더링 */}
        {/* {!isLoading && (
          <div className="list-area">
            <div className="list-header">
              <h3>회의 안건</h3>
              <span className="list-count">
                {listItems.filter((item) => !item.completed).length}개 남음
              </span>
            </div>
            <div className="list-content">
              {listItems.map((item) => (
                <div
                  key={item.id}
                  className={`list-item ${item.completed ? "completed" : ""}`}>
                  <div
                    className="list-item-checkbox"
                    onClick={() => toggleListItem(item.id)}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={item.completed ? "checked" : ""}>
                      {item.completed && (
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{item.title}</div>
                    <div className="list-item-description">
                      {item.description}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button
                      className="action-button trello-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTrelloTicket(item);
                      }}
                      title="트렐로에 티켓 생성하기">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none">
                        <rect
                          x="3"
                          y="3"
                          width="7"
                          height="12"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="8"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      트렐로
                    </button>
                    <button
                      className="action-button calendar-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToCalendar(item);
                      }}
                      title="캘린더 저장하기">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none">
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="16"
                          y1="2"
                          x2="16"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="8"
                          y1="2"
                          x2="8"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="3"
                          y1="10"
                          x2="21"
                          y2="10"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      캘린더
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>

      {/* 입력 영역 */}
      <div className="input-area">
        <button
          className={`summary-confirm-button ${isLoading ? "loading" : ""} ${
            summaryCompleted ? "completed" : ""
          }`}
          onClick={handleSummaryConfirm}
          disabled={isLoading || summaryCompleted}>
          {isLoading ? (
            <>
              <div className="button-spinner"></div>
              AI가 요약을 생성하고 있습니다...
            </>
          ) : summaryCompleted ? (
            "AI 요약이 완료되었습니다!"
          ) : (
            "이 요약 내용이 맞을까요?"
          )}
        </button>
      </div>

      {/* 요약 팝업 */}
      {showSummaryPopup && (
        <div className="summary-popup-overlay" onClick={closeSummaryPopup}>
          <div className="summary-popup" onClick={(e) => e.stopPropagation()}>
            <div className="summary-popup-header">
              <h2 className="summary-popup-title">{summaryData.title}</h2>
              <button
                className="summary-popup-close"
                onClick={closeSummaryPopup}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="summary-popup-content">
              {/* 회의 정보 */}
              <div className="summary-info">
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <span>{summaryData.date}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">👥</span>
                  <span>{summaryData.participants.join(", ")}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">⏱️</span>
                  <span>{summaryData.duration}</span>
                </div>
              </div>

              {/* 주요 논의 사항 */}
              <div className="summary-section">
                <h3 className="section-title">주요 논의 사항</h3>
                <div className="key-points">
                  {summaryData.keyPoints.map((point, index) => (
                    <div key={index} className="key-point">
                      <h4 className="point-topic">
                        {index + 1}. {point.topic}
                      </h4>
                      <p className="point-details">{point.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 아이템 */}
              <div className="summary-section">
                <h3 className="section-title">액션 아이템</h3>
                <div className="action-items">
                  {summaryData.actionItems.map((item, index) => (
                    <div key={index} className="action-item">
                      <div className="action-assignee">{item.assignee}</div>
                      <div className="action-task">{item.task}</div>
                      <div className="action-due">~{item.dueDate}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 다음 회의 일정 */}
              <div className="next-meeting">
                <span className="next-icon">📌</span>
                <span>다음 회의: {summaryData.nextMeeting}</span>
              </div>
            </div>

            <div className="summary-popup-footer">
              <button
                className="summary-action-button"
                onClick={closeSummaryPopup}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 수정 팝업 */}
      {showEditPopup && (
        <div className="edit-popup-overlay" onClick={closeEditPopup}>
          <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
            <div className="edit-popup-header">
              <h3 className="edit-popup-title">메시지 수정</h3>
              <button className="edit-popup-close" onClick={closeEditPopup}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="edit-popup-content">
              <div className="edit-message-info">
                <div className="edit-sender-info">
                  <img
                    src={editingMessage?.avatar}
                    alt="Avatar"
                    className="edit-avatar"
                  />
                  <span className="edit-sender-name">
                    {editingMessage?.name}
                  </span>
                  <span className="edit-message-time">
                    {editingMessage?.time}
                  </span>
                </div>
              </div>

              <div className="edit-form">
                <label className="edit-label">메시지 내용</label>
                <textarea
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="메시지를 수정하세요..."
                  rows={8}
                />
              </div>
            </div>

            <div className="edit-popup-footer">
              <button className="edit-cancel-button" onClick={closeEditPopup}>
                취소
              </button>
              <button className="edit-save-button" onClick={handleSaveEdit}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 원본 데이터 팝업 */}
      {showRawDataPopup && (
        <div
          className="raw-data-popup-overlay"
          onClick={() => setShowRawDataPopup(false)}>
          <div className="raw-data-popup" onClick={(e) => e.stopPropagation()}>
            <div className="raw-data-popup-header">
              <h3 className="raw-data-popup-title">원본 요약 데이터</h3>
              <button
                className="raw-data-popup-close"
                onClick={() => setShowRawDataPopup(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="raw-data-popup-content">
              <div className="raw-data-info">
                <div className="raw-data-badge">
                  <span className="badge-icon">🔍</span>
                  <span>가공되지 않은 원본 데이터</span>
                </div>
                <p className="raw-data-description">
                  AI가 생성한 실제 요약 데이터를 JSON 형태로 확인할 수 있습니다.
                </p>
              </div>

              <div className="raw-data-container">
                <div className="raw-data-header">
                  <span className="data-format">JSON</span>
                  <button
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(rawSummaryData, null, 2)
                      );
                      alert("클립보드에 복사되었습니다!");
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    복사
                  </button>
                </div>
                <pre className="raw-data-content">
                  <code>{JSON.stringify(rawSummaryData, null, 2)}</code>
                </pre>
              </div>
            </div>

            <div className="raw-data-popup-footer">
              <button
                className="raw-data-close-button"
                onClick={() => setShowRawDataPopup(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
