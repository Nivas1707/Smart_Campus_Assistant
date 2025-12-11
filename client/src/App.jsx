import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import DockLayout from './components/DockLayout';

function App() {
    const [activeModule, setActiveModule] = useState('upload');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quizActive, setQuizActive] = useState(false); // New state to track if quiz is actually running

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('/api/documents');
            setDocuments(response.data);
            if (response.data.length > 0 && activeModule === 'upload') {
                // Optional: Auto-switch if docs exist, or stay on upload
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = (response) => {
        // response contains { documents: [], folderId }
        // We add new docs to the state
        if (response.documents && Array.isArray(response.documents)) {
            setDocuments(prev => [...response.documents, ...prev]);
        }
        setActiveModule('summary'); // Switch to summary after upload
    };

    const renderModule = () => {
        switch (activeModule) {
            case 'upload':
                return <FileUpload onUploadSuccess={handleUploadSuccess} />;
            case 'chat':
                return <ChatInterface documentId={documents.length > 0 ? documents[0]._id : null} />;
            case 'summary':
                return <SummaryView documents={documents} setDocuments={setDocuments} />;
            case 'quiz':
                return <QuizView documents={documents} setQuizActive={setQuizActive} />;
            default:
                return <FileUpload onUploadSuccess={handleUploadSuccess} />;
        }
    };

    return (
        <DockLayout activeModule={activeModule} setActiveModule={setActiveModule} quizActive={quizActive}>
            {/* 3D Transition Wrapper */}
            <div key={activeModule} className="w-full h-full flex items-center justify-center animate-dock-slide">
                {renderModule()}
            </div>
        </DockLayout>
    );
}

export default App;
