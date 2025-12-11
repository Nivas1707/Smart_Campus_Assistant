
import React, { useState } from 'react';
import { Database, FileText, Globe, BookOpen, Cloud, Star, Sparkles } from 'lucide-react';

const KnowledgeObservatory = ({ activeModule, setActiveModule }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Data Sources
    const sources = [
        {
            id: 'personal',
            label: 'Student Materials',
            type: 'nebula',
            color: 'blue',
            icon: Cloud,
            module: 'upload',
            description: 'Your uploaded documents and study notes.',
            weight: 'HIGH'
        }
    ];

    return (
        <div className="relative group/observatory z-50">

            {/* --- The Orbital Sphere (Trigger) --- */}
            <div
                className={`
                    relative w-14 h-14 flex items-center justify-center cursor-pointer transition-all duration-500 ease-out
                    ${isOpen ? 'translate-y-[-20px] scale-110' : 'hover:scale-105 hover:-translate-y-1'}
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Core Sphere */}
                <div className={`
                    w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(120,40,255,0.6)]
                    flex items-center justify-center relative overflow-hidden transition-all duration-500
                    ${isOpen ? 'animate-pulse shadow-[0_0_30px_rgba(0,243,255,0.8)]' : ''}
                `}>
                    <Database size={16} className="text-white z-10 drop-shadow-md" />

                    {/* Inner Atmosphere */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {/* Orbital Rings */}
                <div className={`absolute inset-0 border border-cyan-400/30 rounded-full w-full h-full animate-[spin_4s_linear_infinite] pointer-events-none scale-125`} />
                <div className={`absolute inset-0 border border-purple-400/20 rounded-full w-[140%] h-[140%] -top-[20%] -left-[20%] animate-[spin_7s_linear_infinite_reverse] pointer-events-none`} />
            </div>

            {/* --- The Unfolding Star Map Panel --- */}
            <div className={`
                absolute bottom-[140%] left-1/2 -translate-x-1/2 w-[320px] h-[340px]
                transition-all duration-700 ease-spring
                ${isOpen ? 'opacity-100 rotate-x-0 translate-y-0 visible' : 'opacity-0 rotate-x-90 translate-y-10 invisible pointer-events-none'}
                perspective-1000
            `}>

                {/* Holographic Dome/Card */}
                <div className="
                    w-full h-full bg-black/80 backpack-blur-2xl rounded-3xl border border-white/10
                    shadow-[0_0_50px_rgba(0,200,255,0.2)] relative overflow-hidden
                    transform-style-3d rotate-x-[5deg]
                ">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

                    {/* Ambient Glow */}
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-cyan-500/10 to-transparent"></div>

                    {/* Header */}
                    <div className="relative z-10 p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <span className="text-[10px] font-tech text-cyan-300 tracking-widest flex items-center gap-2">
                            <Sparkles size={10} />

                        </span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        </div>
                    </div>

                    {/* Celestial Objects Container */}
                    <div className="relative h-[240px] w-full p-4 flex flex-col items-center justify-center space-y-6">

                        {sources.map((source, index) => {
                            const isNebula = source.type === 'nebula';
                            const isStar = source.type === 'star';
                            const isComet = source.type === 'comet';

                            return (
                                <div
                                    key={source.id}
                                    className="group relative w-full flex items-center justify-between cursor-pointer perspective-500"
                                    onClick={() => {
                                        setActiveModule(source.module);
                                        // Specific logic to open sub-tabs could go here via a context or event bus, 
                                        // but for now switching module is the primary action.
                                        setIsOpen(false);
                                    }}
                                >
                                    {/* Label & Type */}
                                    <div className="flex-1 text-left z-10 transition-transform group-hover:translate-x-2 duration-300">
                                        <h3 className={`text-sm font-bold text-${source.color === 'gold' ? 'yellow' : source.color}-400 font-tech drop-shadow-md`}>
                                            {source.label.toUpperCase()}
                                        </h3>
                                        <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                            <p className="text-[9px] text-white/50 mt-1">{source.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-white/70">SYNC: LIVE</span>
                                                <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-white/70">W: {source.weight}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Representation */}
                                    <div className="relative w-16 h-12 flex items-center justify-center transform-style-3d transition-transform duration-500 group-hover:scale-125 group-hover:rotate-y-[15deg]">

                                        {/* 1. Nebula Style */}
                                        {isNebula && (
                                            <div className="relative w-10 h-8">
                                                <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full animate-pulse-slow"></div>
                                                <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-[float_3s_ease-in-out_infinite]"></div>
                                                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-blue-200 rounded-full animate-[float_4s_ease-in-out_infinite_reverse]"></div>
                                                <Cloud className="relative z-10 text-blue-300 drop-shadow-[0_0_8px_rgba(50,200,255,0.8)]" size={20} />
                                            </div>
                                        )}

                                        {/* 2. Star Style */}
                                        {isStar && (
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <div className="absolute w-[120%] h-[1px] bg-yellow-500/50 rotate-45 animate-spin-slow"></div>
                                                <div className="absolute w-[120%] h-[1px] bg-yellow-500/50 -rotate-45 animate-spin-slow"></div>
                                                <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_25px_rgba(255,215,0,0.8)] animate-pulse z-10"></div>
                                                {/* API Link Detail only on hover */}
                                                <div className="absolute inset-0 border border-yellow-500/30 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"></div>
                                            </div>
                                        )}

                                        {/* 3. Comet Shards Style */}
                                        {isComet && (
                                            <div className="relative w-12 h-12 flex items-center justify-center">
                                                <div className="w-1.5 h-6 bg-cyan-400/80 skew-x-12 shadow-[0_0_15px_cyan] animate-[float_3s_ease-in-out_infinite]"></div>
                                                <div className="w-1.5 h-4 bg-cyan-300/60 skew-x-12 shadow-[0_0_15px_cyan] animate-[float_2.5s_ease-in-out_infinite_reverse] ml-2 mt-2"></div>
                                                <div className="w-1 h-3 bg-cyan-200/40 skew-x-12 shadow-[0_0_15px_cyan] animate-[float_4s_ease-in-out_infinite] -ml-4 -mt-2"></div>
                                            </div>
                                        )}

                                    </div>

                                    {/* Hover Connection Line */}
                                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent group-hover:w-full transition-all duration-700"></div>
                                </div>
                            );
                        })}

                    </div>

                    {/* Footer decoration */}
                    <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                </div>

                {/* Perspective Shadow */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/50 blur-xl rounded-[100%]"></div>
            </div>
        </div>
    );
};

export default KnowledgeObservatory;
