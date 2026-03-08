import React, { useState, useRef, useEffect } from 'react';
import { useDoubt } from '../contexts/DoubtContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { MessageCircle, X, Send } from 'lucide-react';
import api from '../lib/api';

export default function DoubtPanel() {
    const {
        isOpen, openPanel, closePanel, conversation, addMessage,
        sessionId, setSessionId, currentTopicId, currentTopicTitle
    } = useDoubt();
    const { user } = useAuth();
    const toast = useToast();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    async function handleSend() {
        const question = input.trim();
        if (!question || loading) return;

        setInput('');
        addMessage('user', question);
        setLoading(true);

        try {
            let sid = sessionId;
            if (!sid) {
                const res = await api.createDoubtSession({
                    topicId: currentTopicId,
                    topicTitle: currentTopicTitle
                });
                sid = res.sessionId;
                setSessionId(sid);
            }

            const res = await api.askDoubt(sid, question);
            addMessage('bot', res.answer || 'I couldn\'t generate an answer. Please try again.');
        } catch (err) {
            addMessage('bot', 'Sorry, I encountered an error. Please try again.');
            toast.error('Failed to get answer');
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!user) return null;

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button className="doubt-fab" onClick={openPanel} title="Ask a doubt">
                    <MessageCircle size={24} />
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div className="doubt-panel-overlay">
                    <div className="doubt-header">
                        <h3>💬 Ask a Doubt</h3>
                        <button className="doubt-close" onClick={closePanel}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="doubt-messages">
                        {conversation.length === 0 && (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <MessageCircle size={40} style={{ opacity: 0.2 }} />
                                <h3>Ask anything!</h3>
                                <p>Type your doubt below and get an instant AI-powered answer.</p>
                            </div>
                        )}

                        {conversation.map((msg, i) => (
                            <div key={i} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                {msg.role === 'bot' && <div className="message-name">AI Tutor</div>}
                                <p>{msg.content}</p>
                            </div>
                        ))}

                        {loading && (
                            <div className="message bot">
                                <div className="message-name">AI Tutor</div>
                                <div className="typing-indicator">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="doubt-input-area">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your question..."
                            disabled={loading}
                        />
                        <button
                            className="btn btn-primary btn-icon"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            style={{ borderRadius: '50%', width: 40, height: 40 }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
