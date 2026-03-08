import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Search, HelpCircle, Loader, Zap } from 'lucide-react';
import api from '../lib/api';

export default function ClarifyPage() {
    const toast = useToast();

    // Clarify Mode State
    const [term, setTerm] = useState('');
    const [context, setContext] = useState('');
    const [result, setResult] = useState(null);
    const [clarifyLoading, setClarifyLoading] = useState(false);

    // Handle Clarify Submission
    async function handleClarify(e) {
        e.preventDefault();
        if (!term.trim()) return;

        setClarifyLoading(true);
        try {
            const res = await api.clarifyTerm(term.trim(), context.trim());
            setResult({
                term: term.trim(),
                explanation: res.explanation || res.content || '',
            });
            setTerm('');
            setContext('');
        } catch (err) {
            toast.error(err.message || 'Clarification failed');
        } finally {
            setClarifyLoading(false);
        }
    }

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 20 }}>
            <div style={{ paddingBottom: 20, borderBottom: '1px solid var(--border-secondary)', marginBottom: 20 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HelpCircle size={28} style={{ color: 'var(--accent-primary)' }} /> Doubt Resolver
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Get lightning-fast strict definitions for technical jargon or concepts.
                </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="card" style={{ marginBottom: 24 }}>
                    <form onSubmit={handleClarify}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Term or Concept
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text" value={term} onChange={e => setTerm(e.target.value)}
                                    placeholder="e.g., Virtual DOM, Entropy, REST API..."
                                    style={{ width: '100%', padding: '12px 14px 12px 40px' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={clarifyLoading || !term.trim()}>
                            {clarifyLoading ? <><Loader size={16} className="spin" /> Clarifying...</> : <><Zap size={16} /> Clarify Term</>}
                        </button>
                    </form>
                </div>

                {result && (
                    <div className="card" style={{ flex: 1, borderColor: 'var(--border-primary)', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HelpCircle size={18} style={{ color: 'var(--accent-primary)' }} />
                            {result.term}
                        </h3>
                        <div className="explanation-content" style={{ padding: 0, border: 'none', background: 'none' }}>
                            {result.explanation.split('\n').map((line, i) => (
                                <p key={i} style={{ marginBottom: line === '' ? '8px' : '4px', lineHeight: 1.6 }}>
                                    {line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                                        part.startsWith('**') && part.endsWith('**') ? <strong key={k} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong> : part
                                    )}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
