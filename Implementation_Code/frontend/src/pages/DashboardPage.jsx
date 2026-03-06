import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Send, Sparkles, Brain, GraduationCap, RotateCw, CheckCircle, Trophy, Loader, ChevronRight, BookOpen, XCircle
} from 'lucide-react';
import api from '../lib/api';
import { useDoubt } from '../contexts/DoubtContext';

const FLIP_STYLE = `
.dashboard-scene { perspective: 1200px; width: 100%; max-width: 800px; margin: 0 auto; flex: 1; display: flex; flex-direction: column; min-height: 0; }
.dashboard-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    display: flex;
    flex-direction: column;
}
.dashboard-card.flipped { transform: rotateY(180deg); }
.dashboard-face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-secondary);
    box-shadow: 0 12px 48px rgba(0,0,0,0.2), 0 0 20px rgba(124,106,255,0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
}
.dashboard-front {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
}
.dashboard-back {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    transform: rotateY(180deg);
    padding: 36px;
    overflow-y: auto;
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
.opt-btn.correct { border-color: #00d2a0; background: rgba(0,210,160,0.12); color: #00d2a0; }
.opt-btn.wrong { border-color: #ff6b6b; background: rgba(255,107,107,0.1); color: #ff6b6b; }

.floating-doubt {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--gradient-primary);
    color: white;
    display: flex; justify-content: center; align-items: center;
    box-shadow: 0 8px 30px rgba(124,106,255,0.4);
    cursor: pointer;
    z-index: 1000;
    transition: transform 0.2s ease;
}
.floating-doubt:hover { transform: scale(1.1); }
`;

