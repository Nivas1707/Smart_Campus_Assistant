import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, RefreshCw, CheckCircle, XCircle, Folder, FileText, ChevronRight, Plus, Globe, BookOpen, Search } from 'lucide-react';

const QuizView = ({ setQuizActive }) => {
    const [library, setLibrary] = useState({ folders: [], rootDocuments: [] });
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [selectionMode, setSelectionMode] = useState(true); // true = selecting source, false = taking quiz
    const [exitSelection, setExitSelection] = useState(false); // For animation
    const [questionCount, setQuestionCount] = useState(5); // 5 or 10
    const [currentSource, setCurrentSource] = useState(null); // { id, type }

    // --- Suggested Data Sources State ---
    const [sourceMode, setSourceMode] = useState('personal'); // 'personal', 'external'

    // Unified External Source State
    const [externalTopic, setExternalTopic] = useState('');
    const [externalLoading, setExternalLoading] = useState(false);

    const handleExternalSearch = async (type) => {
        if (!externalTopic.trim()) {
            alert("Please enter a topic.");
            return;
        }

        if (type === 'WIKI') {
            setExternalLoading(true);
            try {
                // 1. Fetch Wiki Data
                const res = await axios.get(`/api/wiki?query=${encodeURIComponent(externalTopic)}`);
                const wikiResult = res.data;

                // 2. Start Quiz Generation with Wiki Content
                generateQuizWithOverride(wikiResult.url, 'Wikipedia', wikiResult.extract, wikiResult.title);

            } catch (err) {
                console.error("Wiki search failed", err);
                alert("No results found on Wikipedia.");
                setExternalLoading(false);
            }
        } else if (type === 'NCERT') {
            // NCERT Logic: Use Topic directly
            startQuizGeneration(externalTopic, 'NCERT', null, externalTopic);
        }
    };

    // Modified helper to support overrides
    const generateQuizWithOverride = (sourceId, sourceType, contentOverride, topicName) => {
        setCurrentSource({ id: sourceId, type: sourceType, content: contentOverride, topic: topicName });
        setLoading(true);
        setQuizData(null);
        setAnswers({});
        setShowResults(false);
        setActiveQuestion(0);
        setSelectionMode(false);
        setExitSelection(false);

        _generateQuizData(sourceId, sourceType, contentOverride, topicName);
    };

    // Refactored Generation Logic to support all modes
    const _generateQuizData = async (sourceId, sourceType, contentOverride = null, topicName = null) => {
        try {
            console.log("Requesting Quiz Generation:", { sourceId, sourceType, count: questionCount, topicName });

            const payload = {
                sourceId,
                sourceType,
                count: Number(questionCount),
                contentOverride,
                topicName
            };

            const response = await axios.post('/api/quiz', payload);

            const questions = response.data.questions.map(q => ({
                ...q,
                id: Math.random().toString(36).substr(2, 9)
            }));
            setQuizData(questions);
            if (setQuizActive) setQuizActive(true);
        } catch (error) {
            console.error('Error generating quiz:', error);
            setSelectionMode(true);
            const msg = error.response ? `Server Error: ${error.response.status} - ${error.response.data?.error || error.message}` : error.message;
            alert(`Failed to generate quiz.\nDetails: ${msg}`);
        } finally {
            setLoading(false);
            setExternalLoading(false);
        }
    };

    const startQuizGeneration = (sourceId, sourceType, contentOverride = null, topicName = null) => {
        setCurrentSource({ id: sourceId, type: sourceType, content: contentOverride, topic: topicName });
        setExitSelection(true);
        setTimeout(() => {
            // End selection mode and start loading
            setSelectionMode(false);
            setLoading(true);

            // RESET QUIZ STATE
            setShowResults(false);
            setActiveQuestion(0);
            setAnswers({});

            // If NCERT or Wiki, we might have passed contentOverride/topicName
            _generateQuizData(sourceId, sourceType, contentOverride, topicName);
        }, 800);
    };

    useEffect(() => {
        fetchLibrary();
        if (setQuizActive) setQuizActive(false); // Ensure dock is at bottom initially
    }, []);

    const fetchLibrary = async () => {
        try {
            const res = await axios.get('/api/library');
            setLibrary(res.data);
        } catch (err) {
            console.error("Failed to fetch library", err);
        }
    };

    const handleAnswer = (questionIndex, optionIndex) => {
        if (showResults) return;

        setAnswers(prev => ({
            ...prev,
            [questionIndex]: optionIndex
        }));

        if (questionIndex < (quizData?.length || 0) - 1) {
            setTimeout(() => setActiveQuestion(prev => prev + 1), 600);
        } else {
            // Auto finalize on last question
            setTimeout(() => {
                setShowResults(true);
            }, 600);
        }
    };

    const calculateScore = () => {
        if (!quizData) return 0;
        let score = 0;
        quizData.forEach((q, idx) => {
            // Check based on string Content matching since backend returns string answer
            if (q.options[answers[idx]] === q.correctAnswer) score++;
        });
        return score;
    };

    const returnToSelection = () => {
        setSelectionMode(true);
        setQuizData(null);
        setLoading(false);
        setExitSelection(false); // Reset animation state
        if (setQuizActive) setQuizActive(false); // Move dock back to bottom
    };

    const regenerateQuiz = () => {
        if (currentSource) {
            // Immediate reset and regenerate
            setLoading(true);
            setQuizData(null); // Force clear old data
            setShowResults(false);
            setAnswers({});
            setActiveQuestion(0);
            _generateQuizData(currentSource.id, currentSource.type, currentSource.content, currentSource.topic);
        }
    };

    // --- File Management Logic ---
    const [uploadingFolderId, setUploadingFolderId] = useState(null);
    const fileInputRef = React.useRef(null);
    const [expandedFolders, setExpandedFolders] = useState({});

    // Smart Drag-Drop Handler
    const handleSmartDrop = (e, targetFolderId = null) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.classList.remove('bg-white/5');
        e.currentTarget.classList.remove('bg-holo-cyan/10');

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (targetFolderId) {
            // Drop into specific folder
            handleFileChange({ target: { files }, folderIdOverride: targetFolderId });
        } else {
            // Drop into Root
            if (files.length === 1) {
                // Just 1 file -> Root
                handleFileChange({ target: { files } });
            } else {
                // Multiple files -> Create Folder
                const folderName = prompt("Multiple files detected. Enter name for new folder:", "New Bundle");
                if (folderName) {
                    // We need a special flow: Create Folder first, then upload
                    createFolderAndUpload(folderName, files);
                }
            }
        }
    };

    const createFolderAndUpload = async (folderName, files) => {
        try {
            // 1. Create Folder
            const folderRes = await axios.post('/api/folders', { name: folderName });
            const newFolderId = folderRes.data._id;

            // 2. Upload Files to it
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            formData.append('folderId', newFolderId);

            const upRes = await axios.post('/api/upload', formData);
            if (upRes.data.error) alert(upRes.data.error);

            // Check for duplicates
            if (upRes.data.skippedFiles && upRes.data.skippedFiles.length > 0) {
                alert(`Duplicate Warning:\n\nThe following files were skipped:\n- ${upRes.data.skippedFiles.join('\n- ')}`);
            }

            // Await fetch so library state updates BEFORE we toggle
            await fetchLibrary();
            openFolder(newFolderId);
        } catch (err) {
            console.error("Smart upload failed:", err);
            const msg = err.response ? `Server Error: ${err.response.status} - ${err.response.data?.error || err.message}` : err.message;
            alert(`Failed to create folder bundle.\nDetails: ${msg}`);
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        const targetId = e.folderIdOverride !== undefined ? e.folderIdOverride : uploadingFolderId;
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (targetId) formData.append('folderId', targetId);

        try {
            const res = await axios.post('/api/upload', formData);
            if (res.data.error) alert(res.data.error);

            // Check for duplicates
            if (res.data.skippedFiles && res.data.skippedFiles.length > 0) {
                alert(`Duplicate Warning:\n\nThe following files were skipped:\n- ${res.data.skippedFiles.join('\n- ')}`);
            }

            await fetchLibrary(); // Await here too for safety
            // Open folder if applicable
            if (targetId && !expandedFolders[targetId]) openFolder(targetId);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed");
        } finally {
            setUploadingFolderId(null);
            if (e.target && e.target.value) e.target.value = '';
        }
    };

    const handleRenameFolder = async (e, folder) => {
        e.stopPropagation();
        const newName = prompt("Enter new folder name:", folder.name);
        if (newName && newName !== folder.name) {
            try {
                await axios.put(`/api/folders/${folder._id}`, { name: newName });
                fetchLibrary();
            } catch (err) {
                console.error("Rename failed:", err);
            }
        }
    };

    const handleDelete = async (e, type, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this item?')) return;
        try {
            const endpoint = type === 'folder' ? `/api/folders/${id}` : `/api/documents/${id}`;
            await axios.delete(endpoint);
            fetchLibrary();
            if (currentSource?.id === id) setCurrentSource(null);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleFolderUploadTrigger = (e, folderId) => {
        e.stopPropagation();
        setUploadingFolderId(folderId);
        setTimeout(() => { if (fileInputRef.current) fileInputRef.current.click(); }, 50);
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const openFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    };

    // --- End File Management Logic ---

    // Root "Add File" Trigger
    const handleAddFileRoot = () => {
        setUploadingFolderId(null);
        setTimeout(() => { if (fileInputRef.current) fileInputRef.current.click(); }, 50);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />

            {selectionMode ? (
                <div className="w-full max-w-5xl flex flex-col items-center z-10">
                    <div className={`mb-4 text-center transition-all duration-800 pt-8 ${exitSelection ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
                        <h2 className="text-4xl font-tech text-white mb-2">DATA SOURCES</h2>
                        <p className="font-code text-holo-cyan text-sm tracking-[0.3em] uppercase mb-6">
                            SELECT KNOWLEDGE BASE
                        </p>

                        {/* Top Config Row: Count + Mode Selector */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
                            {/* Question Count */}
                            <div className="inline-flex items-center bg-black/40 backdrop-blur border border-white/10 rounded-full p-1 relative">
                                <div className={`absolute top-1 bottom-1 w-[50%] bg-holo-cyan/20 rounded-full transition-all duration-300 ${questionCount === 5 ? 'left-1' : 'left-[calc(50%-4px)] translate-x-[calc(0%+4px)]'}`} />
                                <button onClick={() => setQuestionCount(5)} className={`px-4 py-1.5 rounded-full text-xs font-code transition-all z-10 relative ${questionCount === 5 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>5 Qs</button>
                                <button onClick={() => setQuestionCount(10)} className={`px-4 py-1.5 rounded-full text-xs font-code transition-all z-10 relative ${questionCount === 10 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>10 Qs</button>
                            </div>

                            {/* Mode Selector Removed - Only Personal Mode Exists Now */}
                            {/* 
                            <div className="inline-flex items-center bg-black/40 backdrop-blur border border-white/10 rounded-full p-1 border-holo-violet/30">
                                <button
                                    onClick={() => setSourceMode('personal')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-code transition-all ${sourceMode === 'personal' ? 'bg-holo-violet/20 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Folder size={14} /> My Files
                                </button>
                            </div> 
                            */}
                        </div>
                    </div>

                    {/* CONTENT AREA BASED ON MODE */}
                    <div className="w-full flex-1 min-h-0 mb-8 overflow-hidden relative">

                        {/* PERSONAL FILES MODE */}
                        {sourceMode === 'personal' && (
                            <div className="w-full h-full grid grid-cols-2 gap-8 animate-fade-in">
                                {/* Folders Column */}
                                <div
                                    className={`bg-black/20 border border-white/10 rounded-2xl p-6 overflow-y-auto holo-panel custom-scrollbar ${exitSelection ? 'slide-out-left' : 'slide-in-left'}`}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/5'); }}
                                    onDragLeave={(e) => { e.currentTarget.classList.remove('bg-white/5'); }}
                                    onDrop={(e) => handleSmartDrop(e, null)}
                                >
                                    <h3 className="text-holo-cyan font-tech text-xl mb-4 flex items-center gap-2">
                                        <Folder size={20} /> FOLDER BATCHES
                                    </h3>
                                    <div className="space-y-3">
                                        {library.folders.map(folder => (
                                            <div key={folder._id} className="space-y-1">
                                                <div
                                                    onClick={() => startQuizGeneration(folder._id, 'Folder')}
                                                    className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-holo-cyan/10 hover:border-holo-cyan cursor-pointer transition-all flex items-center justify-between group"
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#00f3ff'; }}
                                                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                                    onDrop={(e) => handleSmartDrop(e, folder._id)}
                                                >
                                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                                        <div onClick={(e) => { e.stopPropagation(); toggleFolder(folder._id); }}>
                                                            {expandedFolders[folder._id] ? <ChevronRight size={16} className="text-holo-ice rotate-90 transition-transform" /> : <ChevronRight size={16} className="text-holo-ice transition-transform" />}
                                                        </div>
                                                        <Folder className="text-holo-ice group-hover:text-holo-cyan shrink-0" size={20} />
                                                        <div className="min-w-0">
                                                            <p className="font-code text-sm text-white truncate">{folder.name}</p>
                                                            <p className="text-[10px] text-white/40">{folder.documents.length} Files</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={(e) => handleFolderUploadTrigger(e, folder._id)} className="p-1.5 hover:text-green-400 text-holo-ice/50" title="Add File"><Plus size={14} /></button>
                                                        <button onClick={(e) => handleRenameFolder(e, folder)} className="p-1.5 hover:text-white text-holo-ice/50"><FileText size={14} /></button>
                                                        <button onClick={(e) => handleDelete(e, 'folder', folder._id)} className="p-1.5 hover:text-red-400 text-holo-ice/50"><XCircle size={14} /></button>
                                                    </div>
                                                </div>
                                                {/* Expanded Folder Content */}
                                                {expandedFolders[folder._id] && (
                                                    <div className="pl-6 space-y-1 animate-fade-in-down border-l border-white/5 ml-4">
                                                        {folder.documents.map(doc => (
                                                            <div
                                                                key={doc._id}
                                                                onClick={() => startQuizGeneration(doc._id, 'Document')}
                                                                className="p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-holo-cyan/5 hover:border-holo-cyan/30 cursor-pointer transition-all flex items-center justify-between group/file"
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <FileText className="text-holo-ice/70 group-hover/file:text-holo-cyan shrink-0" size={16} />
                                                                    <p className="font-code text-xs text-white/80 truncate">{doc.originalName}</p>
                                                                </div>
                                                                <button onClick={(e) => handleDelete(e, 'doc', doc._id)} className="p-1 hover:text-red-400 text-holo-ice/30 opacity-0 group-hover/file:opacity-100 transition-opacity" title="Delete File"><XCircle size={12} /></button>
                                                            </div>
                                                        ))}
                                                        {folder.documents.length === 0 && (
                                                            <p className="text-[10px] text-white/30 italic pl-2">Empty folder</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {library.folders.length === 0 && <p className="text-white/30 text-sm italic">No folders available. Drag files here to create one.</p>}
                                    </div>
                                </div>

                                {/* Files Column */}
                                <div
                                    className={`bg-black/20 border border-white/10 rounded-2xl p-6 overflow-y-auto holo-panel custom-scrollbar ${exitSelection ? 'slide-out-right' : 'slide-in-right'}`}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/5'); }}
                                    onDragLeave={(e) => { e.currentTarget.classList.remove('bg-white/5'); }}
                                    onDrop={(e) => handleSmartDrop(e, null)}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-holo-violet font-tech text-xl flex items-center gap-2">
                                            <FileText size={20} /> INDIVIDUAL FILES
                                        </h3>
                                        <button onClick={handleAddFileRoot} className="text-xs font-code text-holo-violet hover:text-white border border-holo-violet/30 px-2 py-1 rounded hover:bg-holo-violet/20">+ ADD FILE</button>
                                    </div>

                                    <div className="space-y-3">
                                        {library.rootDocuments.map(doc => (
                                            <div
                                                key={doc._id}
                                                onClick={() => startQuizGeneration(doc._id, 'Document')}
                                                className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-holo-violet/10 hover:border-holo-violet cursor-pointer transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText className="text-holo-ice group-hover:text-holo-violet shrink-0" size={20} />
                                                    <p className="font-code text-sm text-white truncate">{doc.originalName}</p>
                                                </div>
                                                <button onClick={(e) => handleDelete(e, 'doc', doc._id)} className="p-1 hover:text-red-400 text-holo-ice/50 opacity-0 group-hover:opacity-100" title="Delete"><XCircle size={14} /></button>
                                            </div>
                                        ))}
                                        {library.rootDocuments.length === 0 && <p className="text-white/30 text-sm italic">No files available. Drag files here to upload.</p>}
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            ) : loading ? (
                <div className="text-center perspective-1000 animate-fade-in">
                    <div className="w-64 h-64 bg-holo-cyan/10 backdrop-blur-xl border border-holo-cyan/30 rounded-full flex items-center justify-center relative animate-prism-spin transform-style-3d">
                        <div className="absolute inset-0 rounded-full border border-dashed border-holo-cyan/50 animate-spin-slow"></div>
                        <RefreshCw size={64} className="text-holo-cyan animate-spin" />
                    </div>
                    <div className="mt-12">
                        <h2 className="text-2xl font-tech text-white mb-2">SYNTHESIZING MATRIX</h2>
                        <p className="font-code text-holo-cyan text-sm tracking-[0.3em] uppercase animate-pulse">
                            Extracting Knowledge Patterns...
                        </p>
                    </div>
                </div>
            ) : quizData ? (
                <div className="w-full max-w-5xl h-full flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4 animate-fade-in">
                        <div>
                            <button onClick={returnToSelection} className="text-xs text-holo-ice/50 hover:text-white mb-2 underline">← Return to Source Selection</button>
                            <h2 className="text-2xl font-tech text-white">Question Matrix</h2>
                            <p className="text-xs font-code text-holo-ice/50">
                                QUESTION {activeQuestion + 1} / {quizData.length}
                            </p>
                        </div>
                        {showResults && (
                            <div className="text-right flex flex-col items-end">
                                <span className="text-3xl font-bold text-holo-cyan">{calculateScore()} / {quizData.length}</span>
                                <p className="text-xs font-code text-holo-ice/50 mb-2">ACCURACY RATING</p>
                                <button
                                    onClick={regenerateQuiz}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-holo-cyan/10 hover:bg-holo-cyan/20 border border-holo-cyan/30 rounded-lg text-xs font-code text-holo-cyan transition-all"
                                >
                                    <RefreshCw size={12} /> REGENERATE SYSTEM
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area - Conditional Layout for Scroll vs Centering */}
                    <div className={`flex-1 flex relative perspective-1000 ${showResults ? 'items-start justify-start overflow-hidden' : 'items-center justify-center'}`}>
                        {quizData.map((q, qIndex) => {
                            if (qIndex !== activeQuestion && !showResults) return null; // Only show active in quiz mode
                            if (showResults) return null; // We handle results differently below

                            return (
                                <div
                                    key={q.id}
                                    className="w-full max-w-3xl max-h-[70vh] overflow-y-auto holo-panel rounded-2xl p-8 transition-all duration-500 question-enter shadow-holo-lg ring-1 ring-holo-cyan/50 custom-scrollbar"
                                >
                                    <h3 className="text-xl md:text-2xl font-tech text-holo-ice mb-8 leading-relaxed flex items-start gap-4 sticky top-0 bg-glass-surface backdrop-blur-md p-2 -mx-2 -mt-2 rounded-t-xl z-20">
                                        <span className="text-holo-cyan font-code text-sm mt-1.5 px-2 py-1 bg-holo-cyan/10 rounded">0{qIndex + 1}</span>
                                        {q.question}
                                    </h3>

                                    <div className="space-y-4">
                                        {q.options.map((option, optIndex) => {
                                            const isSelected = answers[qIndex] === optIndex;
                                            return (
                                                <button
                                                    key={optIndex}
                                                    onClick={(e) => { e.stopPropagation(); handleAnswer(qIndex, optIndex); }}
                                                    className={`
                                                        w-full text-left p-5 rounded-xl border transition-all duration-300 flex items-center justify-between group
                                                        ${isSelected
                                                            ? "bg-holo-cyan/10 text-white neon-glow-blue" // New Active Style
                                                            : "border-white/10 hover:bg-white/5 text-white/70 hover:border-holo-cyan/50"}
                                                    `}
                                                >
                                                    <span className="text-base md:text-lg">{option}</span>
                                                    <div className={`w-4 h-4 rounded-full border border-white/30 ${isSelected ? 'bg-holo-cyan border-holo-cyan box-shadow-glow' : ''}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Results View - Vertical Scrollable List */}
                        {showResults && (
                            <div className="w-full h-full overflow-y-auto px-4 flex flex-col space-y-6 pb-20 animate-fade-in custom-scrollbar">
                                {quizData.map((q, qIndex) => (
                                    <div key={q.id} className="relative holo-panel rounded-2xl p-6 transition-all border border-white/5 shadow-md">
                                        <h3 className="text-lg font-tech text-white mb-4 flex gap-3">
                                            <span className="text-holo-cyan font-code mt-1">0{qIndex + 1}</span>
                                            <span className="leading-relaxed">{q.question}</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {q.options.map((option, optIndex) => {
                                                // Compare string content since backend returns string
                                                const isCorrect = option === q.correctAnswer;
                                                const isSelected = answers[qIndex] === optIndex;

                                                // Default style
                                                let style = "text-sm p-4 rounded-xl border border-white/10 bg-black/20 text-white/60";

                                                // Correct Answer: Strong Green Glow
                                                if (isCorrect) {
                                                    style = "text-sm p-4 rounded-xl bg-green-950/40 border-green-500/50 neon-glow-green font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                                                }
                                                // Wrong Selection: Red Glow
                                                else if (isSelected && !isCorrect) {
                                                    style = "text-sm p-4 rounded-xl bg-red-950/40 border-red-500/50 text-white neon-glow-red font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                                                }

                                                return (
                                                    <div key={optIndex} className={`flex items-center justify-between transition-all ${style}`}>
                                                        <span>{option}</span>
                                                        {isCorrect && <CheckCircle className="text-green-400" size={18} />}
                                                        {isSelected && !isCorrect && <XCircle className="text-red-400" size={18} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Fallback
                <div className="flex flex-col items-center justify-center opacity-50">
                    <p>Load error</p>
                </div>
            )
            }
        </div >
    );
};

export default QuizView;
