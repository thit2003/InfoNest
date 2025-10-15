// HomePage.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Home.css";
import "../styles/Suggestions.css";
import TypingIndicator from "../components/TypingIndicator";
import FeedbackBar from "../components/FeedbackBar";
import HelpFab from '../components/HelpFab';
import { BACKEND_API_BASE } from "../config";
import "../styles/ChatLinks.css";
import DOMPurify from "dompurify";
import { linkifyText } from "../utils/linkify";

const infonestLogo = "/logo.png";

const SUGGESTION_PROMPTS = [
  "What undergraduate programs does AU offer?",
  "How do I apply for admission and what are the deadlines?",
  "Tell me about gym hours on campus.",
];

const HomePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sidebarHistory, setSidebarHistory] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      alert("You are not logged in. Please log in first.");
      navigate("/login");
      return;
    }
    if (storedUsername) setUsername(storedUsername);

    if (messages.length === 0) {
      fetchChatHistory(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, messages.length]);

  const fetchChatHistory = async (token) => {
    try {
      const response = await axios.get(`${BACKEND_API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const historyData = response.data.data;
        const formatted = [];
        const side = [];

        historyData.forEach(entry => {
          formatted.push({ sender: "user", text: entry.userMessage });
            formatted.push({ sender: "bot", text: entry.botResponse, historyId: entry._id });
          side.push(entry.userMessage.substring(0, 25) + "...");
        });

        setMessages(formatted);
        setSidebarHistory(side);

        if (formatted.length === 0) {
          setMessages([{ sender: "bot", text: "Hello! How can I help you today?" }]);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        console.error("Failed to fetch chat history:", response.data.error);
        alert("Could not load chat history. Please try again.");
      }
    } catch (error) {
      console.error("Network error fetching chat history:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
      } else {
        alert("Network error. Could not connect to server for history.");
      }
    }
  };

  const sendMessage = async (messageText) => {
    const token = localStorage.getItem("token");
    if (!token || messageText.trim() === "") return;

    setMessages(prev => [...prev, { sender: "user", text: messageText }]);
    setChatInput("");
    setIsBotThinking(true);
    setShowSuggestions(false);

    try {
      const response = await axios.post(
        `${BACKEND_API_BASE}/chat`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (response.status === 200) {
        const { botResponse, historyId } = response.data;
        setMessages(prev => [...prev, { sender: "bot", text: botResponse, historyId }]);
        setSidebarHistory(prev => [...prev, messageText.substring(0, 25) + "..."]);
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: `Error: ${response.data.error || "Failed to get bot response."}` }]);
      }
    } catch (error) {
      console.error("Network error sending message:", error);
      let errorMessage = "Network error. Could not connect to chatbot.";
      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
      } else if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      }
      setMessages(prev => [...prev, { sender: "bot", text: errorMessage }]);
    } finally {
      setIsBotThinking(false);
    }
  };

  const handleSuggestionClick = (text) => {
    if (isBotThinking) return;
    sendMessage(text);
  };

  const handleNewChat = () => {
    setMessages([{ sender: "bot", text: "Hello! How can I help you today?" }]);
    setShowSuggestions(true);
  };

  const handleChatInputChange = e => setChatInput(e.target.value);
  const handleSendButtonClick = () => sendMessage(chatInput);
  const handleInputKeyPress = e => {
    if (e.key === "Enter" && !isBotThinking) sendMessage(chatInput);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  useEffect(() => {
    const messagesContainer = document.querySelector(".chat-messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isBotThinking]);

  function renderMessageHtml(msg) {
    const htmlWithLinks = linkifyText(msg.text);
    return DOMPurify.sanitize(htmlWithLinks, { USE_PROFILES: { html: true } });
  }

  return (
    <>
      <HelpFab hidden={isMobileSidebarOpen} />
      <div className="mobile-header">
        {!isMobileSidebarOpen && (
          <button
            className="hamburger-btn"
            onClick={toggleMobileSidebar}
            aria-label="Open recent chats"
          >
            <span /><span /><span />
          </button>
        )}
        <img src={infonestLogo} alt="InfoNest Logo" className="circle-logo" />
        <h1>InfoNest</h1>
        {!isMobileSidebarOpen && (
          <Link
            to="/feedback"
            className="help-fab"
            aria-label="Feedback & Help"
            title="Feedback & Help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
              <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 3.5"
                    strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </Link>
        )}
      </div>

      {isMobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <div className={`container ${isMobileSidebarOpen ? "no-scroll" : ""}`}>
        <aside className={`sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <img src={infonestLogo} alt="InfoNest Logo" className="circle-logo" />
              <h1>InfoNest</h1>
            </div>
            <button
              className="close-sidebar-btn"
              onClick={closeMobileSidebar}
              aria-label="Close sidebar"
            >×</button>
          </div>

          <button className="new-chat-btn" onClick={handleNewChat}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Chat
          </button>

          <p className="recent-title">RECENT</p>
          <ul className="recent-list">
            {sidebarHistory.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>

          <button className="Log-Out-Btn" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 14 14">
              <path d="M5 2h5v10H5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 7H1m0 0 2-2m-2 2 2 2"
                    fill="none" stroke="currentColor" strokeWidth="1.2"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </aside>

        <main
          className="main-content"
          onClick={isMobileSidebarOpen ? closeMobileSidebar : undefined}
        >
          {showSuggestions && (
            <div className="suggestions-container" role="region" aria-label="Prompt suggestions">
              <p className="suggestions-title">Try one of these prompts:</p>
              <div className="suggestion-chips">
                {SUGGESTION_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(p)}
                    disabled={isBotThinking}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

            <div className="chat-messages-container">
              <ul>
                {messages.map((msg, index) => (
                  <li
                    key={index}
                    className={msg.sender === "user" ? "user-message" : "bot-message"}
                  >
                    <span
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: renderMessageHtml(msg) }}
                    />
                    {msg.sender === "bot" && msg.historyId && (
                      <FeedbackBar historyId={msg.historyId} />
                    )}
                  </li>
                ))}
              </ul>
              <TypingIndicator visible={isBotThinking} />
            </div>

          <div className="ask-container">
            <input
              type="text"
              id="chatInput"
              placeholder="Ask InfoNest anything"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={handleInputKeyPress}
              disabled={isBotThinking}
            />
            <button
              id="sendChatBtn"
              onClick={handleSendButtonClick}
              disabled={isBotThinking || chatInput.trim() === ""}
            >
              {isBotThinking ? "..." : "Send"}
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default HomePage;