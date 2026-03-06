import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Zap, BookOpen, ExternalLink, Loader, Brain, RotateCw, ChevronRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import api from '../lib/api';
import { useDoubt } from '../contexts/DoubtContext';

const FLIP_STYLE = `
.lesson-card-scene { perspective: 1200px; width: 100%; max-width: 760px; margin: 0 auto; }
.lesson-card-inner {
    position: relative;
    width: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
}
.lesson-card-inner.flipped { transform: rotateY(180deg); }
.lesson-card-face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    padding: 36px;
    border: 1px solid var(--border-secondary);
    background: var(--bg-card);
    box-shadow: 0 12px 48px rgba(0,0,0,0.2), 0 0 20px rgba(124,106,255,0.05);
}
.lesson-card-back {
    position: absolute;
    top: 0; left: 0; right: 0;
    transform: rotateY(180deg);
}
.opt-btn {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 16px 20px;
    border-radius: 12px; border: 1.5px solid var(--border-secondary);
    background: var(--bg-card-hover); color: var(--text-primary);
    font-size: 15px; cursor: pointer; text-align: left;
    transition: all 0.2s ease; margin-bottom: 12px;
}
.opt-btn:hover:not(:disabled) {
    border-color: var(--accent-primary);
    background: rgba(124,106,255,0.08);
}
.opt-btn.correct {
    border-color: #00d2a0;
    background: rgba(0,210,160,0.12);
    color: #00d2a0;
}
.opt-btn.wrong {
    border-color: #ff6b6b;
    background: rgba(255,107,107,0.1);
    color: #ff6b6b;
}
`;

