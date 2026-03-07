import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Send, Brain, GraduationCap, RotateCw, CheckCircle, Trophy,
    Loader, ChevronRight, BookOpen, ExternalLink, Zap
} from 'lucide-react';
import api from '../lib/api';
import { useDoubt } from '../contexts/DoubtContext';

// ─── Injected styles ──────────────────────────────────────────────────────────
const STYLES = `
@keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
}
@keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}
@keyframes pulse-ring {
    0%   { transform: scale(0.92); opacity: .7; }
    70%  { transform: scale(1.08); opacity: 0;  }
    100% { transform: scale(0.92); opacity: 0;  }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes progressFill {
    from { width: 0%; }
    to   { width: var(--target-width); }
}
@keyframes bounceIn {
    0%   { transform: scale(0.3); opacity: 0; }
    50%  { transform: scale(1.08); }
    70%  { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
}
@keyframes typewriter {
    from { width: 0; }
    to   { width: 100%; }
}

/* Skeleton shimmer */
.skeleton {
    background: linear-gradient(90deg,
        var(--bg-card-hover) 25%,
        rgba(255,255,255,0.06) 50%,
        var(--bg-card-hover) 75%
    );
    background-size: 600px 100%;
    animation: shimmer 1.6s infinite linear;
    border-radius: 8px;
}

/* Flip card */
.db-scene { perspective: 1400px; width: 100%; }
.db-card {
    position: relative; width: 100%;
    transform-style: preserve-3d;
    transition: transform 0.75s cubic-bezier(0.4,0.2,0.2,1);
}
.db-card.flipped { transform: rotateY(180deg); }
.db-face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-secondary);
    box-shadow: 0 16px 56px rgba(0,0,0,0.25), 0 0 24px rgba(124,106,255,0.06);
    display: flex; flex-direction: column; overflow: hidden;
}
.db-front { position: relative; }
.db-back  { position: absolute; inset: 0; transform: rotateY(180deg); overflow-y: auto; padding: 32px; }

/* Quiz option button */
.opt-btn {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 15px 18px;
    border-radius: 12px; border: 1.5px solid var(--border-secondary);
    background: var(--bg-card-hover); color: var(--text-primary);
    font-size: 15px; cursor: pointer; text-align: left;
    transition: border-color 0.18s, background 0.18s, transform 0.12s;
    margin-bottom: 10px; animation: fadeSlideUp 0.25s ease both;
}
.opt-btn:hover:not(:disabled) {
    border-color: var(--accent-primary);
    background: rgba(124,106,255,0.09);
    transform: translateX(3px);
}
.opt-btn.selected { border-color: var(--accent-primary); background: rgba(124,106,255,0.13); }
.opt-btn.correct  { border-color: #00d2a0; background: rgba(0,210,160,0.13); color: #00d2a0; }
.opt-btn.wrong    { border-color: #ff6b6b; background: rgba(255,107,107,0.10); color: #ff6b6b; }

/* Markdown content */
.md-content { font-size: 15px; line-height: 1.75; color: var(--text-primary); animation: fadeIn 0.4s ease; }
.md-content h1 { font-size: 24px; font-weight: 800; margin: 28px 0 12px; color: var(--text-primary); }
.md-content h2 { font-size: 20px; font-weight: 700; margin: 24px 0 10px; color: var(--text-primary); }
.md-content h3 { font-size: 17px; font-weight: 700; margin: 20px 0 8px; color: var(--accent-primary); }
.md-content h4 { font-size: 15px; font-weight: 700; margin: 16px 0 6px; color: var(--accent-primary); opacity: 0.85; }
.md-content h5 { font-size: 14px; font-weight: 600; margin: 14px 0 4px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.md-content h6 { font-size: 13px; font-weight: 600; margin: 12px 0 4px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.md-content p  { margin: 0 0 12px; }
.md-content strong { color: var(--accent-primary); font-weight: 700; }
.md-content em { font-style: italic; color: var(--text-secondary); }
.md-content ul, .md-content ol { margin: 8px 0 12px 0; padding-left: 0; list-style: none; }
.md-content li {
    display: flex; gap: 10px; align-items: flex-start;
    margin-bottom: 8px; padding: 8px 12px;
    background: var(--bg-card-hover); border-radius: 8px;
    border-left: 3px solid var(--accent-primary);
    animation: fadeSlideUp 0.3s ease both;
}
.md-content li::before { content: '▸'; color: var(--accent-primary); flex-shrink: 0; margin-top: 1px; }
.md-content code {
    background: rgba(124,106,255,0.12); color: var(--accent-primary);
    padding: 2px 7px; border-radius: 5px; font-size: 13px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.md-content pre {
    background: rgba(0,0,0,0.3); border: 1px solid var(--border-secondary);
    border-radius: 10px; padding: 16px; overflow-x: auto; margin: 12px 0;
}
.md-content pre code { background: none; padding: 0; }
.md-content blockquote {
    border-left: 4px solid var(--accent-primary);
    margin: 12px 0; padding: 10px 16px;
    background: rgba(124,106,255,0.07); border-radius: 0 8px 8px 0;
    color: var(--text-secondary); font-style: italic;
}
.md-content hr { border: none; border-top: 1px solid var(--border-secondary); margin: 20px 0; }
.md-content a { color: var(--accent-primary); text-decoration: underline; }
.md-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
.md-content th { background: rgba(124,106,255,0.15); padding: 10px 14px; text-align: left; font-weight: 700; }
.md-content td { padding: 9px 14px; border-bottom: 1px solid var(--border-secondary); }

/* Tab active indicator */
.db-tab {
    background: none; border: none; padding: 16px 4px; font-size: 14px;
    font-weight: 600; cursor: pointer; transition: color 0.2s;
    border-bottom: 2px solid transparent; white-space: nowrap;
    position: relative;
}
.db-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
.db-tab:not(.active) { color: var(--text-secondary); }
.db-tab:not(.active):hover { color: var(--text-primary); }

/* Score bounce */
.score-bounce { animation: bounceIn 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both; }
`;

