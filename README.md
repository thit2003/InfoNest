# InfoNest: All Your University Answers in One Place 🎓

## Project Overview 🚀

InfoNest is a web-based chatbot designed to revolutionize how students, staff, and parents access university information. By leveraging natural language processing and using Gemini API call, InfoNest provides instant, accurate answers to frequently asked questions, aiming to alleviate the burden on administrative staff and enhance the overall university experience.

## Team Members 👥

*   **[@thit2003](https://github.com/thit2003)** - **John**
*   **[@KnoxHasGF](https://github.com/KnoxHasGF)** - **Knox**

## Problem Statement 😟

Universities often face significant challenges in managing and disseminating information, leading to:

*   **Staff Overload:** Administrative staff are inundated with repetitive student queries, diverting their attention from more critical tasks. 😫
*   **Student Delays:** Students frequently experience delays in obtaining basic information, leading to frustration and inefficiency. ⏳
*   **Lack of Real-time Support:** Limited accessibility and staff availability mean students often lack support during off-hours. ⏰

Our customers for this solution include:
*   **Students:** New, current, and international students seeking quick information. 🧑‍🎓
*   **Staff and Faculty:** Administrative staff and faculty members burdened by repetitive inquiries. 👨‍🏫
*   **Parents:** Parents of current or prospective students. 👨‍👩‍👧
*   **Visitors or Guests:** Individuals needing general university information. 🌍

## Existing Solutions & Their Shortcomings 🔍

Current methods for obtaining university information include:

*   Searching documents and answers on the university website. 📁
*   Asking the Office of the Registrar. 🏢
*   Asking Faculty Staff and Members from the Respective Office. 🧑‍💼

However, these solutions often lack:

*   **Efficiency and Speed:** They are time-consuming, lack personalization, and involve complex navigation. 🐌
*   **Human Error:** Overburdened staff can lead to inconsistent answers and increased workload. 📝
*   **Availability:** Information access is limited by staff working hours and search functionality limitations. 🚫

## Proposed Solution ✨

InfoNest is an intelligent, web-based chatbot that will:

*   **Understand Natural Language:** Interpret student queries in everyday language. 🗣️
*   **Provide Instant, Accurate Responses:** Retrieve and deliver precise answers from a predefined knowledge base. ✅
*   **Offer 24/7 Accessibility:** Be available around the clock via a user-friendly web interface. 🌙

This solution aims to save time for both students and staff, improve the student experience with fast and consistent support, and reduce the repetitive workload on university departments. 🌟

## Use Cases 💡

InfoNest supports several key use cases:

1.  **Log in or Register Account:** Users can securely access the chatbot by logging into an existing account or registering a new one. 🔐
2.  **Ask AU Information:** Users can inquire about any information related to the university ("AU") by chatting with the bot. 💬
3.  **Access Chat History:** Users can review past conversations on the left side of the web application, which also provides recommended prompts. 📜
4.  **Feedback** Users have options to provide feedback, and request help if needed. ⚙️

## Technical Stacks 🛠️

### Frontend
*   **Framework:** React.js ⚛️
*   **Styling:** CSS3 🎨

### Backend
*   **Framework:** Node.js + Express / Docker 🐍
*   **Communication:** Gemini API 🔗
*   **Authorization:** JSON WEB Token / Google OAuth 2.0 🔒

### NLP & Chatbot Engine
*   **NLP Platform:** Rasa NLU 🤖

### Database
*   **Storage:** MongoDB 🍃
*   **Data Structure:** Each entry contains: intent, question examples, answer, entities. 📚

### Deployment
*   **Frontend:** Render ☁️
*   **Backend:** Render 🌐
*   **Version Control:** GitHub (for source code and version control) 🐙

## System Architecture 🏗️

The InfoNest system is designed with a clear separation of concerns, ensuring scalability and maintainability. Here's how its core components interact:

1.  **Frontend (React, CSS3):** This is the user-facing web application built with React.js for dynamic interfaces and styled with CSS3 for a modern look. It handles user interactions, displays information, and sends user queries to the backend. 💻
2.  **Backend (Node.js, Express):** Developed using Node.js and the Express framework, the backend serves as the API layer. It receives requests from the frontend, manages user authentication, and orchestrates the communication with the NLP & Chatbot Engine. ⚙️
3.  **NLP & Chatbot Engine (Rasa):** This is the intelligence core of InfoNest. It utilizes Rasa for dialogue management and natural language understanding (e.g., tokenization, entity recognition). The backend sends user queries to this engine for processing. 🧠
4.  **Database (MongoDB):** MongoDB serves as the persistent storage for InfoNest. It stores the predefined knowledge base, including intents, example questions, answers, and entities. The NLP & Chatbot Engine interacts with the database to retrieve relevant information based on processed user queries. 🗃️

The general flow is as follows: A user interacts with the **Frontend**, which sends their query to the **Backend**. The Backend then forwards the query to the **NLP & Chatbot Engine** for interpretation. The engine consults the **Database** to find the most accurate answer and sends it back to the Backend, which then relays it to the Frontend for display to the user. ➡️

---
