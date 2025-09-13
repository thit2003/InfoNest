// src/pages/HomePage.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // For making API calls
import "../styles/Home.css";
import { BACKEND_API_BASE } from "../config";

const infonestLogo = "/logo.png";
const userAvatar = "/avatar.png";

const HomePage = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [username, setUsername] = useState("User");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sidebarHistory, setSidebarHistory] = useState([]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (!token) {
      navigate("/login");
      return;
    }
    if (username !== currentUser) {
      setCurrentUser(username);
      setMessages([]); // optional clear
      setSidebarHistory([]);
      fetchChatHistory(token);
    }
  }, [navigate, currentUser]);

  const fetchChatHistory = async (token) => {
    try {
      const response = await axios.get(`${BACKEND_API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const historyData = response.data.data;
        const formattedMessages = [];
        const newSidebarHistory = [];

        historyData.forEach((entry) => {
          formattedMessages.push({ sender: "user", text: entry.userMessage });
          formattedMessages.push({ sender: "bot", text: entry.botResponse });
          newSidebarHistory.push(entry.userMessage.substring(0, 25) + "...");
        });

        setMessages(formattedMessages);
        setSidebarHistory(newSidebarHistory);

        // If no history, start with a greeting from the bot
        if (formattedMessages.length === 0) {
          setMessages([
            { sender: "bot", text: "Hello! How can I help you today?" },
          ]);
        }
      } else {
        console.error("Failed to fetch chat history:", response.data.error);
        alert("Could not load chat history. Please try again.");
      }
    } catch (error) {
      console.error("Network error fetching chat history:", error);
      if (error.response && error.response.status === 401) {
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

    const userMessage = { sender: "user", text: messageText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setChatInput("");

    try {
      const response = await axios.post(
        `${BACKEND_API_BASE}/chat`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const botResponse = response.data.botResponse;
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: botResponse },
        ]);
        setSidebarHistory((prevSidebar) => [
          ...prevSidebar,
          messageText.substring(0, 25) + "...",
        ]);
      } else {
        const errorData = response.data;
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: `Error: ${errorData.error || "Failed to get bot response."}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Network error sending message:", error);
      let errorMessage = "Network error. Could not connect to chatbot.";
      if (error.response && error.response.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.error
      ) {
        errorMessage = `Error: ${error.response.data.error}`;
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: errorMessage },
      ]);
    }
  };

  const handleNewChat = () => {
    setMessages([]); // Clear all current messages
    setMessages([{ sender: "bot", text: "Hello! How can I help you today?" }]);
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleSendButtonClick = () => {
    sendMessage(chatInput);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage(chatInput);
    }
  };

  const handleQuickQuestionClick = (e) => {
    sendMessage(e.target.textContent);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setMessages([]);
    setSidebarHistory([]);
    navigate("/login");
  };

  // NEW: toggle mobile sidebar
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  useEffect(() => {
    const messagesContainer = document.querySelector(
      ".chat-messages-container"
    );
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Mobile top bar (hidden on desktop via CSS) */}
      <div className="mobile-header" onClick={toggleMobileSidebar}>
        <img src={infonestLogo} alt="InfoNest Logo" className="circle-logo" />
        <h1>InfoNest</h1>
      </div>

      {/* Backdrop when sidebar open on mobile */}
      {isMobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
      )}

      <div className={`container ${isMobileSidebarOpen ? "no-scroll" : ""}`}>
        <aside className={`sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
          {/* Close button visible only on mobile */}
          <button
            className="close-sidebar-btn"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
              />
            </svg>
          </button>

          <div className="logo-section desktop-only">
            <img
              src={infonestLogo}
              alt="InfoNest Logo"
              className="circle-logo"
            />
            <h1>InfoNest</h1>
          </div>

          <button className="new-chat-btn" onClick={handleNewChat}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New Chat
          </button>

          <p className="recent-title">RECENT</p>
          <ul className="recent-list">
            {sidebarHistory.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>

          <button className="Log-Out-Btn" onClick={handleLogout}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 14 14"
            >
              <path
                d="M5 2h5v10H5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M7 7H1m0 0 2-2m-2 2 2 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </button>
        </aside>

        <main
          className="main-content"
          onClick={isMobileSidebarOpen ? closeMobileSidebar : undefined}
        >
          <div className="chat-messages-container">
            <ul>
              {messages.map((msg, index) => (
                <li
                  key={index}
                  className={
                    msg.sender === "user" ? "user-message" : "bot-message"
                  }
                >
                  {msg.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="ask-container">
            <input
              type="text"
              id="chatInput"
              placeholder="Ask InfoNest anything"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={handleInputKeyPress}
            />
            <button id="sendChatBtn" onClick={handleSendButtonClick}>
              Send
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default HomePage;