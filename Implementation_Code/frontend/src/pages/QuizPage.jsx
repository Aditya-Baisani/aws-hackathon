import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Brain, CheckCircle, X, RotateCcw, Trophy, ArrowRight, Loader, RefreshCw } from 'lucide-react';
import api from '../lib/api';

function QuizResult({ quizData, answers, score, onRetry }) {
    const isGood = score >= 80;

    return (
        <div className="animate-fade-in-up" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="card" style={{
                textAlign: 'center', marginBottom: 32, padding: '48px 32px',
                background: isGood ? 'linear-gradient(135deg, rgba(0,210,160,0.1), rgba(0,210,160,0.02))' : 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,107,107,0.02))',
                border: `1px solid ${isGood ? 'rgba(0,210,160,0.3)' : 'rgba(255,107,107,0.3)'}`,
                borderRadius: 24
            }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: isGood ? 'rgba(0,210,160,0.1)' : 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `2px solid ${isGood ? '#00d2a0' : '#ff6b6b'}` }}>
                    {isGood ? <Trophy size={40} color="#00d2a0" /> : <RefreshCw size={40} color="#ff6b6b" />}
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, background: 'var(--text-primary)', WebkitBackgroundClip: 'text', color: 'var(--text-primary)' }}>{score}% Score</h2>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 500 }}>
                    {isGood ? 'Excellent mastery of the topics! 🎉' : 'Keep practicing to master these concepts.'}
                </p>
                <button className="btn btn-primary" style={{ borderRadius: 12, padding: '12px 32px' }} onClick={onRetry}>
                    Try Another Quiz
                </button>
            </div>

            {quizData.map((q, idx) => {
                const qId = q.questionId || `q${idx}`;
                const userAns = answers[qId];
                const isCorrect = userAns === q.correctAnswer;

                return (
                    <div key={qId} className="card" style={{ marginBottom: 12, border: `1px solid ${isCorrect ? 'rgba(0,210,160,0.2)' : 'rgba(255,107,107,0.2)'}` }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                            {isCorrect ? <CheckCircle size={16} color="var(--accent-green)" /> : <X size={16} color="#ff6b6b" />}
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{q.questionText}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {['A', 'B', 'C', 'D'].map((opt) => {
                                if (!q.options?.[opt]) return null;
                                return (
                                    <div key={opt} style={{
                                        padding: '8px 12px', borderRadius: 8, fontSize: 13,
                                        background: opt === q.correctAnswer ? 'rgba(0,210,160,0.1)' : opt === userAns && !isCorrect ? 'rgba(255,107,107,0.1)' : 'var(--bg-card-hover)',
                                        border: `1px solid ${opt === q.correctAnswer ? 'rgba(0,210,160,0.2)' : 'var(--border-secondary)'}`,
                                        color: opt === q.correctAnswer ? 'var(--accent-green)' : opt === userAns && !isCorrect ? '#ff6b6b' : 'var(--text-secondary)'
                                    }}>
                                        <strong>{opt}.</strong> {q.options[opt]}
                                    </div>
                                );
                            })}
                        </div>
                        {q.explanation && (
                            <div style={{ padding: '10px 12px', background: 'rgba(108,99,255,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                                <strong style={{ color: 'var(--accent-primary)' }}>Explanation:</strong> {q.explanation}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function QuizPage() {
    const toast = useToast();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);

    const [current, setCurrent] = useState(0);

    useEffect(() => {
        generateQuiz();
    }, []);

    const questions = quiz?.questions || quiz || [];
    const q = questions[current];
    const qId = q?.questionId || `q${current}`;
    const selected = answers[qId];
    const answeredCount = Object.keys(answers).length;
    const allAnswered = questions.length > 0 && answeredCount === questions.length;

    async function generateQuiz() {
        setLoading(true);
        try {
            const res = await api.generateContextQuiz([]);
            setQuiz(res.quiz || res);
            setAnswers({});
            setSubmitted(false);
            setScore(null);
            setCurrent(0);
        } catch (err) {
            toast.error(err.message || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    }

    function selectAnswer(option) {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: option }));
        if (current < questions.length - 1) {
            setTimeout(() => setCurrent(c => c + 1), 350);
        }
    }

    async function submitQuiz() {
        if (!quiz) return;
        const qs = quiz.questions || quiz;
        if (Object.keys(answers).length < qs.length) {
            toast.error('Please answer all questions');
            return;
        }

        setLoading(true);
        try {
            const res = await api.submitQuiz(quiz.quizId, answers);
            setScore(res.score);
            setSubmitted(true);
            toast.success(`Quiz complete! Score: ${res.score}%`);
        } catch {
            // Local fallback calculation if API fails
            let correct = 0;
            qs.forEach((qObj, idx) => {
                const id = qObj.questionId || `q${idx}`;
                if (answers[id] === qObj.correctAnswer) correct++;
            });
            const localScore = Math.round((correct / qs.length) * 100);
            setScore(localScore);
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    }

    function resetQuiz() {
        setQuiz(null);
        setAnswers({});
        setSubmitted(false);
        setScore(null);
        setCurrent(0);
        generateQuiz();
    }

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
                <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', marginBottom: 16 }} />
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>Generating Context-Aware Quiz...</span>
            </div>
        );
    }

    if (submitted && score !== null) {
        return (
            <div className="page-container">
                <QuizResult quizData={questions} answers={answers} score={score} onRetry={resetQuiz} />
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: 100 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Ready for a Quiz?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Test your knowledge across your active topics.</p>
                <button className="btn btn-primary" onClick={generateQuiz}>
                    Generate New Quiz
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>Question {current + 1} of {questions.length}</span>
                    <span>{answeredCount} answered</span>
                </div>

                <div className="progress-bar-track" style={{ marginBottom: 24, background: 'var(--bg-card)', height: 6, borderRadius: 10, overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ width: `${(answeredCount / questions.length) * 100}%`, background: 'var(--gradient-primary)', height: '100%', transition: 'width 0.3s ease' }} />
                </div>

                <div className="card animate-fade-in-up" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, marginBottom: 24 }}>
                        <span style={{ color: 'var(--accent-primary)', marginRight: 8 }}>Q{current + 1}.</span>
                        {q.questionText}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            if (!q.options?.[opt]) return null;
                            const isSelected = selected === opt;
                            return (
                                <button key={opt} onClick={() => selectAnswer(opt)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                    background: isSelected ? 'rgba(108,99,255,0.1)' : 'var(--bg-card-hover)',
                                    cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left', width: '100%'
                                }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--gradient-primary)' : 'var(--bg-card)', border: isSelected ? 'none' : '1px solid var(--border-secondary)', color: isSelected ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                        {opt}
                                    </div>
                                    <span style={{ fontSize: 14, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{q.options[opt]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <button className="btn btn-secondary" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>Previous</button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {current < questions.length - 1 ? (
                            <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)} style={{ gap: 4 }}>
                                Next <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={submitQuiz} style={{ gap: 4 }} disabled={!allAnswered || loading}>
                                {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Quiz'}
                                {!loading && <CheckCircle size={14} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Bubble nav */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                    {questions.map((qObj, i) => {
                        const id = qObj.questionId || `q${i}`;
                        return (
                            <button key={i} onClick={() => setCurrent(i)} style={{
                                width: 28, height: 28, borderRadius: '50%',
                                border: `2px solid ${i === current ? 'var(--accent-primary)' : answers[id] ? 'var(--accent-green)' : 'var(--border-secondary)'}`,
                                background: i === current ? 'var(--gradient-primary)' : answers[id] ? 'rgba(0,210,160,0.15)' : 'var(--bg-card)',
                                color: answers[id] ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}>
                                {i + 1}
                            </button>
                        );
                    })}
                </div>

                {allAnswered && (
                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--accent-green)', animation: 'fadeUp .3s ease' }}>
                        ✅ All questions answered — ready to submit
                    </div>
                )}
            </div>
        </div>
    );
}
