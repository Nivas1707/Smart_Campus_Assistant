import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const ChatInterface = ({ documentId }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'The whispers are ready. What do you seek?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/ask', {
                question: input,
                documentId: documentId
            });
            const aiMessage = { role: 'assistant', content: response.data.answer };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'The connection is weak. I could not hear you.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-8 items-center justify-center animate-fade-in relative">
            {/* Holographic Container */}
            <div className="w-full max-w-4xl h-[80vh] bg-surface/10 backdrop-blur-xl border border-holo-violet/20 rounded-t-[3rem] rounded-b-3xl relative overflow-hidden flex flex-col shadow-[0_0_100px_rgba(139,92,246,0.1)]">

                {/* Header */}
                <div className="h-20 border-b border-holo-violet/20 flex items-center justify-between px-8 bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-holo-violet animate-pulse"></div>
                        <h2 className="font-handwriting text-3xl text-holo-violet glow-text">Cortex Link</h2>
                    </div>
                </div>

                {/* Messages */}
                <div ref={containerRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[70%] p-6 rounded-3xl relative
                                ${msg.role === 'user'
                                    ? 'bg-holo-violet/20 text-white rounded-br-sm'
                                    : 'bg-surface/20 text-indigo-100 rounded-bl-sm border border-white/5'}
                                backdrop-blur-md animate-slide-up
                            `}>
                                <div className="flex items-center gap-2 mb-2 opacity-50">
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    <span className="text-xs uppercase tracking-widest">{msg.role}</span>
                                </div>
                                <div className="prose prose-invert">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-surface/20 p-4 rounded-3xl rounded-bl-sm flex items-center gap-2">
                                <Sparkles size={16} className="text-holo-violet animate-spin" />
                                <span className="text-holo-violet/70 italic text-sm">Translating thoughts...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-6 bg-black/20 border-t border-holo-violet/10">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Send a whisper..."
                            className="w-full bg-black/20 border border-holo-violet/30 rounded-2xl px-6 py-4 pr-16 text-white placeholder-white/20 focus:outline-none focus:border-holo-violet/60 focus:bg-black/40 transition-all resize-none h-16"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-3 top-3 p-2 bg-holo-violet/20 hover:bg-holo-violet/40 text-holo-violet rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
