// src/pages/HomePage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirection
import axios from 'axios'; // For making API calls
import '../styles/Home.css'; // Import the CSS file

// Placeholder images - you'll need to move your logo.png and avatar.png
// into the public/ or src/assets/ folder and import them properly in React.
// For now, let's assume they are directly in public/ or you can use placeholder URLs.
const infonestLogo = '/logo.png'; // Assuming logo.png is in public/
const userAvatar = '/avatar.png'; // Assuming avatar.png is in public/

const HomePage = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [username, setUsername] = useState('User');
  const [messages, setMessages] = useState([]); // Stores { sender: 'user'/'bot', text: '...' }
  const [chatInput, setChatInput] = useState('');
  const [sidebarHistory, setSidebarHistory] = useState([]); // For the Recent list in sidebar

  const API_BASE_URL = 'http://localhost:8000/api';

  // --- Authentication Check and Fetch Initial Data on Mount ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (!token) {
      alert('You are not logged in. Please log in first.');
      navigate('/login'); // Redirect to login page
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetchChatHistory(token); // Fetch history when component mounts
  }, [navigate]); // Dependency array: run once on mount, or if navigate function changes (rare)

  // --- Function to Fetch Chat History ---
  const fetchChatHistory = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const historyData = response.data.data;
        const formattedMessages = [];
        const newSidebarHistory = [];

        historyData.forEach(entry => {
          formattedMessages.push({ sender: 'user', text: entry.userMessage });
          formattedMessages.push({ sender: 'bot', text: entry.botResponse });
          newSidebarHistory.push(entry.userMessage.substring(0, 25) + '...'); // Truncate for sidebar
        });

        setMessages(formattedMessages);
        setSidebarHistory(newSidebarHistory);

        if (formattedMessages.length === 0) {
          setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
        }

      } else {
        console.error('Failed to fetch chat history:', response.data.error);
        alert('Could not load chat history. Please try again.');
      }
    } catch (error) {
      console.error('Network error fetching chat history:', error);
      if (error.response && error.response.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      } else {
        alert('Network error. Could not connect to server for history.');
      }
    }
  };

  // --- Function to Send Message to Chatbot ---
  const sendMessage = async (messageText) => {
    const token = localStorage.getItem('token');
    if (!token || messageText.trim() === '') return;

    const userMessage = { sender: 'user', text: messageText };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // Optimistic update

    setChatInput(''); // Clear input field

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`,
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const botResponse = response.data.botResponse;
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: botResponse }]);
        // Update sidebar with last user message
        setSidebarHistory(prevSidebar => [...prevSidebar, messageText.substring(0, 25) + '...']);
      } else {
        const errorData = response.data;
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: `Error: ${errorData.error || 'Failed to get bot response.'}` }]);
        console.error('Bot response error:', errorData);
      }
    } catch (error) {
      console.error('Network error sending message:', error);
      let errorMessage = 'Network error. Could not connect to chatbot.';
      if (error.response && error.response.status === 401) {
         errorMessage = 'Session expired. Please log in again.';
         localStorage.removeItem('token');
         localStorage.removeItem('username');
         navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
         errorMessage = `Error: ${error.response.data.error}`;
      }
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: errorMessage }]);
    }
  };

  // --- Event Handlers ---
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleSendButtonClick = () => {
    sendMessage(chatInput);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage(chatInput);
    }
  };

  const handleQuickQuestionClick = (e) => {
    sendMessage(e.target.textContent);
  };

  // Auto-scroll messages to bottom
  useEffect(() => {
    const messagesContainer = document.querySelector('.chat-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]); // Scroll whenever messages state updates

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="logo-section">
          <img src={infonestLogo} alt="InfoNest Logo" className="circle-logo" />
          <h1>InfoNest</h1>
        </div>

        <button className="new-chat-btn">✏️ New chat</button>

        <p className="recent-title">Recent</p>
        <ul className="recent-list">
          {sidebarHistory.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>

        <div className="settings-footer">⚙️ Settings & Help</div>
      </aside>

      <main className="main-content">
        <div className="avatar-container">
          <img src={userAvatar} alt="User Avatar" className="avatar-img" />
        </div>

        <h1 className="greeting">Hello, <span id="userNameGreeting">{username}</span>!</h1>

        {/* Chat messages display area */}
        <div className="chat-messages-container" style={{ maxHeight: '400px', overflowY: 'auto', width: '70%', marginBottom: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {messages.map((msg, index) => (
              <li
                key={index}
                style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  borderRadius: '15px',
                  maxWidth: '70%',
                  wordWrap: 'break-word',
                  backgroundColor: msg.sender === 'user' ? '#dcf8c6' : '#e0e0e0',
                  marginLeft: msg.sender === 'user' ? 'auto' : '0',
                  marginRight: msg.sender === 'user' ? '0' : 'auto',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}
              >
                {msg.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="buttons-row">
          <button className="quick-question-btn" onClick={handleQuickQuestionClick}>What is Assumption University?</button>
          <button className="quick-question-btn" onClick={handleQuickQuestionClick}>How can I enroll as an international student?</button>
          <button className="quick-question-btn" onClick={handleQuickQuestionClick}>Give me study plan for bachelor of Computer Science</button>
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
          <button id="sendChatBtn" onClick={handleSendButtonClick} style={{ padding: '10px 15px', borderRadius: '20px', border: 'none', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer', marginLeft: '10px' }}>Send</button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;