export default function DashboardPage() {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const { setCurrentTopicId: setDoubtTopicId, setCurrentTopicTitle: setDoubtTopicTitle } = useDoubt();

    // AI Coach Content
    const [explanation, setExplanation] = useState(null);
    const [simplified, setSimplified] = useState(null);
    const [references, setReferences] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('explain'); // 'explain', 'simplify', 'references'
    const [currentTopicId, setCurrentTopicId] = useState(null);

    // Quiz Flip logic
    const [flipped, setFlipped] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);

    // Quiz answering
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [allPlans, setAllPlans] = useState([]);

    useEffect(() => {
        // inject styles
        const el = document.getElementById('dashboard-flip-style');
        if (!el) {
            const style = document.createElement('style');
            style.id = 'dashboard-flip-style';
            style.textContent = FLIP_STYLE;
            document.head.appendChild(style);
        }

        loadCurrentTopic();
    }, []);

    async function loadCurrentTopic() {
        try {
            const res = await api.getPlans();
            const plans = res.plans || [];
            setAllPlans(plans);
            if (plans.length > 0) {
                // Sort plans from newest to oldest
                const sortedPlans = plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const active = sortedPlans[0];
                if (active.days) {
                    for (const day of active.days) {
                        const incomplete = day.topics?.find(t => !t.completed);
                        if (incomplete) {
                            setCurrentTopicId(incomplete.topicId);
                            setDoubtTopicId(incomplete.topicId);
                            setDoubtTopicTitle(incomplete.title);
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
            if (tab === 'explain' && !explanation) {
                const res = await api.getExplanation(topicId);
                setExplanation(res.content);
            } else if (tab === 'simplify' && !simplified) {
                const res = await api.getSimplified(topicId);
                setSimplified(res.content);
            } else if (tab === 'references' && !references) {
                const res = await api.getReferences(topicId);
                setReferences(res.references || res.content || []);
            }
        } catch (err) {
            toast.error("Failed to load content.");
        } finally {
            setContentLoading(false);
        }
    }

    function handleTabSwitch(tab) {
        if (!currentTopicId || contentLoading || tab === activeTab) return;
        setActiveTab(tab);
        fetchContent(currentTopicId, tab);
    }

    // Quiz functions
    async function handleTakeQuiz() {
        console.log("handleTakeQuiz triggered for topic:", currentTopicId);
        if (!currentTopicId) {
            toast.error("No active topic found in your study plan to quiz on.");
            return;
        }

        setQuizLoading(true);

        try {
            console.log("Calling api.generateTopicQuiz...");
            const res = await api.generateTopicQuiz(currentTopicId);
            console.log("Quiz API Response:", res);
            setQuiz(res.quiz || res);
            setFlipped(true); // Flip over!
        } catch (err) {
            console.error("Quiz API Error:", err);
            toast.error('Could not load quiz for the current topic');
        } finally {
            setQuizLoading(false);
        }
    }

    function selectAnswer(opt) {
        if (submitted) return;
        const qs = quiz.questions || quiz;
        const qObj = qs[currentQIndex];
        const qId = qObj.questionId || `q${currentQIndex} `;

        setAnswers(prev => ({ ...prev, [qId]: opt }));

        if (currentQIndex < qs.length - 1) {
            setTimeout(() => setCurrentQIndex(c => c + 1), 350);
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
                toast.success('Topic completed automatically!');
                // Automatically move to next topic after a short delay to let user see score
                setTimeout(() => {
                    resetToCoach();
                    loadCurrentTopic();
                }, 1500);
            }
        } catch {
            // Local fallback calculation if API fails
            let correct = 0;
            qs.forEach((qObj, idx) => {
                const id = qObj.questionId || `q${idx} `;
                if (answers[id] === qObj.correctAnswer) correct++;
            });
            const localScore = Math.round((correct / qs.length) * 100);
            setQuizScore(localScore);
            setSubmitted(true);

            if (localScore >= 70 && currentTopicId) {
                try {
                    await api.markComplete(currentTopicId);
                    toast.success('Topic completed automatically!');
                    setTimeout(() => {
                        resetToCoach();
                        loadCurrentTopic();
                    }, 1500);
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
        // reload the new current topic in case it was marked done
        loadCurrentTopic();
    }

    // Prepare quiz vars
    const qs = quiz ? (quiz.questions || quiz) : [];
    const qObj = qs[currentQIndex];
    const qId = qObj?.questionId || `q${currentQIndex} `;
    const selectedOpt = answers[qId];
    const allAnswered = qs.length > 0 && Object.keys(answers).length === qs.length;

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingBottom: 24, paddingTop: 16 }}>

            {allPlans.length === 0 && !contentLoading && (
                <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--accent-primary)', borderRadius: 20, marginBottom: 32, width: '100%', maxWidth: 800 }}>
                    <BookOpen size={48} color="var(--accent-primary)" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Start Your Learning Journey</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '12px auto 24px', maxWidth: 460 }}>
                        Create your first study plan to begin learning with your AI tutor.
                    </p>
                    <button onClick={() => navigate('/plan')} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 24 }}>
                        Generate Study Plan
                    </button>
                </div>
            )}

            {/* 3D Flip Container wrapper */}
            <div className="dashboard-scene" style={{ width: '100%', maxWidth: 800, flex: 1, position: 'relative', perspective: 1200, display: allPlans.length > 0 ? 'block' : 'none' }}>
                <div className={`dashboard-card ${flipped ? 'flipped' : ''}`} style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1)' }}>

                    {/* FRONT: AI Coach */}
                    <div className="dashboard-face dashboard-front">
                        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GraduationCap size={20} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Learning Coach</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Your personalized study guide</p>
                            </div>
                        </div>

                        {/* Tabs Container */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-secondary)', padding: '0 24px', gap: 24, overflowX: 'auto' }}>
                            <button onClick={() => handleTabSwitch('explain')} style={{ background: 'none', border: 'none', color: activeTab === 'explain' ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '16px 0', fontSize: 14, fontWeight: 600, borderBottom: activeTab === 'explain' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
                                Detailed Explanation
                            </button>
                            <button onClick={() => handleTabSwitch('simplify')} style={{ background: 'none', border: 'none', color: activeTab === 'simplify' ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '16px 0', fontSize: 14, fontWeight: 600, borderBottom: activeTab === 'simplify' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
                                Simplified Concept
                            </button>
                            <button onClick={() => handleTabSwitch('references')} style={{ background: 'none', border: 'none', color: activeTab === 'references' ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '16px 0', fontSize: 14, fontWeight: 600, borderBottom: activeTab === 'references' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
                                Resources & Links
                            </button>
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                            {quizLoading && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'var(--bg-card)',
                                    zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', borderRadius: '12px'
                                }}>
                                    <Loader className="spin" size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
                                    <h3 style={{ margin: 0, fontSize: 18 }}>Generating Contextual Quiz...</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>AI is preparing contextual questions.</p>
                                </div>
                            )}

                            {contentLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                    <Loader className="spin" size={32} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
                                    <p>Analyzing topic & preparing content...</p>
                                </div>
                            ) : (!explanation && !simplified && !references) ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
                                    No active topic. You might be all caught up!
                                </div>
                            ) : (
                                <div style={{
                                    padding: '20px 24px', borderRadius: '12px',
                                    background: 'var(--bg-card-hover)',
                                    color: 'var(--text-primary)', border: '1px solid var(--border-secondary)',
                                    fontSize: 15, lineHeight: 1.6
                                }}>
                                    {activeTab === 'references' && references ? (
                                        typeof references === 'string' ? (
                                            <div>{references}</div>
                                        ) : Array.isArray(references) && references.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {references.map((ref, idx) => (
                                                    <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-secondary)', textDecoration: 'none' }}>
                                                        <h4 style={{ margin: '0 0 4px', color: 'var(--accent-primary)', fontSize: 15 }}>{ref.title || new URL(ref.url).hostname}</h4>
                                                        <span style={{ fontSize: 13, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{ref.url}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>No resources specifically generated for this topic yet. Ask the Doubt Clarifier!</div>
                                        )
                                    ) : (activeTab === 'simplify' ? simplified : explanation)?.split('\n').map((line, j) => {
                                        if (line === '') return <div key={j} style={{ height: 12 }} />;

                                        // Handle Markdown headings
                                        if (line.startsWith('### ')) {
                                            return <h3 key={j} style={{ marginTop: 24, marginBottom: 12, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{line.replace('### ', '')}</h3>;
                                        }
                                        if (line.startsWith('## ')) {
                                            return <h2 key={j} style={{ marginTop: 24, marginBottom: 12, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{line.replace('## ', '')}</h2>;
                                        }
                                        if (line.startsWith('# ')) {
                                            return <h1 key={j} style={{ marginTop: 24, marginBottom: 16, fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>{line.replace('# ', '')}</h1>;
                                        }

                                        // Handle list items
                                        const isList = line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim());

                                        const parsedLine = line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                                            part.startsWith('**') && part.endsWith('**') ? <strong key={k} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong> : part
                                        );

                                        if (isList) {
                                            return <div key={j} style={{ display: 'flex', marginBottom: 8, paddingLeft: 16 }}>
                                                <span style={{ marginRight: 8 }}>•</span>
                                                <span>{parsedLine.map((p, k) => typeof p === 'string' ? p.replace(/^-\s|^\d+\.\s/, '') : p)}</span>
                                            </div>;
                                        }

                                        return <p key={j} style={{ margin: '0 0 8px 0' }}>{parsedLine}</p>;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Fast Actions */}
                        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-secondary)', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                <button className="btn btn-primary btn-sm" onClick={handleTakeQuiz} disabled={quizLoading || !currentTopicId} style={{ gap: 6, margin: '0 auto', fontSize: 15, padding: '10px 24px', borderRadius: 20 }}>
                                    {quizLoading ? <Loader size={16} className="spin" /> : '🎯'} Take Knowledge Quiz
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BACK: Quiz Interface */}
                    <div className="dashboard-face dashboard-back">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                                🧠 Topic Quiz
                            </span>
                            <button onClick={resetToCoach} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', gap: 4 }}>
                                <RotateCw size={14} /> Back to Coach
                            </button>
                        </div>

                        {submitted && quizScore !== null ? (
                            <div style={{ textAlign: 'center', marginTop: 40 }}>
                                <Trophy size={56} color={quizScore >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)'} style={{ margin: '0 auto 16px' }} />
                                <div style={{ fontSize: 64, fontWeight: 900, color: quizScore >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{quizScore}%</div>
                                <h3 style={{ fontSize: 24, marginTop: 12 }}>
                                    {quizScore >= 70 ? 'Topic Mastered! 🎉' : 'Needs more review'}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                                    {quizScore >= 70 ? 'The system has automatically marked this topic as complete.' : 'Ask the AI coach to explain concepts you missed before retrying.'}
                                </p>
                                <button className="btn btn-primary" onClick={resetToCoach} style={{ marginTop: 32 }}>
                                    Continue Learning
                                </button>
                            </div>
                        ) : qObj ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    <span>Question {currentQIndex + 1} of {qs.length}</span>
                                    <span>{Object.keys(answers).length} answered</span>
                                </div>

                                <div className="progress-bar-track" style={{ marginBottom: 32, background: 'var(--bg-card-hover)', height: 6, borderRadius: 10, overflow: 'hidden' }}>
                                    <div className="progress-bar-fill" style={{ width: `${(Object.keys(answers).length / qs.length) * 100}% `, background: 'var(--gradient-primary)', height: '100%', transition: 'width 0.3s ease' }} />
                                </div>

                                <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 24 }}>
                                    {qObj.questionText}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        if (!qObj.options?.[opt]) return null;
                                        const isSelected = selectedOpt === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => selectAnswer(opt)}
                                                className="opt-btn"
                                                style={{
                                                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                                    background: isSelected ? 'rgba(108,99,255,0.1)' : 'var(--bg-card-hover)'
                                                }}
                                            >
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, border: isSelected ? 'none' : '1px solid var(--border-secondary)', color: isSelected ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                                                    {opt}
                                                </div>
                                                <span style={{ fontSize: 15, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 500 }}>
                                                    {qObj.options[opt]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 32 }}>
                                    <button className="btn btn-secondary" onClick={() => setCurrentQIndex(c => Math.max(0, c - 1))} disabled={currentQIndex === 0}>Previous</button>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {currentQIndex < qs.length - 1 ? (
                                            <button className="btn btn-primary" onClick={() => setCurrentQIndex(c => c + 1)} style={{ gap: 4 }}>
                                                Next <ChevronRight size={14} />
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={submitQuiz} style={{ gap: 4 }} disabled={!allAnswered || submitLoading}>
                                                {submitLoading ? <Loader size={14} className="spin" /> : 'Submit Quiz'}
                                                {!submitLoading && <CheckCircle size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 100 }}>Loading quiz content...</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
