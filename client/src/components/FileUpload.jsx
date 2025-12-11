import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, File, AlertCircle, Cpu, Zap } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = async (files) => {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        // Simulate progress for sci-fi effect
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 5, 90));
        }, 100);

        const formData = new FormData();
        // Handle both FileList (from input) and single File (from drag) which might be wrapped
        // Consitent handling: convert to array
        const fileArray = files instanceof FileList ? Array.from(files) : (Array.isArray(files) ? files : [files]);

        if (fileArray.length > 10) {
            setError("10 uploads per session is the limit");
            setUploading(false);
            return;
        }

        fileArray.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await axios.post('/api/upload', formData);
            clearInterval(progressInterval);
            setUploadProgress(100);

            // Short delay to show 100%
            setTimeout(() => {
                onUploadSuccess(response.data); // This now returns { documents: [], folderId }
                setUploading(false);
            }, 500);

        } catch (err) {
            clearInterval(progressInterval);
            console.error(err);
            setError('Prism refraction failed. File structure incompatible.');
            setUploading(false);
        }
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    return (
        <div className="w-full flex flex-col items-center justify-center relative">

            {/* Holographic Header */}
            <div className="mb-12 text-center relative">
                <h2 className="text-4xl font-tech font-bold text-white tracking-widest uppercase holo-text-glow">
                    Upload Prism
                </h2>
                <div className="w-24 h-1 bg-holo-cyan mx-auto mt-4 rounded-full shadow-[0_0_15px_#00f3ff]" />
                <p className="text-holo-ice/60 font-code text-xs mt-2 tracking-[0.2em]">
                    SECURE UPLOAD PROTOCOL V4.2
                </p>
            </div>

            {/* The Prism (Upload Zone) */}
            <div
                className={`
                    relative w-80 h-80 group cursor-pointer perspective-1000
                    transition-all duration-500
                    ${dragActive ? 'scale-110' : 'hover:scale-105'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
            >
                {/* 3D Glass Prism Shape */}
                <div className={`
                    absolute inset-0 bg-gradient-to-br from-white/10 to-transparent 
                    backdrop-blur-md border border-white/20 rounded-3xl
                    shadow-[0_0_50px_rgba(0,243,255,0.1),inset_0_0_20px_rgba(255,255,255,0.05)]
                    transform transition-transform duration-700
                    ${dragActive ? 'rotate-x-12 rotate-y-12' : 'group-hover:rotate-x-6 group-hover:rotate-y-6'}
                `}>
                    {/* Inner Holographic Core */}
                    <div className="absolute inset-8 border border-holo-cyan/30 rounded-2xl flex items-center justify-center overflow-hidden">

                        {!uploading ? (
                            <>
                                <UploadCloud
                                    size={64}
                                    className={`
                                        text-holo-cyan transition-all duration-500
                                        ${dragActive ? 'scale-125 drop-shadow-[0_0_20px_#00f3ff]' : 'group-hover:drop-shadow-[0_0_10px_#00f3ff]'}
                                    `}
                                />
                                {/* Scanning beams */}
                                <div className="absolute w-full h-1 bg-holo-cyan/50 top-0 animate-grid-scan opacity-0 group-hover:opacity-100" />
                            </>
                        ) : (
                            <div className="flex flex-col items-center w-full px-8">
                                <Cpu size={48} className="text-holo-violet animate-spin mb-4" />
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full bg-holo-cyan shadow-[0_0_10px_#00f3ff] transition-all duration-100 ease-linear"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="font-code text-holo-cyan text-xs mt-2 animate-pulse">
                                    ASSIMILATING DATA... {uploadProgress}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-holo-cyan" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-holo-cyan" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-holo-cyan" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-holo-cyan" />
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
                    multiple
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-8 p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-3 backdrop-blur-md animate-slide-up shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <AlertCircle size={20} className="text-red-400" />
                    <span className="font-code text-sm">{error}</span>
                </div>
            )}

            {/* Guide Text */}
            {!uploading && !error && (
                <div className="mt-8 text-center animate-fade-in">
                    <p className="text-holo-ice font-bold tracking-wide">
                        DRAG & DROP OR CLICK TO UPLOAD
                    </p>
                    <p className="text-holo-ice/50 text-xs mt-1">
                        Accepting .PDF, .DOCX, .TXT files
                    </p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
