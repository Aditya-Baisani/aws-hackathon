import React, { createContext, useContext, useState, useCallback } from 'react';

const DoubtContext = createContext(null);

export function DoubtProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [currentTopicId, setCurrentTopicIdState] = useState(null);
    const [currentTopicTitle, setCurrentTopicTitle] = useState(null);

    const setCurrentTopicId = useCallback((id) => {
        setCurrentTopicIdState(prev => {
            if (prev !== id) {
                setSessionId(null);
                setConversation([]);
            }
            return id;
        });
    }, []);

    const openPanel = useCallback(() => setIsOpen(true), []);
    const closePanel = useCallback(() => setIsOpen(false), []);
    const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);

    const addMessage = useCallback((role, content) => {
        setConversation(prev => [...prev, { role, content, timestamp: Date.now() }]);
    }, []);

    const clearConversation = useCallback(() => {
        setConversation([]);
        setSessionId(null);
    }, []);

    return (
        <DoubtContext.Provider value={{
            isOpen, openPanel, closePanel, togglePanel,
            conversation, addMessage, clearConversation,
            sessionId, setSessionId,
            currentTopicId, setCurrentTopicId,
            currentTopicTitle, setCurrentTopicTitle,
        }}>
            {children}
        </DoubtContext.Provider>
    );
}

export function useDoubt() {
    const ctx = useContext(DoubtContext);
    if (!ctx) throw new Error('useDoubt must be used within DoubtProvider');
    return ctx;
}
