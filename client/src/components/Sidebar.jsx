import React from 'react';
import { LayoutDashboard, MessageSquare, FileText, Brain, UploadCloud, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'summary', label: 'Summaries', icon: FileText },
        { id: 'quiz', label: 'Quiz', icon: Brain },
    ];

    return (
        <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <Brain size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">SmartCampus</span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                                ${isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-muted hover:bg-white hover:text-text'
                                }
                            `}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-white hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