function renderMD(text) {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        // Handle headers
        if (line.startsWith('#### ')) {
            return <h5 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 8px', color: 'var(--accent-primary)' }}>{line.slice(5)}</h5>;
        }
        if (line.startsWith('### ')) {
            return <h4 key={i} style={{ fontSize: 18, fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>{line.slice(4)}</h4>;
        }
        if (/^\*\*(.+)\*\*$/.test(line)) {
            return <h4 key={i} style={{ fontSize: 17, fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</h4>;
        }

        // Handle lists
        if (line.startsWith('- ')) {
            return <li key={i} style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 6, color: 'var(--text-secondary)', marginLeft: 24 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />;
        }

        // Handle empty lines
        if (line.trim() === '') return <div key={i} style={{ height: 10 }} />;

        // Handle paragraphs
        return <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />;
    });
}

export default function TopicExplainPage() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { setCurrentTopicId: setDoubtTopicId, setCurrentTopicTitle: setDoubtTopicTitle } = useDoubt();

    const [mode, setMode] = useState('standard');
    const [explanation, setExplanation] = useState(null);
    const [simplified, setSimplified] = useState(null);
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(true);

    const [flipped, setFlipped] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);

    // Quiz state (using just the first question for the flip card intro)
    const [selectedOpt, setSelectedOpt] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isCorrectOpt, setIsCorrectOpt] = useState(null);

    useEffect(() => {
        loadExplanation();
        const el = document.getElementById('flip-style');
        if (!el) {
            const style = document.createElement('style');
            style.id = 'flip-style';
            style.textContent = FLIP_STYLE;
            document.head.appendChild(style);
        }
    }, [topicId]);

    async function loadExplanation() {
        setLoading(true);
        try {
            const [explRes, refRes] = await Promise.all([
                api.getExplanation(topicId),
                api.getReferences(topicId).catch(() => ({ references: [] })),
            ]);
            setExplanation(explRes.content || explRes.explanation || '');
            setReferences(refRes.references || []);
            setDoubtTopicId(topicId);
            setDoubtTopicTitle(topicId); // Fallback to topicId for now
        } catch (err) {
            toast.error('Failed to load explanation');
        } finally {
            setLoading(false);
        }
    }

    async function loadSimplified() {
        if (simplified) {
            setMode('simplified');
            return;
        }
        setLoading(true);
        try {
            const res = await api.getSimplified(topicId);
            setSimplified(res.content || res.explanation || '');
            setMode('simplified');
        } catch {
            toast.error('Failed to simplify');
        } finally {
            setLoading(false);
        }
    }

    const handleTakeQuiz = async () => {
        if (!quiz) {
            setQuizLoading(true);
            try {
                const res = await api.generateTopicQuiz(topicId);
                setQuiz(res.quiz || res);
                setFlipped(true);
            } catch (err) {
                toast.error('Could not load quiz for this topic');
            } finally {
                setQuizLoading(false);
            }
        } else {
            setFlipped(true);
        }
    };

    const handleSelectOption = async (opt) => {
        if (answered || submitLoading) return;
        setSelectedOpt(opt);
        setSubmitLoading(true);

        try {
            const questions = quiz.questions || quiz;
            const q = questions[0]; // test first question
            const qId = q.questionId || 'q0';

            // Call actual submit API
            const res = await api.submitQuiz(quiz.quizId, { [qId]: opt });

            // Check result
            setIsCorrectOpt(opt === q.correctAnswer);
            setAnswered(true);
        } catch {
            // Local fallback
            const qs = quiz.questions || quiz;
            setIsCorrectOpt(opt === qs[0].correctAnswer);
            setAnswered(true);
        } finally {
            setSubmitLoading(false);
        }
    };

    const content = mode === 'simplified' ? simplified : explanation;
    const qObj = quiz?.questions?.[0] || quiz?.[0] || null;

    return (
        <div className="page-container">
            <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 24, paddingLeft: 0 }}>
                <ArrowLeft size={18} /> Back to Planner
            </button>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
                    <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', marginBottom: 16 }} />
                    <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>Analyzing topic and generating explanation...</span>
                </div>
            ) : (
                <div className="lesson-card-scene">
                    <div className="explanation-toggle" style={{ justifyContent: 'center', marginBottom: 24, display: 'flex', gap: 12, border: 'none', background: 'transparent', padding: 0 }}>
                        <button
                            className="btn btn-secondary"
                            style={{ borderRadius: 24, border: mode === 'standard' ? '1px solid var(--accent-primary)' : '1px solid var(--border-secondary)', background: mode === 'standard' ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)' }}
                            onClick={() => { setMode('standard'); setFlipped(false); }}
                        >
                            <BookOpen size={16} /> Standard Depth
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ borderRadius: 24, border: mode === 'simplified' ? '1px solid var(--accent-orange)' : '1px solid var(--border-secondary)', background: mode === 'simplified' ? 'rgba(255,179,71,0.1)' : 'var(--bg-card)' }}
                            onClick={() => { loadSimplified(); setFlipped(false); }}
                        >
                            <Zap size={16} /> Simplify Summary
                        </button>
                    </div>

                    <div className={`lesson-card-inner ${flipped ? 'flipped' : ''}`}>
                        {/* ── FRONT: Explanation ── */}
                        <div className="lesson-card-face">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,106,255,0.3)' }}>
                                    <Brain size={24} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{mode === 'simplified' ? 'TL;DR' : 'Comprehensive'}</div>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Topic: {topicId}</h2>
                                </div>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                {content ? renderMD(content) : <p style={{ color: 'var(--text-secondary)' }}>Content unavailable.</p>}
                            </div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', borderTop: '1px solid var(--border-secondary)', paddingTop: 20 }}>
                                <button
                                    onClick={handleTakeQuiz}
                                    disabled={quizLoading}
                                    className="btn btn-primary"
                                    style={{ padding: '12px 24px', borderRadius: 24, gap: 8, fontSize: 14 }}
                                >
                                    {quizLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCw size={16} />}
                                    {quizLoading ? 'Generating Quiz...' : 'Quick Quiz (Flip)'}
                                </button>
                                {references.length > 0 && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {references.length} references available below
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── BACK: Quiz ── */}
                        <div className="lesson-card-face lesson-card-back">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                                    🧠 Knowledge Check
                                </span>
                                <button
                                    onClick={() => setFlipped(false)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ marginLeft: 'auto', gap: 4 }}
                                >
                                    <RotateCw size={14} /> Back to Lesson
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    {answered ? "Quiz Results" : "Topic Quiz"}
                                </h3>
                                {answered && (
                                    <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(124,106,255,0.1)', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 700 }}>
                                        Score: {isCorrectOpt ? '100%' : 'Check Details'}
                                    </div>
                                )}
                            </div>

                            <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                                {quizLoading ? (
                                    <p style={{ color: 'var(--text-muted)' }}>Loading quiz content...</p>
                                ) : !answered ? (
                                    qObj && (
                                        <>
                                            <h4 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{qObj.questionText}</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {['A', 'B', 'C', 'D'].map((opt) => {
                                                    if (!qObj.options?.[opt]) return null;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            className="opt-btn"
                                                            disabled={submitLoading}
                                                            onClick={() => handleSelectOption(opt)}
                                                            style={{ marginBottom: 0 }}
                                                        >
                                                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, border: '1px solid var(--border-secondary)', flexShrink: 0 }}>
                                                                {opt}
                                                            </div>
                                                            <span>{qObj.options[opt]}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        {(quiz?.questions || quiz || []).map((q, idx) => (
                                            <div key={idx} style={{ paddingBottom: 16, borderBottom: idx === (quiz?.questions || quiz || []).length - 1 ? 'none' : '1px solid var(--border-secondary)' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{idx + 1}. {q.questionText}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                                    {['A', 'B', 'C', 'D'].map(o => q.options[o] && (
                                                        <div key={o} style={{
                                                            padding: '8px 12px', borderRadius: 8, fontSize: 13,
                                                            background: o === q.correctAnswer ? 'rgba(0,210,160,0.1)' : (idx === 0 && selectedOpt === o ? 'rgba(255,107,107,0.1)' : 'rgba(255,255,255,0.03)'),
                                                            border: `1px solid ${o === q.correctAnswer ? 'rgba(0,210,160,0.3)' : (idx === 0 && selectedOpt === o ? 'rgba(255,107,107,0.3)' : 'transparent')}`,
                                                            color: o === q.correctAnswer ? '#00d2a0' : (idx === 0 && selectedOpt === o ? '#ff6b6b' : 'var(--text-secondary)')
                                                        }}>
                                                            <strong>{o}:</strong> {q.options[o]}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 12, lineHeight: 1.5, background: 'rgba(124,106,255,0.05)', padding: 12, borderRadius: 8, color: 'var(--text-secondary)' }}>
                                                    <strong style={{ color: 'var(--accent-primary)' }}>Explanation:</strong> {q.explanation}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setFlipped(false)}
                                            className="btn btn-secondary"
                                            style={{ width: '100%', borderRadius: 24 }}
                                        >
                                            Return to Lesson
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* External References Section */}
            {!loading && references.length > 0 && (
                <div style={{ maxWidth: 760, margin: '40px auto 32px' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExternalLink size={20} color="var(--accent-primary)" /> Recommended Reading
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {references.map((ref, i) => (
                            <a
                                key={i}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="card"
                                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, transition: 'var(--transition)' }}
                            >
                                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, alignSelf: 'flex-start', background: 'rgba(124,106,255,0.15)', color: 'var(--accent-primary)' }}>
                                    {ref.type.toUpperCase()}
                                </span>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{ref.title}</div>
                                {ref.description && (
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {ref.description}
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
