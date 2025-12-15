# Smart Campus Assistant

Smart Campus Assistant is a comprehensive, AI-powered web application designed to help students study more efficiently. Built with the **MERN Stack** (MongoDB, Express, React, Node.js), it acts as a personalized study companion that allows users to upload course materials, generate summaries, take quizzes, and ask questions to an AI tutor grounded in their own content.

![image alt](https://github.com/Nivas1707/Smart_Campus_Assistant/blob/fd341e3e2c49e21cb0ca6c33a9e244ea23dc43f8/Landing%20Page.png)

## 🚀 Features

*   **Knowledge Observatory (Library)**:
    *   **PDF Upload**: Upload single or multiple course documents (PDFs) effortlessly.
    *   **Smart Organization**: Group documents into folders for better subject management.
    *   **Automatic Summarization**: Detailed AI-generated summaries are automatically created for every uploaded document.
    *   **Vector Search**: All uploads are indexed for fast, context-aware retrieval.

*   **AI Study Tools**:
    *   **Folder Summaries**: Generate comprehensive "Topic Summaries" that synthesize information from all documents within a folder.
    *   **Quiz Generator**: Instantly create multiple-choice quizzes from any document or entire folder to test your knowledge.
    *   **Interactive Chat**: Ask questions about your study materials. The AI uses **RAG (Retrieval Augmented Generation)** to provide accurate answers based *specifically* on your uploaded notes, with a general knowledge fallback.

*   **Modern UI/UX**:
    *   **Responsive Design**: Built with React and Tailwind CSS for a seamless experience on any device.
    *   **Interactive Elements**: Smooth animations and a "Maze/Orbit" thematic design.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Lucide React, Axios.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (with Mongoose).
*   **AI Services**:
    *   **Hugging Face Inference API** (Llama 3 / Mistral) for Chat, Summarization, and Quizzes.
    *   **Groq API** (Llama 3.3) for high-speed Topic Summaries.
    *   **Google Gemini** (Optional/Fallback).
*   **RAG Pipeline**: LangChain, HuggingFace Embeddings, Recursive Text Splitters.

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

*   **Node.js** (v16 or higher)
*   **MongoDB** (Local instance or Atlas URI)

## 🔧 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd SmartCampusAssistant
    ```

2.  **Install Dependencies:**
    You can install dependencies for both the server and client using the helper script:
    ```bash
    npm run install-all
    ```
    *Or manually:*
    ```bash
    # Root (Concurrent helper)
    npm install
    
    # Server
    cd server
    npm install
    
    # Client
    cd ../client
    npm install
    ```

## ⚙️ Configuration

Create a `.env` file in the `server` directory (`server/.env`) with the following environment variables:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-campus

# AI Service Keys (Get these from their respective providers)
# Required for RAG Embeddings & Chat
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_CHAT_KEY=hf_...

# Required for Document Summarization
HUGGINGFACE_SUMMARY_KEY=hf_...

# Required for Quiz Generation
HUGGINGFACE_QUIZ_KEY=hf_...

# Required for Topic Summaries (High Performance)
GROQ_API_KEY=gsk_...

# Optional / Fallback
GEMINI_API_KEY=...
```

> **Note**: You can use the same Hugging Face token for all `HUGGINGFACE_*` keys if the token has sufficient permissions.

## ▶️ Usage

To run the application (both frontend and backend concurrently):

```bash
npm start
```

*   **Frontend**: http://localhost:5173
*   **Backend**: http://localhost:5000

## 📂 Project Structure

```
SmartCampusAssistant/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI Components (Chat, Quiz, Upload, etc.)
│   │   └── ...
├── server/                 # Express Backend
│   ├── models/             # Mongoose Schemas (Document, Folder, Quiz)
│   ├── routes/             # API Routes
│   ├── utils/              # AI Services & RAG Logic
│   └── ...
├── package.json            # Root scripts
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.


