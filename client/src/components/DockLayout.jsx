import React, { useState } from 'react';
import { UploadCloud, MessageSquare, FileText, Brain, Hexagon } from 'lucide-react'; // Hexagon unused now but kept if others use it (DockItem doesn't seem to)

const DockLayout = ({ children, activeModule, setActiveModule, quizActive }) => {

    const dockItems = [
        { id: 'upload', icon: UploadCloud, label: 'UPLOAD PRISM' },
        { id: 'quiz', icon: Brain, label: 'QUIZ' },
        { id: 'chat', icon: MessageSquare, label: 'ASK QUESTION' },
        { id: 'summary', icon: FileText, label: 'SUMMARY' },
    ];

    return (
        <div className="relative w-screen h-screen flex flex-col items-center justify-end overflow-hidden perspective-2000">

            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-holo-cyan/5 rounded-full blur-[100px] animate-pulse-glow" />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-holo-space to-transparent opacity-80" />
            </div>

            {/* Main Content Stage */}
            <div className={`relative w-full h-full max-w-7xl mx-auto flex items-center justify-center p-8 transition-all duration-700 ${activeModule === 'quiz' && quizActive ? 'pb-8 pr-32' : 'pb-32'}`}>
                {children}
            </div>

            {/* Holographic Dock */}
            <div className={`
                absolute z-50 transition-all duration-700 ease-in-out
                ${activeModule === 'quiz' && quizActive
                    ? 'right-8 top-1/2 -translate-y-1/2'
                    : 'bottom-4 left-1/2 -translate-x-1/2'}
            `}>
                <div className={`
                    flex gap-2 p-3 rounded-2xl bg-holo-dock/50 backdrop-blur-xl border border-holo-border shadow-holo ring-1 ring-white/10 transition-all hover:scale-105
                    ${activeModule === 'quiz' && quizActive ? 'flex-col' : 'items-center'}
                `}>

                    {dockItems.map((item) => {
                        const isActive = activeModule === item.id;
                        return (
                            <DockItem
                                key={item.id}
                                item={item}
                                isActive={isActive}
                                activeModule={activeModule}
                                setActiveModule={setActiveModule}
                                quizActive={quizActive}
                            />
                        );
                    })}

                </div>

                {/* Decorative Dock Base */}
                <div className={`
                    absolute bg-gradient-to-r from-transparent via-holo-cyan/20 to-transparent blur-md transition-all duration-700
                    ${activeModule === 'quiz' && quizActive
                        ? 'right-full top-1/2 -translate-y-1/2 w-4 h-[120%]'
                        : 'top-full left-1/2 -translate-x-1/2 w-[120%] h-4'}
                `} />
            </div>
        </div>
    );
};

// Extracted for cleanliness
const DockItem = ({ item, isActive, activeModule, setActiveModule, quizActive }) => {
    const Icon = item.icon;
    return (
        <button
            onClick={() => setActiveModule(item.id)}
            className={`
                group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300
                ${isActive
                    ? 'bg-holo-cyan/10 scale-110 shadow-[0_5px_15px_rgba(0,243,255,0.2)]'
                    : 'hover:bg-white/5 hover:scale-105'}
                ${isActive && activeModule !== 'quiz' ? 'translate-y-[-5px]' : ''} 
                ${isActive && activeModule === 'quiz' && quizActive ? 'translate-x-[-5px]' : ''}
                ${isActive && activeModule === 'quiz' && !quizActive ? 'translate-y-[-5px]' : ''}
            `}
        >
            {/* Active Indicator Beam */}
            {isActive && (
                <div className={`
                    absolute bg-gradient-to-t from-holo-cyan/0 via-holo-cyan/20 to-holo-cyan/0 blur-md
                    ${activeModule === 'quiz' && quizActive
                        ? 'right-full top-1/2 -translate-y-1/2 w-6 h-10 rotate-90'
                        : '-bottom-6 w-10 h-16'}
                `} />
            )}

            <Icon
                size={24}
                className={`
                    mb-1 transition-all duration-300
                    ${isActive ? 'text-holo-cyan drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'text-slate-400 group-hover:text-holo-ice'}
                `}
            />

            <span className={`
                text-[9px] font-code tracking-widest transition-all duration-300
                ${isActive ? 'text-holo-cyan opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-70'}
            `}>
                {item.label.split(' ')[0]}
            </span>

            {/* Tech borders for active state */}
            {isActive && (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-holo-cyan" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-holo-cyan" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-holo-cyan" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-holo-cyan" />
                </>
            )}
        </button>
    );
}

export default DockLayout;
