// src/pages/HomePage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // For making API calls
import '../styles/Home.css';

const infonestLogo = '/logo.png';
const userAvatar = '/avatar.png';

const HomePage = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [username, setUsername] = useState('User');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sidebarHistory, setSidebarHistory] = useState([]);

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (!token) {
      alert('You are not logged in. Please log in first.');
      navigate('/login');
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Fetch history only if messages are not already loaded
    if (messages.length === 0) {
      fetchChatHistory(token);
    }
  }, [navigate, messages.length]); // Depend on messages.length to re-fetch if needed

  const fetchChatHistory = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const historyData = response.data.data;
        const formattedMessages = [];
        const newSidebarHistory = [];

        historyData.forEach(entry => {
          formattedMessages.push({ sender: 'user', text: entry.userMessage });
          formattedMessages.push({ sender: 'bot', text: entry.botResponse });
          newSidebarHistory.push(entry.userMessage.substring(0, 25) + '...');
        });

        setMessages(formattedMessages);
        setSidebarHistory(newSidebarHistory);

        // If no history, start with a greeting from the bot
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

  const sendMessage = async (messageText) => {
    const token = localStorage.getItem('token');
    if (!token || messageText.trim() === '') return;

    const userMessage = { sender: 'user', text: messageText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setChatInput('');

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        const botResponse = response.data.botResponse;
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: botResponse }]);
        setSidebarHistory(prevSidebar => [...prevSidebar, messageText.substring(0, 25) + '...']);
      } else {
        const errorData = response.data;
        setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: `Error: ${errorData.error || 'Failed to get bot response.'}` }]);
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

  const handleNewChat = () => {
    setMessages([]); // Clear all current messages
    setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
  };

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
  
  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');

  navigate('/login');
};

  useEffect(() => {
    const messagesContainer = document.querySelector('.chat-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="logo-section">
          <img src={infonestLogo} alt="InfoNest Logo" className="circle-logo" />
          <h1>InfoNest</h1>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M7.616 8.5h6.769q.212 0 .356-.144t.144-.357t-.144-.356t-.356-.143h-6.77q-.212 0-.356.144t-.143.357t.143.356t.357.143m0 4h3.769q.212 0 .356-.144t.144-.357t-.144-.356t-.356-.143h-3.77q-.212 0-.356.144t-.143.357t.143.356t.357.143m9.884 4H15q-.213 0-.356-.144t-.144-.357t.144-.356T15 15.5h2.5V13q0-.213.144-.356t.357-.144t.356.144t.143.356v2.5H21q.213 0 .356.144t.144.357t-.144.356T21 16.5h-2.5V19q0 .213-.144.356t-.357.144t-.356-.144T17.5 19zm-11.711 0l-1.6 1.599q-.185.185-.437.089q-.252-.097-.252-.369V5.116q0-.667.475-1.141t1.14-.475h11.77q.666 0 1.14.475t.475 1.14v4.331q0 .249-.164.404q-.165.156-.407.15q-1.237.027-2.274.378q-1.038.35-1.982 1.295q-.938.944-1.292 1.982T12 15.929q.006.242-.16.407t-.394.164z"/></svg>
          New Chat
        </button>

        <p className="recent-title">RECENT</p>
        <ul className="recent-list">
          {sidebarHistory.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>

        <button className="Log-Out-Btn" onClick={handleLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 14 14">
          <path fill="currentColor" fill-rule="evenodd" d="M0 1.5A1.5 1.5 0 0 1 1.5 0h7A1.5 1.5 0 0 1 10 1.5v1.939a2 2 0 0 0-.734 1.311H5.75a2.25 2.25 0 1 0 0 4.5h3.516A2 2 0 0 0 10 10.561V12.5A1.5 1.5 0 0 1 8.5 14h-7A1.5 1.5 0 0 1 0 12.5zm10.963 2.807A.75.75 0 0 0 10.5 5v1H5.75a1 1 0 0 0 0 2h4.75v1a.75.75 0 0 0 1.28.53l2-2a.75.75 0 0 0 0-1.06l-2-2a.75.75 0 0 0-.817-.163" clip-rule="evenodd"/>
          </svg>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="chat-messages-container">
          <ul>
            {messages.map((msg, index) => (
              <li
                key={index}
                className={msg.sender === 'user' ? 'user-message' : 'bot-message'}
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
          <button id="sendChatBtn" onClick={handleSendButtonClick}>Send</button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;