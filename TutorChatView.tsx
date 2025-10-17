// fix: Replaced placeholder content with a full implementation for the AI Tutor Chat view.
import React, { useState, useEffect, useRef } from 'react';
import { startChat, sendMessageToTutor } from './services/geminiService';
import { renderSimpleMarkdown } from './utils/markdown';
import { LoadingSpinner } from './components/SummarizerComponents';
import { MicrophoneIcon } from './components/icons';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import type { ChatMessage as ChatMessageType } from './types'; // Assuming ChatMessage is defined in types.ts

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    isStreaming?: boolean;
}

const TutorChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { transcript, isListening, startListening, stopListening, browserSupportsSpeechRecognition } = useSpeechRecognition();

    useEffect(() => {
        startChat();
        setMessages([
            { role: 'model', content: "Hello! I'm your AI Tutor. What would you like to learn about today?" }
        ]);
    }, []);

    useEffect(() => {
        if (transcript) {
            setUserInput(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        // Add a placeholder for the model's response
        setMessages(prev => [...prev, { role: 'model', content: '', isStreaming: true }]);
        
        try {
            const stream = await sendMessageToTutor(userInput);
            let responseText = '';
            for await (const chunk of stream) {
                responseText += chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'model' && lastMessage.isStreaming) {
                        const newMessages = [...prev.slice(0, -1)];
                        newMessages.push({ role: 'model', content: responseText, isStreaming: true });
                        return newMessages;
                    }
                    return prev; // Should not happen
                });
            }
            
            // Finalize the message
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = responseText;
                    delete lastMessage.isStreaming;
                }
                return newMessages;
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to get a response: ${errorMessage}`);
            // Remove the streaming placeholder on error
            setMessages(prev => prev.filter(m => !(m.isStreaming && m.content === '')));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">AI Tutor Chat</h1>
            <p className="text-slate-400 mb-6">Ask me anything! I'm here to help you learn and understand any topic.</p>

            <div className="flex-1 flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-sm overflow-hidden">
                <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-4 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                <div className="prose prose-invert max-w-none prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.content) }} />
                                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1" />}
                            </div>
                        </div>
                    ))}
                </div>

                {error && <div className="p-4 text-red-400 border-t border-slate-700/50">{error}</div>}
                
                <div className="p-4 border-t border-slate-700/50 bg-slate-800">
                    <div className="relative">
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Type your question here..."
                            rows={1}
                            className="w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-4 pr-20 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm resize-none"
                            disabled={isLoading}
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                            {browserSupportsSpeechRecognition && (
                                <button
                                    onClick={handleMicClick}
                                    className={`p-1 rounded-full text-slate-400 hover:text-white ${isListening ? 'text-cyan-400 animate-pulse' : ''}`}
                                    aria-label="Use microphone"
                                >
                                    <MicrophoneIcon />
                                </button>
                            )}
                            <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="ml-2 bg-cyan-600 text-white font-semibold px-4 py-1 rounded-sm text-sm hover:bg-cyan-500 disabled:bg-slate-600">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorChatView;
