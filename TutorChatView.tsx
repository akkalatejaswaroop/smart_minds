import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage } from './types';
import { LoadingSpinner } from './components/SummarizerComponents';
import { renderSimpleMarkdown } from './utils/markdown';

const TutorChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chat = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chat.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are a helpful and patient AI tutor for students of all ages. Your name is "Mindy". Explain concepts clearly, provide examples, and ask follow-up questions to ensure understanding. Keep your responses concise and easy to read. Use Markdown for formatting when helpful.',
                },
            });
            setMessages([{ role: 'model', text: 'Hello! I\'m Mindy, your AI Tutor. What would you like to learn about today?' }]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to initialize the AI Tutor.');
            console.error(e);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chat.current) return;
        
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.current.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`I encountered an error. Please try again. Details: ${errorMessage}`);
            // Remove the empty model message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">AI Tutor Chat</h1>
            <p className="text-slate-400 mb-6">Ask questions and get explanations on any academic subject.</p>
            
            <div className="flex-1 flex flex-col bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-700 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <div className="prose prose-invert prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.text) }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-xl p-3 rounded-lg bg-slate-700 text-slate-200 flex items-center gap-2">
                                <LoadingSpinner className="w-4 h-4" />
                                <span>Mindy is thinking...</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="flex justify-start">
                           <div className="max-w-xl p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300">
                               <p>{error}</p>
                           </div>
                       </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800">
                    <div className="flex gap-2">
                         <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about your studies..."
                            className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorChatView;
