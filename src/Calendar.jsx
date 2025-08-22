import React, { useState } from "react";
import "./Calendar.css";
import officemailLogo from "./assets/officemail.svg";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [events, setEvents] = useState([
    {
      id: 1,
      date: "2024-01-15",
      title: "팀 미팅",
      time: "14:00",
      endTime: "15:00",
      type: "meeting",
      location: "회의실 A",
      link: "https://meet.google.com/abc-defg-hij",
      status: "참석",
      calendar: "회사공유일정",
      organizer: "manager@company.com",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 2,
      date: "2025-08-21",
      title: "성우님, 슬예님과의 회의",
      time: "14:30",
      endTime: "15:30",
      type: "meeting",
      location: "FASTFIVE 2F",
      link: "https://meet.google.com/uho-fxaz-vnj",
      status: "다른 용무 중",
      calendar: "회사공유일정",
      organizer: "seokmin.lee@nextintelligence.ai",
      avatar:
        "https://i.namu.wiki/i/IzZNZMwZo3_qZ1fAHJ6Iu05VMyHxwOuboM-UkIx_Ggtiu9es8sq96g67ojeh23qEw-hCI4oO2STMYhKK5Vi20w.webp",
    },
    {
      id: 3,
      date: "2024-01-22",
      title: "프로젝트 발표",
      time: "10:30",
      endTime: "12:00",
      type: "presentation",
      location: "대회의실",
      link: "https://meet.google.com/xyz-uvwx-abc",
      status: "참석 예정",
      calendar: "개인일정",
      organizer: "team@company.com",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 4,
      date: "2024-01-25",
      title: "코드 리뷰",
      time: "16:00",
      endTime: "17:00",
      type: "review",
      location: "온라인",
      link: "https://meet.google.com/def-ghi-jkl",
      status: "참석",
      calendar: "개발팀일정",
      organizer: "dev@company.com",
      avatar: "https://via.placeholder.com/40",
    },
  ]);

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const getMonthData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return { days, month, year };
  };

  const { days, month, year } = getMonthData(currentDate);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDateString = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getEventsForDate = (date) => {
    const dateString = formatDateString(date);
    return events.filter((event) => event.date === dateString);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setTooltipEvent(event);
  };

  const closeTooltip = () => {
    setTooltipEvent(null);
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = dayNames[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayName})`;
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour);
    const period = hourNum < 12 ? "오전" : "오후";
    const displayHour =
      hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${period} ${displayHour}:${minute}`;
  };

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="calendar-container">
      {/* 헤더 */}
      <div className="calendar-header">
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
        <div className="calendar-header-title">
          <img src={officemailLogo} alt="AI 요약본" className="header-avatar" />
          <h1 className="calendar-title">오피스메일 캘린더</h1>
        </div>
        <div className="spacer"></div>
      </div>

      {/* 월 네비게이션 */}
      <div className="month-navigation">
        <button className="nav-button" onClick={() => navigateMonth(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h2 className="month-year">
          {year}년 {monthNames[month]}
        </h2>

        <button className="nav-button" onClick={() => navigateMonth(1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="weekdays">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`weekday ${
              index === 0 ? "sunday" : index === 6 ? "saturday" : ""
            }`}>
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="calendar-grid">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isSelected =
            selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={index}
              className={`calendar-day ${
                !isCurrentMonth(date) ? "other-month" : ""
              } ${isToday(date) ? "today" : ""} ${
                isSelected ? "selected" : ""
              } ${
                index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""
              }`}
              onClick={() => handleDateClick(date)}>
              <span className="day-number">{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`event ${event.type}`}
                      title={`${event.title} (${event.time})`}
                      onClick={(e) => handleEventClick(event, e)}>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="more-events">
                      +{dayEvents.length - 2}개 더
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜의 이벤트 상세 */}
      {selectedDate && (
        <div className="selected-date-events">
          <h3>
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
          </h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="event-list">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className={`event-item ${event.type}`}>
                  <div className="event-time">{event.time}</div>
                  <div className="event-details">
                    <div className="event-title">{event.title}</div>
                    <div className="event-type">
                      {event.type === "meeting" && "회의"}
                      {event.type === "presentation" && "발표"}
                      {event.type === "review" && "리뷰"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-events">이 날에는 일정이 없습니다.</p>
          )}
        </div>
      )}

      {/* 이벤트 툴팁 팝업 */}
      {tooltipEvent && (
        <>
          <div className="tooltip-overlay" onClick={closeTooltip}></div>
          <div
            className="event-tooltip"
            style={{
              position: "absolute",
              left: "50%",
              top: `${tooltipPosition.y}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 1000,
            }}>
            <div className="tooltip-header">
              <img
                src={tooltipEvent.avatar}
                alt="Profile"
                className="tooltip-avatar"
              />
              <div className="tooltip-status">●</div>
              <div className="tooltip-title">{tooltipEvent.title}</div>
              <button className="tooltip-close" onClick={closeTooltip}>
                ×
              </button>
            </div>

            <div className="tooltip-content">
              <div className="tooltip-row">
                <span className="tooltip-icon">📅</span>
                <span className="tooltip-text">
                  {formatEventDate(tooltipEvent.date)}{" "}
                  {formatTime(tooltipEvent.time)} →{" "}
                  {formatTime(tooltipEvent.endTime)}
                </span>
              </div>

              <div className="tooltip-row">
                <span className="tooltip-icon">📍</span>
                <span className="tooltip-text">{tooltipEvent.location}</span>
              </div>

              <div className="tooltip-row">
                <span className="tooltip-icon">🔗</span>
                <a
                  href="/call"
                  className="tooltip-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowConfirmPopup(true);
                  }}>
                  {tooltipEvent.link}
                </a>
              </div>

              <div className="tooltip-row">
                <span className="tooltip-icon">📌</span>
                <span className="tooltip-text">{tooltipEvent.status}</span>
              </div>

              <div className="tooltip-row">
                <span className="tooltip-icon">🗓️</span>
                <div className="tooltip-calendar-info">
                  <div>{tooltipEvent.calendar}</div>
                  <div className="tooltip-organizer">
                    {tooltipEvent.organizer}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI 요약 녹음 확인 팝업 */}
      {showConfirmPopup && (
        <div className="confirm-popup-overlay">
          <div className="confirm-popup">
            <div className="popup-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#007aff"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="#007aff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="#007aff" />
              </svg>
            </div>
            <h3 className="popup-title">AI 요약 녹음을 진행하시겠습니까?</h3>
            <p className="popup-message">
              회의 내용이 자동으로 녹음되며, AI가 실시간으로 요약해드립니다.
            </p>
            <div className="popup-buttons">
              <button
                className="popup-button cancel"
                onClick={() => setShowConfirmPopup(false)}>
                취소
              </button>
              <button
                className="popup-button confirm"
                onClick={() => {
                  setShowConfirmPopup(false);
                  window.location.href = "/call";
                }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
