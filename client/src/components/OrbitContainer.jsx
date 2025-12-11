import React, { useState, useEffect } from 'react';
import { Sun, Settings, Bell } from 'lucide-react';

const OrbitContainer = ({ children }) => {
    const [rotation, setRotation] = useState(0);

    // Auto-rotate the entire galaxy slowly
    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 0.05) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-screen h-screen overflow-hidden relative flex items-center justify-center perspective-1000">
            {/* Background Stars (Static for now, could be animated canvas) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

            {/* The Knowledge Sun (Center) */}
            <div className="absolute z-50 w-32 h-32 rounded-full bg-solar-gold shadow-[0_0_100px_#F59E0B] animate-pulse-solar flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <Sun size={48} className="text-white animate-spin-slow" />
            </div>

            {/* Orbit Rings */}
            <div className="orbit-ring w-[400px] h-[400px] border-cyan-holo/20"></div>
            <div className="orbit-ring w-[700px] h-[700px] border-nebula-purple/20"></div>
            <div className="orbit-ring w-[1000px] h-[1000px] border-starlight/10"></div>
            <div className="orbit-ring w-[1300px] h-[1300px] border-solar-gold/10"></div>

            {/* Content Container (Rotates slightly) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {/* Children are injected here. They must handle their own positioning/counter-rotation if needed */}
                {children}
            </div>

            {/* Bloom Portal (Settings) */}
            <button className="fixed bottom-8 right-8 z-50 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 hover:scale-110 transition-all group">
                <Settings className="text-cyan-holo group-hover:rotate-90 transition-transform duration-700" />
            </button>

            {/* Mini Comet (Notifications) */}
            <button className="fixed top-8 right-8 z-50 p-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 hover:scale-110 transition-all">
                <Bell className="text-solar-gold animate-bounce" />
            </button>
        </div>
    );
};

export default OrbitContainer;
