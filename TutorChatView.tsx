
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage } from './types';
import { LoadingSpinner } from './components/SummarizerComponents';
import { renderSimpleMarkdown } from './utils/markdown';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { MicrophoneIcon, PaperclipIcon, XIcon } from './components/icons';
import { extractTextFromFile } from './utils/fileReader';

const TutorChatView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chat = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // File context state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);

    const {
        transcript,
        isListening,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chat.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are a helpful and patient AI tutor for students of all ages. Your name is "Mindy". Explain concepts clearly, provide examples, and ask follow-up questions to ensure understanding. Keep your responses concise and easy to read. Use Markdown for formatting when helpful. IMPORTANT: You must be able to understand and respond to users who type Telugu using English letters (Tenglish, e.g., "ela unnavu"). Treat this as natural Telugu and respond appropriately in either Tenglish or standard Telugu based on the user\'s query. If the user provides document context, base your answers primarily on that context.',
                },
            });
            setMessages([{ role: 'model', text: 'Hello! I\'m Mindy, your AI Tutor. What would you like to learn about today? You can also upload a file for me to read.' }]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to initialize the AI Tutor.');
            console.error(e);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleClearFile = () => {
        setUploadedFile(null);
        setFileContent(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        handleClearFile();
        setIsFileReading(true);
        setError(null);
        
        try {
            const text = await extractTextFromFile(file);
            setUploadedFile(file);
            setFileContent(text);
            setMessages(prev => [...prev, { role: 'model', text: `I've finished reading "${file.name}". You can ask me questions about it now.` }]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(`Error reading file: ${errorMessage}`);
        } finally {
            setIsFileReading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chat.current) return;
        
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        
        let messageToSend = input;

        // If there's file content waiting to be sent, prepend it to the message
        if (fileContent) {
            messageToSend = `Based on the content of the document I've provided, please answer my question.\n\n--- DOCUMENT CONTENT ---\n${fileContent}\n\n--- MY QUESTION ---\n${input}`;
            // Clear the file context from state after preparing the message.
            // The context is now "in-flight" and will become part of the chat history.
            handleClearFile();
        }

        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.current.sendMessageStream({ message: messageToSend });
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

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setInput(''); // Clear input before listening
            startListening();
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            <h1 className="text-3xl font-bold text-white mb-2">AI Tutor Chat</h1>
            <p className="text-slate-400 mb-6">Ask questions, or upload a PDF/DOCX to discuss its content.</p>
            
            <div className="flex-1 flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-sm overflow-hidden">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <div className="prose prose-invert prose-p:my-0" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.text) }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                            <div className="max-w-xl p-3 rounded-sm bg-slate-700 text-slate-200 flex items-center gap-2">
                                <LoadingSpinner className="w-4 h-4" />
                                <span>Mindy is thinking...</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="flex justify-start">
                           <div className="max-w-xl p-3 rounded-sm bg-red-900/50 border border-red-500/50 text-red-300">
                               <p>{error}</p>
                           </div>
                       </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-700/50 bg-slate-800">
                    {(uploadedFile || isFileReading) && (
                        <div className="flex items-center justify-between bg-slate-700 px-3 py-1.5 rounded-t-sm text-sm mb-2">
                            <div className="flex items-center gap-2 text-slate-300 truncate">
                                {isFileReading ? <LoadingSpinner/> : <PaperclipIcon className="w-4 h-4" />}
                                <span className="font-medium truncate">{isFileReading ? 'Reading file...' : uploadedFile?.name}</span>
                            </div>
                           {!isFileReading && <button onClick={handleClearFile} className="p-1 hover:bg-slate-600 rounded-full"><XIcon className="w-4 h-4" /></button>}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 bg-slate-700 rounded-sm hover:bg-slate-600 hover:text-white" disabled={isLoading || isFileReading} aria-label="Attach file">
                            <PaperclipIcon />
                        </button>
                        <div className="relative flex-grow">
                             <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={uploadedFile ? `Ask about ${uploadedFile.name}...` : "Ask me anything or use the mic..."}
                                className="w-full bg-slate-700 border border-slate-600 rounded-sm px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                disabled={isLoading || isFileReading}
                            />
                            <button
                                onClick={handleMicClick}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white ${isListening ? 'text-cyan-400 animate-pulse' : ''}`}
                                aria-label="Use microphone to dictate"
                                disabled={isLoading || isFileReading}
                            >
                                <MicrophoneIcon />
                            </button>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim() || isFileReading}
                            className="bg-cyan-600 text-white font-semibold px-5 py-2 rounded-sm hover:bg-cyan-500 transition-colors disabled:bg-cyan-900/50 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
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