// ─── Markdown Parser ──────────────────────────────────────────────────────────
function parseMarkdown(text) {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    let listBuffer = [];
    let listType = null;
    let keyCounter = 0;
    const key = () => keyCounter++;

    function flushList() {
        if (!listBuffer.length) return;
        const Tag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
            <Tag key={key()} className={listType === 'ol' ? 'md-content' : undefined}
                style={listType === 'ol' ? { paddingLeft: 0, listStyle: 'none' } : undefined}>
                {listBuffer.map((item, idx) => (
                    <li key={idx} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <span>{inlineFormat(item)}</span>
                    </li>
                ))}
            </Tag>
        );
        listBuffer = [];
        listType = null;
    }

    function inlineFormat(str) {
        // Bold, italic, inline code, links
        const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
                return <em key={idx}>{part.slice(1, -1)}</em>;
            if (part.startsWith('`') && part.endsWith('`'))
                return <code key={idx}>{part.slice(1, -1)}</code>;
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch)
                return <a key={idx} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
            return part;
        });
    }

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Headings
        if (/^#{1,6} /.test(trimmed)) {
            flushList();
            const level = trimmed.match(/^(#+)/)[1].length;
            const content = trimmed.replace(/^#+\s/, '');
            const Tag = `h${level}`;
            elements.push(<Tag key={key()}>{inlineFormat(content)}</Tag>);
            i++; continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(trimmed)) {
            flushList();
            elements.push(<hr key={key()} />);
            i++; continue;
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
            flushList();
            elements.push(<blockquote key={key()}>{inlineFormat(trimmed.slice(2))}</blockquote>);
            i++; continue;
        }

        // Code block
        if (trimmed.startsWith('```')) {
            flushList();
            const lang = trimmed.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={key()}>
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
            i++; continue;
        }

        // Unordered list
        if (/^[-*+] /.test(trimmed)) {
            if (listType !== 'ul') { flushList(); listType = 'ul'; }
            listBuffer.push(trimmed.replace(/^[-*+] /, ''));
            i++; continue;
        }

        // Ordered list
        if (/^\d+\. /.test(trimmed)) {
            if (listType !== 'ol') { flushList(); listType = 'ol'; }
            listBuffer.push(trimmed.replace(/^\d+\. /, ''));
            i++; continue;
        }

        // Empty line
        if (trimmed === '') {
            flushList();
            elements.push(<div key={key()} style={{ height: 8 }} />);
            i++; continue;
        }

        // Paragraph
        flushList();
        elements.push(<p key={key()}>{inlineFormat(trimmed)}</p>);
        i++;
    }

    flushList();
    return <div className="md-content">{elements}</div>;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ContentSkeleton() {
    return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[100, 85, 92, 70, 88, 60, 95, 75].map((w, i) => (
                <div key={i} className="skeleton"
                    style={{ height: 16, width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
            ))}
            <div style={{ height: 12 }} />
            {[78, 65, 90, 55].map((w, i) => (
                <div key={i + 10} className="skeleton"
                    style={{ height: 16, width: `${w}%`, animationDelay: `${(i + 8) * 0.08}s` }} />
            ))}
        </div>
    );
}

// ─── Quiz loading overlay ─────────────────────────────────────────────────────
function QuizLoadingOverlay() {
    const [dot, setDot] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setDot(d => (d + 1) % 4), 420);
        return () => clearInterval(t);
    }, []);
    return (
        <div style={{
            position: 'absolute', inset: 0, background: 'var(--bg-card)',
            zIndex: 20, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', borderRadius: 20,
            animation: 'fadeIn 0.2s ease',
        }}>
            {/* Pulsing brain icon */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
                <div style={{
                    position: 'absolute', inset: -12,
                    borderRadius: '50%', background: 'rgba(124,106,255,0.18)',
                    animation: 'pulse-ring 1.4s ease-out infinite',
                }} />
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 32px rgba(124,106,255,0.45)',
                }}>
                    <Brain size={32} color="#fff" />
                </div>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
                Crafting your quiz{'.'.repeat(dot)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                AI is building contextual questions
            </p>
            {/* Mini progress bar */}
            <div style={{
                marginTop: 28, width: 200, height: 4,
                background: 'var(--bg-card-hover)', borderRadius: 4, overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'var(--gradient-primary)',
                    animation: 'shimmer 1.4s infinite linear',
                    backgroundSize: '400px 100%',
                    backgroundImage: 'linear-gradient(90deg, var(--accent-primary) 0%, rgba(124,106,255,0.3) 50%, var(--accent-primary) 100%)',
                }} />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const { setCurrentTopicId: setDoubtTopicId, setCurrentTopicTitle: setDoubtTopicTitle } = useDoubt();

    const [explanation, setExplanation]   = useState(null);
    const [simplified, setSimplified]     = useState(null);
    const [references, setReferences]     = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeTab, setActiveTab]       = useState('explain');
    const [currentTopicId, setCurrentTopicId] = useState(null);

    const [flipped, setFlipped]           = useState(false);
    const [quiz, setQuiz]                 = useState(null);
    const [quizLoading, setQuizLoading]   = useState(false);

    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers]           = useState({});
    const [submitted, setSubmitted]       = useState(false);
    const [quizScore, setQuizScore]       = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [allPlans, setAllPlans]         = useState([]);

    // Inject styles once
    useEffect(() => {
        if (!document.getElementById('db-styles')) {
            const s = document.createElement('style');
            s.id = 'db-styles';
            s.textContent = STYLES;
            document.head.appendChild(s);
        }
        loadCurrentTopic();
    }, []);

    async function loadCurrentTopic() {
        try {
            const res = await api.getPlans();
            const plans = res.plans || [];
            setAllPlans(plans);
            if (plans.length > 0) {
                const sorted = [...plans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const active = sorted[0];
                if (active.days) {
                    for (const day of active.days) {
                        const incomplete = day.topics?.find(t => !t.completed);
                        if (incomplete) {
                            setCurrentTopicId(incomplete.topicId);
                            setDoubtTopicId(incomplete.topicId);
                            setDoubtTopicTitle(incomplete.title);
                            // Reset cached content when topic changes
                            setExplanation(null);
                            setSimplified(null);
                            setReferences(null);
                            fetchContent(incomplete.topicId, 'explain');
                            return;
                        }
                    }
                }
            }
        } catch { /* ignore */ }
    }

    async function fetchContent(topicId, tab) {
        setContentLoading(true);
        try {
            if (tab === 'explain') {
                const res = await api.getExplanation(topicId);
                setExplanation(res.content);
            } else if (tab === 'simplify') {
                const res = await api.getSimplified(topicId);
                setSimplified(res.content);
            } else if (tab === 'references') {
                const res = await api.getReferences(topicId);
                setReferences(res.references || res.content || []);
            }
        } catch {
            toast.error('Failed to load content.');
        } finally {
            setContentLoading(false);
        }
    }

    function handleTabSwitch(tab) {
        if (!currentTopicId || contentLoading || tab === activeTab) return;
        setActiveTab(tab);
        // Use cache if already loaded
        const cached = tab === 'explain' ? explanation : tab === 'simplify' ? simplified : references;
        if (!cached) fetchContent(currentTopicId, tab);
    }

    async function handleTakeQuiz() {
        if (!currentTopicId) {
            toast.error('No active topic found.');
            return;
        }
        setQuizLoading(true);
        try {
            const res = await api.generateTopicQuiz(currentTopicId);
            setQuiz(res.quiz || res);
            setFlipped(true);
        } catch {
            toast.error('Could not load quiz for this topic');
        } finally {
            setQuizLoading(false);
        }
    }

    function selectAnswer(opt) {
        if (submitted) return;
        const qs = quiz.questions || quiz;
        const qObj = qs[currentQIndex];
        const qId = qObj.questionId || `q${currentQIndex}`;
        setAnswers(prev => ({ ...prev, [qId]: opt }));
        if (currentQIndex < qs.length - 1) {
            setTimeout(() => setCurrentQIndex(c => c + 1), 320);
        }
    }

    async function submitQuiz() {
        const qs = quiz.questions || quiz;
        if (Object.keys(answers).length < qs.length) {
            toast.error('Please answer all questions');
            return;
        }
        setSubmitLoading(true);
        try {
            const res = await api.submitQuiz(quiz.quizId, answers);
            setQuizScore(res.score);
            setSubmitted(true);
            if (res.score >= 70 && currentTopicId) {
                await api.markComplete(currentTopicId);
                toast.success('Topic completed automatically! 🎉');
                setTimeout(() => { resetToCoach(); loadCurrentTopic(); }, 1800);
            }
        } catch {
            // Local fallback
            let correct = 0;
            qs.forEach((qObj, idx) => {
                const id = qObj.questionId || `q${idx}`;
                if (answers[id] === qObj.correctAnswer) correct++;
            });
            const localScore = Math.round((correct / qs.length) * 100);
            setQuizScore(localScore);
            setSubmitted(true);
            if (localScore >= 70 && currentTopicId) {
                try {
                    await api.markComplete(currentTopicId);
                    toast.success('Topic completed! 🎉');
                    setTimeout(() => { resetToCoach(); loadCurrentTopic(); }, 1800);
                } catch { /* ignore */ }
            }
        } finally {
            setSubmitLoading(false);
        }
    }

    function resetToCoach() {
        setFlipped(false);
        setQuiz(null);
        setAnswers({});
        setSubmitted(false);
        setQuizScore(null);
        setCurrentQIndex(0);
    }

    const qs = quiz ? (quiz.questions || quiz) : [];
    const qObj = qs[currentQIndex];
    const qId = qObj?.questionId || `q${currentQIndex}`;
    const selectedOpt = answers[qId];
    const allAnswered = qs.length > 0 && Object.keys(answers).length === qs.length;

    const currentContent = activeTab === 'explain' ? explanation
        : activeTab === 'simplify' ? simplified : null;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 32, paddingTop: 16 }}>

            {/* Empty state */}
            {allPlans.length === 0 && !contentLoading && (
                <div style={{
                    padding: 48, textAlign: 'center',
                    background: 'var(--bg-card)', border: '1px dashed var(--accent-primary)',
                    borderRadius: 20, marginBottom: 32, width: '100%', maxWidth: 800,
                    animation: 'fadeSlideUp 0.4s ease',
                }}>
                    <BookOpen size={48} color="var(--accent-primary)" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Start Your Learning Journey</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '12px auto 24px', maxWidth: 460 }}>
                        Create your first study plan to begin learning with your AI tutor.
                    </p>
                    <button onClick={() => navigate('/plan')} className="btn btn-primary"
                        style={{ padding: '12px 32px', borderRadius: 24 }}>
                        Generate Study Plan
                    </button>
                </div>
            )}

            {/* 3D Flip Card */}
            {allPlans.length > 0 && (
                <div className="db-scene" style={{ maxWidth: 800 }}>
                    <div className={`db-card ${flipped ? 'flipped' : ''}`}
                        style={{ minHeight: 560 }}>

                        {/* ── FRONT: AI Coach ── */}
                        <div className="db-face db-front">

                            {/* Header */}
                            <div style={{
                                padding: '20px 24px 16px',
                                borderBottom: '1px solid var(--border-secondary)',
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <div style={{
                                    width: 42, height: 42,
                                    background: 'var(--gradient-primary)',
                                    borderRadius: 12, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 16px rgba(124,106,255,0.35)',
                                }}>
                                    <GraduationCap size={20} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>AI Learning Coach</h2>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                                        Your personalized study guide
                                    </p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{
                                display: 'flex', gap: 24, padding: '0 24px',
                                borderBottom: '1px solid var(--border-secondary)',
                                overflowX: 'auto',
                            }}>
                                {[
                                    { id: 'explain',    label: '📖 Explanation' },
                                    { id: 'simplify',   label: '✨ Simplified'  },
                                    { id: 'references', label: '🔗 Resources'   },
                                ].map(tab => (
                                    <button key={tab.id}
                                        className={`db-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => handleTabSwitch(tab.id)}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, overflowY: 'auto', minHeight: 340, position: 'relative' }}>
                                {quizLoading && <QuizLoadingOverlay />}

                                {contentLoading ? (
                                    <ContentSkeleton />
                                ) : activeTab === 'references' ? (
                                    <ReferencesPanel references={references} />
                                ) : currentContent ? (
                                    <div style={{ padding: '20px 24px', animation: 'fadeSlideUp 0.35s ease' }}>
                                        {parseMarkdown(currentContent)}
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        height: 280, color: 'var(--text-muted)', gap: 12,
                                    }}>
                                        <Brain size={36} style={{ opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: 14 }}>No active topic — you might be all caught up!</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer actions */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid var(--border-secondary)',
                                background: 'var(--bg-card)', display: 'flex',
                                justifyContent: 'center',
                            }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleTakeQuiz}
                                    disabled={quizLoading || !currentTopicId}
                                    style={{ padding: '11px 28px', borderRadius: 22, gap: 8, fontSize: 15 }}
                                >
                                    {quizLoading
                                        ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                                        : <><Zap size={16} /> Take Knowledge Quiz</>}
                                </button>
                            </div>
                        </div>

                        {/* ── BACK: Quiz ── */}
                        <div className="db-face db-back">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                                    🧠 Topic Quiz
                                </span>
                                <button onClick={resetToCoach} className="btn btn-ghost btn-sm"
                                    style={{ marginLeft: 'auto', gap: 6 }}>
                                    <RotateCw size={13} /> Back
                                </button>
                            </div>

                            {submitted && quizScore !== null ? (
                                // Score screen
                                <div style={{ textAlign: 'center', paddingTop: 32 }}>
                                    <div className="score-bounce">
                                        <Trophy size={56}
                                            color={quizScore >= 70 ? '#00d2a0' : '#ffb347'}
                                            style={{ margin: '0 auto 16px' }} />
                                        <div style={{
                                            fontSize: 72, fontWeight: 900, lineHeight: 1,
                                            color: quizScore >= 70 ? '#00d2a0' : '#ffb347',
                                        }}>
                                            {quizScore}%
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: 22, marginTop: 16 }}>
                                        {quizScore >= 70 ? 'Topic Mastered! 🎉' : 'Keep Reviewing 📚'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
                                        {quizScore >= 70
                                            ? 'Automatically marked complete. Moving to next topic...'
                                            : 'Review the explanation and try again when ready.'}
                                    </p>
                                    <button className="btn btn-primary" onClick={resetToCoach}
                                        style={{ marginTop: 28, borderRadius: 20, padding: '11px 28px' }}>
                                        Continue Learning
                                    </button>
                                </div>
                            ) : qObj ? (
                                <>
                                    {/* Progress */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                        <span>Question {currentQIndex + 1} / {qs.length}</span>
                                        <span>{Object.keys(answers).length} answered</span>
                                    </div>
                                    <div style={{ height: 5, background: 'var(--bg-card-hover)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: 'var(--gradient-primary)',
                                            width: `${(Object.keys(answers).length / qs.length) * 100}%`,
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>

                                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.55, marginBottom: 22 }}>
                                        {qObj.questionText}
                                    </h3>

                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        if (!qObj.options?.[opt]) return null;
                                        const isSelected = selectedOpt === opt;
                                        return (
                                            <button key={opt}
                                                onClick={() => selectAnswer(opt)}
                                                className={`opt-btn ${isSelected ? 'selected' : ''}`}
                                                style={{ animationDelay: `${['A','B','C','D'].indexOf(opt) * 0.07}s` }}
                                            >
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                                    background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                                    border: isSelected ? 'none' : '1px solid var(--border-secondary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 800,
                                                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                                                }}>
                                                    {opt}
                                                </div>
                                                <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 500 }}>
                                                    {qObj.options[opt]}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
                                        <button className="btn btn-secondary"
                                            onClick={() => setCurrentQIndex(c => Math.max(0, c - 1))}
                                            disabled={currentQIndex === 0}>
                                            Previous
                                        </button>
                                        {currentQIndex < qs.length - 1 ? (
                                            <button className="btn btn-primary"
                                                onClick={() => setCurrentQIndex(c => c + 1)}
                                                style={{ gap: 6 }}>
                                                Next <ChevronRight size={14} />
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary"
                                                onClick={submitQuiz}
                                                disabled={!allAnswered || submitLoading}
                                                style={{ gap: 6 }}>
                                                {submitLoading
                                                    ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                                    : <><CheckCircle size={14} /> Submit</>}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                                    <Loader size={32} color="var(--accent-primary)"
                                        style={{ animation: 'spin 0.8s linear infinite' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── References Panel ─────────────────────────────────────────────────────────
function ReferencesPanel({ references }) {
    if (!references) {
        return (
            <div style={{ padding: 24 }}>
                <ContentSkeleton />
            </div>
        );
    }

    if (typeof references === 'string') {
        return (
            <div style={{ padding: '20px 24px', animation: 'fadeSlideUp 0.35s ease' }}>
                {parseMarkdown(references)}
            </div>
        );
    }

    if (Array.isArray(references) && references.length > 0) {
        return (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {references.map((ref, idx) => (
                    <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', background: 'var(--bg-card-hover)',
                            borderRadius: 12, border: '1px solid var(--border-secondary)',
                            textDecoration: 'none', transition: 'border-color 0.2s, transform 0.15s',
                            animation: `fadeSlideUp 0.3s ease ${idx * 0.06}s both`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-secondary)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: 'rgba(124,106,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ExternalLink size={16} color="var(--accent-primary)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 2 }}>
                                {ref.title || new URL(ref.url).hostname}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ref.url}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 14 }}>
            No resources found for this topic.
        </div>
    );
}
