import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Layers, FileText, ChevronRight, Hash, RotateCw, Folder, Trash2, Edit2, Plus, ChevronDown, Globe, BookOpen, Search, ArrowLeft } from 'lucide-react';

const SummaryView = ({ documents, setDocuments }) => {
    // Note: documents prop is now used as a fallback or for root docs if not using library
    // But we should fetch library state here.
    const [library, setLibrary] = useState({ folders: [], rootDocuments: [] });
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'doc' | 'folder', data: ... }
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({});

    // Selection Mode State (For Personal Files)
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState({ folders: [], documents: [] });

    // --- Suggest Data Sources State ---
    const [sourceMode, setSourceMode] = useState('personal'); // 'personal', 'external'
    const [externalTopic, setExternalTopic] = useState('');
    const [externalLoading, setExternalLoading] = useState(false);

    const fetchLibrary = async () => {
        try {
            const res = await axios.get('/api/library');
            setLibrary(res.data);
            // Sync up with parent's documents prop if needed, or just rely on local state
            // For now, let's keep local state as the source of truth for Insight Core
            // and maybe notifying parent if needed.
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    // Polling for summary updates on the selected doc
    useEffect(() => {
        let interval;
        if (selectedItem?.type === 'doc' && selectedItem.data.summary && selectedItem.data.summary.startsWith("Generating summary") && !selectedItem.data.isTransient) {
            interval = setInterval(async () => {
                try {
                    const response = await axios.get(`/api/documents/${selectedItem.data._id}`);
                    const updatedDoc = response.data;
                    if (!updatedDoc.summary.startsWith("Generating summary")) {
                        // refreshing library to update list
                        fetchLibrary();
                        setSelectedItem({ type: 'doc', data: updatedDoc });
                    }
                } catch (error) {
                    console.error("Error polling:", error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedItem]);

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleDelete = async (e, type, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this item?')) return;
        try {
            const endpoint = type === 'folder' ? `/api/folders/${id}` : `/api/documents/${id}`;
            await axios.delete(endpoint);
            fetchLibrary();
            if (selectedItem?.data._id === id) setSelectedItem(null);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleSelectToggle = (e, type, id) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const list = prev[type === 'folder' ? 'folders' : 'documents'];
            if (list.includes(id)) {
                return { ...prev, [type === 'folder' ? 'folders' : 'documents']: list.filter(item => item !== id) };
            } else {
                return { ...prev, [type === 'folder' ? 'folders' : 'documents']: [...list, id] };
            }
        });
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.folders.length} folders and ${selectedIds.documents.length} files?`)) return;
        try {
            await axios.post('/api/bulk-delete', {
                folderIds: selectedIds.folders,
                documentIds: selectedIds.documents
            });
            fetchLibrary();
            setSelectedIds({ folders: [], documents: [] });
            setIsSelectionMode(false);
            setSelectedItem(null);
        } catch (err) {
            console.error("Bulk delete failed:", err);
            alert("Bulk delete failed");
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

    const activeContent = selectedItem?.type === 'doc' ? selectedItem.data : null;


    const [uploadingFolderId, setUploadingFolderId] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFolderUploadTrigger = (e, folderId) => {
        e.stopPropagation();
        setUploadingFolderId(folderId);
        // Small timeout to allow state to update before file dialog (though usually fine)
        setTimeout(() => {
            if (fileInputRef.current) fileInputRef.current.click();
        }, 50);
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        // Use override validation if present (from drop), else state
        // If e.folderIdOverride is null/undefined, checks uploadingFolderId
        const targetId = e.folderIdOverride !== undefined ? e.folderIdOverride : uploadingFolderId;

        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (targetId) formData.append('folderId', targetId);

        try {
            const res = await axios.post('/api/upload', formData);

            if (res.data.error) {
                alert(res.data.error);
            }

            // Check for duplicates
            if (res.data.skippedFiles && res.data.skippedFiles.length > 0) {
                alert(`Upload Warning:\n\nThe following files were skipped because they already exist in this folder:\n- ${res.data.skippedFiles.join('\n- ')}`);
            } else if (!res.data.error) {
                // Only show success if no skips (clean upload) or maybe small toast?
                // For now silent is fine, or simple log.
                console.log("Upload success");
            }

            fetchLibrary();
            // Open the folder if not open
            if (!expandedFolders[targetId]) {
                toggleFolder(targetId);
            }
        } catch (err) {
            console.error("Folder upload failed:", err);
            alert("Failed to upload files to folder.");
        } finally {
            setUploadingFolderId(null);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    // --- External Source Handler ---
    const handleExternalSummary = async (type) => {
        if (!externalTopic.trim()) {
            alert("Please enter a topic.");
            return;
        }

        setExternalLoading(true);
        // Create a temporary loading doc
        setSelectedItem({
            type: 'doc',
            data: {
                _id: 'temp_loading',
                originalName: `Generating ${type} Summary...`,
                summary: "Generating summary...",
                isTransient: true
            }
        });

        try {
            // Use our new backend endpoint
            const res = await axios.post('/api/summary/external', {
                topic: externalTopic,
                type: type
            });

            setSelectedItem({ type: 'doc', data: res.data });

        } catch (err) {
            console.error("External Summary Failed", err);
            alert("Failed to fetch external summary.");
            setSelectedItem(null);
        } finally {
            setExternalLoading(false);
        }
    };


    return (
        <div className="w-full h-full flex items-center justify-center p-8 relative">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Main Holographic Container */}
            <div className="w-full max-w-7xl h-[85vh] flex gap-8">

                {/* Sidebar: Folders & Files OR External Sources */}
                <div className="w-1/4 h-full bg-black/20 backpack-blur-lg border border-white/10 rounded-2xl flex flex-col overflow-hidden">

                    {/* Header / Mode Switcher */}
                    <div className="p-4 border-b border-white/10 bg-holo-cyan/5 space-y-3">
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setSourceMode('personal')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-code transition-all ${sourceMode === 'personal' ? 'bg-holo-cyan/20 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                            >
                                <Folder size={12} /> DRIVE
                            </button>
                            <button
                                onClick={() => setSourceMode('external')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-code transition-all ${sourceMode === 'external' ? 'bg-orange-500/20 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                            >
                                <Globe size={12} /> EXTERNAL
                            </button>
                        </div>
                    </div>

                    {/* SIDEBAR CONTENT AREA */}
                    {sourceMode === 'personal' ? (
                        <>
                            {/* Toolbar (Only for Personal) */}
                            <div className="px-4 py-2 flex justify-between items-center">
                                <span className="font-tech text-holo-cyan text-xs">VIRTUAL DRIVE</span>
                                <div className="flex items-center gap-2">
                                    {isSelectionMode && (selectedIds.folders.length > 0 || selectedIds.documents.length > 0) && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="text-xs text-red-400 hover:text-red-300 font-code mr-2 animate-pulse"
                                        >
                                            DELETE ({selectedIds.folders.length + selectedIds.documents.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setIsSelectionMode(!isSelectionMode);
                                            setSelectedIds({ folders: [], documents: [] });
                                        }}
                                        className={`text-[10px] font-code px-2 py-1 rounded transition-colors ${isSelectionMode ? 'bg-holo-cyan/20 text-holo-cyan' : 'text-holo-ice/50 hover:text-holo-ice'}`}
                                    >
                                        {isSelectionMode ? 'CANCEL' : 'SELECT'}
                                    </button>
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar transition-colors"
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/5'); }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-white/5'); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('bg-white/5');
                                    const files = Array.from(e.dataTransfer.files);
                                    if (files.length > 0) {
                                        // Root upload (folderIdOverride: undefined/null)
                                        handleFileChange({ target: { files } });
                                    }
                                }}
                            >
                                {/* Folders */}
                                {library.folders.map(folder => (
                                    <div key={folder._id} className="space-y-1">
                                        <div
                                            className={`
                                                flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
                                                ${selectedItem?.data._id === folder._id && selectedItem?.type === 'folder' ? 'bg-holo-cyan/20 border border-holo-cyan/30' : 'hover:bg-white/5 border border-transparent'}
                                            `}
                                            onClick={() => {
                                                if (isSelectionMode) {
                                                    handleSelectToggle(null, 'folder', folder._id); // Passing null event since we handle stopPropagation inside
                                                } else {
                                                    // Auto-generate summary on click
                                                    const folderData = folder;
                                                    setSelectedItem({ type: 'folder', data: folderData });
                                                    toggleFolder(folder._id);

                                                    // Trigger generation if not empty
                                                    if (folderData.documents.length > 0) {
                                                        setLoading(true);
                                                        axios.post('/api/summary/folder', { folderId: folder._id })
                                                            .then(res => {
                                                                setSelectedItem({ type: 'doc', data: res.data });
                                                            })
                                                            .catch(err => console.error("Auto-summary failed", err))
                                                            .finally(() => setLoading(false));
                                                    }
                                                }
                                            }}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#00f3ff'; }}
                                            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation(); // Prevent parent sidebar drop
                                                e.currentTarget.style.borderColor = 'transparent';
                                                // Reuse upload logic with dropped files
                                                const files = Array.from(e.dataTransfer.files);
                                                if (files.length > 0) {
                                                    // Mock event structure for reuse
                                                    handleFileChange({ target: { files }, folderIdOverride: folder._id });
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                                {isSelectionMode ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.folders.includes(folder._id)}
                                                        onChange={(e) => handleSelectToggle(e, 'folder', folder._id)}
                                                        className="mr-2 accent-holo-cyan"
                                                    />
                                                ) : (
                                                    <div onClick={(e) => { e.stopPropagation(); toggleFolder(folder._id); }} className="cursor-pointer">
                                                        {expandedFolders[folder._id] ? <ChevronDown size={14} className="text-holo-ice" /> : <ChevronRight size={14} className="text-holo-ice" />}
                                                    </div>
                                                )}
                                                <Folder size={16} className="text-holo-cyan shrink-0" />
                                                <span className="font-code text-sm truncate text-holo-ice select-none">{folder.name}</span>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleFolderUploadTrigger(e, folder._id)}
                                                        className="p-1 hover:text-green-400 text-holo-ice/50"
                                                        title="Add files to folder"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                    <button onClick={(e) => handleRenameFolder(e, folder)} className="p-1 hover:text-white text-holo-ice/50"><Edit2 size={12} /></button>
                                                    <button onClick={(e) => handleDelete(e, 'folder', folder._id)} className="p-1 hover:text-red-400 text-holo-ice/50"><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Files in Folder */}
                                        {
                                            expandedFolders[folder._id] && (
                                                <div
                                                    className="pl-6 space-y-1 border-l border-white/5 ml-2 transition-colors"
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-holo-cyan/10'); }}
                                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-holo-cyan/10'); }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        e.currentTarget.classList.remove('bg-holo-cyan/10');
                                                        const files = Array.from(e.dataTransfer.files);
                                                        if (files.length > 0) {
                                                            handleFileChange({ target: { files }, folderIdOverride: folder._id });
                                                        }
                                                    }}
                                                >
                                                    {folder.documents.length === 0 && <div className="text-[10px] text-white/30 italic pl-2">Empty Folder</div>}
                                                    {folder.documents.map(doc => (
                                                        <div
                                                            key={doc._id}
                                                            className={`
                                                            flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
                                                            ${selectedItem?.data._id === doc._id && selectedItem?.type === 'doc' ? 'bg-holo-violet/20 border border-holo-violet/30' : 'hover:bg-white/5 border border-transparent'}
                                                        `}
                                                            onClick={async (e) => {
                                                                if (isSelectionMode) {
                                                                    handleSelectToggle(e, 'doc', doc._id);
                                                                } else {
                                                                    e.stopPropagation();
                                                                    // Optimistic UI update first
                                                                    setSelectedItem({ type: 'doc', data: doc });
                                                                    try {
                                                                        // Fetch fresh data with cache buster
                                                                        const res = await axios.get(`/api/documents/${doc._id}?t=${Date.now()}`);
                                                                        const freshDoc = res.data;

                                                                        const isFailed = !freshDoc.summary ||
                                                                            freshDoc.summary === "Failed to generate summary." ||
                                                                            freshDoc.summary.startsWith("Summary Failed:") ||
                                                                            freshDoc.summary.includes("Simulation:");

                                                                        if (isFailed) {
                                                                            setSelectedItem(prev => ({
                                                                                type: 'doc',
                                                                                data: { ...freshDoc, summary: "Generating summary... (Forced)" }
                                                                            }));

                                                                            axios.post('/api/summary/regenerate', {
                                                                                documentId: freshDoc._id,
                                                                                previousSummary: "Failed"
                                                                            }).catch(e => console.error("Force regen failed", e));
                                                                        } else {
                                                                            setSelectedItem({ type: 'doc', data: freshDoc });
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Fetch failed", err);
                                                                    }
                                                                }
                                                            }
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                                                {isSelectionMode && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIds.documents.includes(doc._id)}
                                                                        onChange={(e) => handleSelectToggle(e, 'doc', doc._id)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="mr-2 accent-holo-cyan"
                                                                    />
                                                                )}
                                                                <FileText size={14} className="text-holo-violet shrink-0" />
                                                                <span className="font-code text-xs truncate text-holo-ice/80 select-none">{doc.originalName}</span>
                                                            </div>
                                                            {!isSelectionMode && (
                                                                <button onClick={(e) => handleDelete(e, 'doc', doc._id)} className="p-1 hover:text-red-400 text-holo-ice/50 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        }
                                    </div>
                                ))}

                                {/* Root Files */}
                                {library.rootDocuments.length > 0 && <div className="h-px bg-white/10 my-2" />}
                                {library.rootDocuments.map(doc => (
                                    <div
                                        key={doc._id}
                                        className={`
                                            flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
                                            ${selectedItem?.data._id === doc._id && selectedItem?.type === 'doc' ? 'bg-holo-violet/20 border border-holo-violet/30' : 'hover:bg-white/5 border border-transparent'}
                                        `}
                                        onClick={async (e) => {
                                            if (isSelectionMode) {
                                                handleSelectToggle(e, 'doc', doc._id);
                                            } else {
                                                // Auto-generate summary on click
                                                // Explicitly fetching with timestamp to bust potential cache
                                                setSelectedItem({ type: 'doc', data: doc });
                                                try {
                                                    const res = await axios.get(`/api/documents/${doc._id}?t=${Date.now()}`);
                                                    const freshDoc = res.data;

                                                    // Check if failed and force regen
                                                    const isFailed = !freshDoc.summary ||
                                                        freshDoc.summary === "Failed to generate summary." ||
                                                        freshDoc.summary.startsWith("Summary Failed:") ||
                                                        freshDoc.summary.includes("Simulation:");

                                                    if (isFailed) {
                                                        setSelectedItem(prev => ({
                                                            type: 'doc',
                                                            data: { ...freshDoc, summary: "Generating summary... (Forced)" }
                                                        }));

                                                        // Force trigger
                                                        axios.post('/api/summary/regenerate', {
                                                            documentId: freshDoc._id,
                                                            previousSummary: "Failed"
                                                        }).catch(e => console.error("Force regen failed", e));
                                                    } else {
                                                        setSelectedItem({ type: 'doc', data: freshDoc });
                                                    }

                                                } catch (err) {
                                                    console.error("Fetch failed", err);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden w-full">
                                            {isSelectionMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.documents.includes(doc._id)}
                                                    onChange={(e) => handleSelectToggle(e, 'doc', doc._id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mr-2 accent-holo-cyan"
                                                />
                                            )}
                                            <FileText size={16} className="text-holo-violet shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-code text-sm truncate text-holo-ice select-none">{doc.originalName}</span>
                                                <span className="text-[10px] text-white/30">Root File</span>
                                            </div>
                                        </div>
                                        {!isSelectionMode && (
                                            <button onClick={(e) => handleDelete(e, 'doc', doc._id)} className="p-1 hover:text-red-400 text-holo-ice/50 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                        )}
                                    </div>
                                ))}

                                {library.folders.length === 0 && library.rootDocuments.length === 0 && (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="font-code text-xs">NO DATA STREAMS FOUND</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // EXTERNAL SOURCES SIDEBAR
                        <div className="flex flex-col p-4 gap-6 animate-fade-in">
                            <div className="space-y-4">
                                <label className="text-xs font-code text-white/50">TOPIC QUERY</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-holo-cyan" size={16} />
                                    <input
                                        type="text"
                                        value={externalTopic}
                                        onChange={(e) => setExternalTopic(e.target.value)}
                                        placeholder="Enter Topic..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-holo-cyan focus:ring-1 focus:ring-holo-cyan/50 font-code"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleExternalSummary('WIKI')}
                                    disabled={externalLoading}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-holo-cyan/30 transition-all group disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-holo-cyan/10 flex items-center justify-center text-holo-cyan group-hover:scale-110 transition-transform">
                                        <Globe size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-tech text-sm text-white">WIKIPEDIA</p>
                                        <p className="text-[10px] font-code text-white/40">Load Encyclopedia Entry</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExternalSummary('NCERT')}
                                    disabled={externalLoading}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all group disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-tech text-sm text-white">NCERT</p>
                                        <p className="text-[10px] font-code text-white/40">Load Textbook Concept</p>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/30 italic">
                                Note: External summaries are transient and not saved to your drive automatically.
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Viewer */}
                <div className="flex-1 h-full relative perspective-2000">
                    <div
                        className="w-full h-full bg-holo-space/80 border border-holo-border rounded-2xl p-8 overflow-y-auto holo-panel"
                        style={{ transform: 'rotateY(-1deg)' }}
                    >
                        {activeContent ? (
                            <>
                                {/* Header Badge */}
                                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                                    <div className="w-12 h-12 rounded-xl bg-holo-cyan/20 flex items-center justify-center border border-holo-cyan text-holo-cyan shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                                        <Hash size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-tech font-bold text-white mb-1">{activeContent.title || activeContent.originalName}</h1>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-xs font-code text-holo-ice/60">
                                                {activeContent.summary && !activeContent.summary.startsWith("Generating summary") ? (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                        {activeContent.isTransient ? 'EXTERNAL DATA LOADED' : 'AI ANALYSIS COMPLETE'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                                        PROCESSING...
                                                    </>
                                                )}
                                            </div>

                                            {activeContent.summary && !activeContent.summary.startsWith("Generating summary") && !activeContent.isTransient && (
                                                <button
                                                    onClick={async () => {
                                                        const prevSummary = activeContent.summary;
                                                        // Update UI immediately to show processing
                                                        setSelectedItem(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data, summary: "Generating summary..." }
                                                        }));

                                                        try {
                                                            await axios.post('/api/summary/regenerate', {
                                                                documentId: activeContent._id,
                                                                previousSummary: prevSummary
                                                            });
                                                            // Polling will handle the rest
                                                        } catch (err) {
                                                            console.error("Regen failed", err);
                                                            alert("Regeneration failed.");
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-code text-holo-cyan flex items-center gap-1 transition-colors"
                                                >
                                                    <RotateCw size={10} />
                                                    REGENERATE SUMMARY
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Content */}
                                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-tech prose-headings:text-holo-cyan prose-p:text-holo-ice/80">
                                    {activeContent.summary && !activeContent.summary.startsWith("Generating summary") ? (
                                        <ReactMarkdown components={{
                                            h1: ({ node, ...props }) => <h2 className="text-2xl border-l-4 border-holo-cyan pl-4 mb-6" {...props} />,
                                            h2: ({ node, ...props }) => <h3 className="text-xl text-holo-violet mt-8 mb-4 flex items-center gap-2 before:content-['>'] before:text-holo-cyan" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-2 my-6" {...props} />,
                                            li: ({ node, ...props }) => <li className="flex items-start gap-2 before:content-['•'] before:text-holo-cyan before:mt-1" {...props} />
                                        }}>
                                            {activeContent.summary}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-holo-cyan to-transparent animate-shimmer-band mb-4" />
                                            <p className="font-code flex items-center gap-2">
                                                <RotateCw size={16} className="animate-spin" />
                                                PROCESSING DATA LAYER...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : selectedItem?.type === 'folder' ? (
                            <div
                                className="flex flex-col items-center justify-center h-full text-center opacity-50 transition-colors rounded-xl"
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.backgroundColor = 'rgba(0, 243, 255, 0.1)'; }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.backgroundColor = 'transparent'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    const files = Array.from(e.dataTransfer.files);
                                    if (files.length > 0) {
                                        handleFileChange({ target: { files }, folderIdOverride: selectedItem.data._id });
                                    }
                                }}
                            >
                                <Folder size={64} className="mb-4 text-holo-cyan" />
                                <h2 className="font-tech text-3xl text-holo-ice">{selectedItem.data.name}</h2>
                                <p className="font-code text-sm mt-2">{selectedItem.data.documents.length} FILES CONTAINED</p>

                                {loading && (
                                    <div className="mt-4 flex items-center gap-2 text-holo-cyan animate-pulse">
                                        <RotateCw size={16} className="animate-spin" />
                                        <span className="font-code text-xs">GENERATING COMBINED SUMMARY...</span>
                                    </div>
                                )}

                                <p className="font-code text-xs mt-4 text-holo-cyan animate-pulse">DROP FILES HERE TO UPLOAD</p>

                                <div className="mt-8">
                                    <button
                                        onClick={async () => {
                                            if (selectedItem.data.documents.length === 0) return;
                                            setLoading(true);
                                            try {
                                                const res = await axios.post('/api/summary/folder', {
                                                    folderId: selectedItem.data._id
                                                });

                                                // Refresh library to show the new summary file
                                                await fetchLibrary();

                                                // Select the new document
                                                setSelectedItem({
                                                    type: 'doc',
                                                    data: res.data // Use the actual saved document returned
                                                });
                                            } catch (err) {
                                                console.error(err);
                                                alert("Failed to generate combined summary.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading || selectedItem.data.documents.length === 0}
                                        className="px-6 py-2 bg-holo-violet/20 hover:bg-holo-violet/30 border border-holo-violet/50 rounded-lg text-xs font-code text-holo-ice flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <RotateCw size={14} className="animate-spin" /> : <Layers size={14} />}
                                        {loading ? "GENERATING SUMMARY..." : "REGENERATE SUMMARY"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <Layers size={64} className="mb-4 text-holo-ice" />
                                <h2 className="font-tech text-xl text-holo-ice">INSIGHT CORE EMPTY</h2>
                                <p className="font-code text-sm mt-2">SELECT A FILE OR EXTERNAL SOURCE TO INSPECT</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SummaryView;
