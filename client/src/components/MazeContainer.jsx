import React, { useState, useEffect } from 'react';

const MazeContainer = ({ activeRoom, setActiveRoom, children }) => {
    // Grid size: 3x3
    // Room coordinates: x (0-2), y (0-2)
    const [viewport, setViewport] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const containerStyle = {
        width: `${viewport.width * 3}px`,
        height: `${viewport.height * 3}px`,
        transform: `translate(-${activeRoom.x * viewport.width}px, -${activeRoom.y * viewport.height}px)`,
        transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'grid',
        gridTemplateColumns: `${viewport.width}px ${viewport.width}px ${viewport.width}px`,
        gridTemplateRows: `${viewport.height}px ${viewport.height}px ${viewport.height}px`,
    };

    const handleNavigate = (x, y) => {
        setActiveRoom({ x, y });
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-maze-bg">
            {/* The Maze World */}
            <div style={containerStyle} className="absolute top-0 left-0">
                {children}
            </div>

            {/* Maze Runner HUD (Mini-map) */}
            <div className="fixed bottom-8 right-8 z-50 p-4 bg-surface backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                <div className="grid grid-cols-3 gap-2 w-24 h-24">
                    {[0, 1, 2].map(y => (
                        [0, 1, 2].map(x => {
                            const isActive = activeRoom.x === x && activeRoom.y === y;
                            // Determine if this cell is a valid room (based on our layout plan)
                            // Valid rooms: (0,0) Upload, (1,1) Home, (2,1) Chat, (1,2) Summary, (0,1) Quiz
                            const isValid =
                                (x === 0 && y === 0) ||
                                (x === 1 && y === 1) ||
                                (x === 2 && y === 1) ||
                                (x === 1 && y === 2) ||
                                (x === 0 && y === 1);

                            return (
                                <button
                                    key={`${x}-${y}`}
                                    onClick={() => isValid && handleNavigate(x, y)}
                                    disabled={!isValid}
                                    className={`
                                        rounded-full transition-all duration-500
                                        ${isActive ? 'bg-neon-blue scale-125 shadow-[0_0_10px_#00f3ff]' : ''}
                                        ${isValid && !isActive ? 'bg-white/20 hover:bg-white/40 cursor-pointer' : ''}
                                        ${!isValid ? 'bg-transparent cursor-default' : ''}
                                    `}
                                />
                            );
                        })
                    ))}
                </div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-handwriting text-neon-blue opacity-80 whitespace-nowrap">
                    Maze Runner
                </div>
            </div>
        </div>
    );
};

export default MazeContainer;
