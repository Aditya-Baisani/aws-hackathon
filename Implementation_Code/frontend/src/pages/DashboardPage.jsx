import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Brain, GraduationCap, RotateCw, CheckCircle, Trophy,
    Loader, ChevronRight, ChevronLeft, BookOpen,
    ExternalLink, Zap, Sparkles, ArrowRight
} from 'lucide-react';
import api from '../lib/api';
import { useDoubt } from '../contexts/DoubtContext';

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

@keyframes db-shimmer  { 0% { background-position:-700px 0 } 100% { background-position:700px 0 } }
@keyframes db-fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes db-fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes db-slideIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes db-spin     { to{transform:rotate(360deg)} }
@keyframes db-pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.96)} }
@keyframes db-ring     { 0%{transform:scale(.85);opacity:.8} 70%{transform:scale(1.15);opacity:0} 100%{transform:scale(.85);opacity:0} }
@keyframes db-bounceIn { 0%{transform:scale(.25);opacity:0} 55%{transform:scale(1.08)} 75%{transform:scale(.95)} 100%{transform:scale(1);opacity:1} }
@keyframes db-scoreIn  { from{opacity:0;transform:translateY(10px) scale(.9)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes db-dot      { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }

/* skeleton */
.db-skel {
  background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%);
  background-size: 700px 100%;
  animation: db-shimmer 1.8s infinite linear;
  border-radius: 8px;
}

/* flip card */
.db-scene { perspective: 1600px; width: 100%; }
.db-card  { position:relative; width:100%; transform-style:preserve-3d; transition:transform .8s cubic-bezier(.35,.1,.15,1); }
.db-card.flipped { transform:rotateY(180deg); }
.db-face  {
  backface-visibility:hidden; -webkit-backface-visibility:hidden;
  border-radius:22px; background:var(--bg-card);
  border:1px solid rgba(255,255,255,.07);
  box-shadow:0 20px 60px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.04) inset, 0 1px 0 rgba(255,255,255,.08) inset;
  display:flex; flex-direction:column; overflow:hidden;
}
.db-front { position:relative; min-height:580px; }
.db-back  { position:absolute; inset:0; transform:rotateY(180deg); overflow-y:auto; padding:30px 32px; scrollbar-width:thin; scrollbar-color:rgba(124,106,255,.25) transparent; }

/* tabs */
.db-tab { position:relative; background:none; border:none; padding:16px 2px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; color:var(--text-secondary); transition:color .2s; font-family:'Outfit',sans-serif; }
.db-tab::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; border-radius:2px 2px 0 0; background:var(--accent-primary); transform:scaleX(0); transition:transform .25s cubic-bezier(.4,0,.2,1); }
.db-tab.active { color:var(--accent-primary); }
.db-tab.active::after { transform:scaleX(1); }
.db-tab:not(.active):hover { color:var(--text-primary); }

/* quiz options */
.db-opt {
  display:flex; align-items:center; gap:13px; width:100%; padding:13px 16px;
  border-radius:12px; border:1.5px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.03); color:var(--text-primary);
  font-size:14px; cursor:pointer; text-align:left;
  transition:border-color .15s, background .15s, transform .12s, box-shadow .15s;
  margin-bottom:9px; animation:db-fadeUp .28s ease both;
  font-family:'Outfit',sans-serif;
}
.db-opt:hover:not(:disabled) { border-color:var(--accent-primary); background:rgba(124,106,255,.08); transform:translateX(4px); box-shadow:-3px 0 12px rgba(124,106,255,.15); }
.db-opt.db-sel  { border-color:var(--accent-primary); background:rgba(124,106,255,.12); box-shadow:0 0 0 3px rgba(124,106,255,.1); }

/* markdown */
.db-md { font-size:14.5px; line-height:1.8; color:var(--text-primary); font-family:'Outfit',sans-serif; animation:db-fadeIn .35s ease; }
.db-md-li { display:flex; gap:10px; align-items:flex-start; margin-bottom:7px; padding:10px 14px; background:rgba(124,106,255,.05); border-radius:10px; border:1px solid rgba(124,106,255,.12); transition:background .2s; }
.db-md-li:hover { background:rgba(124,106,255,.09); }

/* score */
.db-trophy    { animation:db-bounceIn .65s cubic-bezier(.36,.07,.19,.97) both; }
.db-score-num { animation:db-scoreIn .5s .2s ease both; font-family:'Outfit',sans-serif; font-size:80px; font-weight:900; line-height:1; letter-spacing:-3px; }

/* dots */
.db-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-primary); animation:db-dot 1.2s ease-in-out infinite; }
.db-dot:nth-child(2){animation-delay:.2s} .db-dot:nth-child(3){animation-delay:.4s}

/* scrollbar */
.db-scroll { scrollbar-width:thin; scrollbar-color:rgba(124,106,255,.2) transparent; }
.db-scroll::-webkit-scrollbar { width:4px; }
.db-scroll::-webkit-scrollbar-thumb { background:rgba(124,106,255,.2); border-radius:4px; }
`;

// ─── Markdown parser ──────────────────────────────────────────────────────────
function parseMarkdown(text) {
    if (!text) return null;
    const lines = text.split('\n');
    const out = [];
    let i = 0, buf = [], listType = null, k = 0;
    const uid = () => k++;

    function flush() {
        if (!buf.length) return;
        out.push(
            <ul key={uid()} style={{ margin: '8px 0 16px', padding: 0, listStyle: 'none' }}>
                {buf.map((item, idx) => (
                    <li key={idx} className="db-md-li" style={{ animationDelay: `${idx * 0.04}s` }}>
                        <span style={{ color: 'var(--accent-primary)', flexShrink: 0, fontSize: 10, marginTop: 4 }}>▸</span>
                        <span>{fmt(item)}</span>
                    </li>
                ))}
            </ul>
        );
        buf = []; listType = null;
    }

    function fmt(s) {
        return s.split(/(\*\*.*?\*\*|\*[^*\n]+\*|`[^`\n]+`|\[.*?\]\(.*?\))/g).map((p, j) => {
            if (/^\*\*.*\*\*$/.test(p))  return <strong key={j}>{p.slice(2, -2)}</strong>;
            if (/^\*[^*]+\*$/.test(p))   return <em key={j}>{p.slice(1, -1)}</em>;
            if (/^`[^`]+`$/.test(p))     return <code key={j} style={{ background: 'rgba(124,106,255,.14)', color: 'var(--accent-primary)', padding: '2px 7px', borderRadius: 5, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{p.slice(1, -1)}</code>;
            const lm = p.match(/^\[(.*?)\]\((.*?)\)$/);
            if (lm) return <a key={j} href={lm[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>{lm[1]}</a>;
            return p;
        });
    }

    while (i < lines.length) {
        const t = lines[i].trim();

        // Headings h1-h6
        if (/^#{1,6} /.test(t)) {
            flush();
            const lvl  = t.match(/^(#+)/)[1].length;
            const text = t.replace(/^#+\s/, '');
            const sz   = [22, 18, 15, 14, 12, 11][lvl - 1];
            const fw   = [800, 700, 700, 700, 600, 600][lvl - 1];
            const col  = lvl <= 2 ? 'var(--text-primary)' : 'var(--accent-primary)';
            const mt   = [32, 28, 22, 18, 14, 12][lvl - 1];

            if (lvl === 3) {
                out.push(
                    <div key={uid()} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: sz, fontWeight: fw, color: col, margin: `${mt}px 0 8px` }}>
                        <span style={{ display: 'inline-block', width: 4, height: 15, background: 'var(--accent-primary)', borderRadius: 2, flexShrink: 0 }} />
                        <span>{fmt(text)}</span>
                    </div>
                );
            } else if (lvl === 2) {
                out.push(
                    <div key={uid()} style={{ fontSize: sz, fontWeight: fw, color: col, margin: `${mt}px 0 10px`, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                        {fmt(text)}
                    </div>
                );
            } else {
                out.push(<div key={uid()} style={{ fontSize: sz, fontWeight: fw, color: col, margin: `${mt}px 0 ${lvl > 4 ? 4 : 8}px`, textTransform: lvl >= 5 ? 'uppercase' : 'none', letterSpacing: lvl >= 5 ? '0.8px' : 'normal' }}>{fmt(text)}</div>);
            }
            i++; continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(t)) {
            flush();
            out.push(<hr key={uid()} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.07)', margin: '22px 0' }} />);
            i++; continue;
        }

        // Blockquote
        if (t.startsWith('> ')) {
            flush();
            out.push(
                <blockquote key={uid()} style={{ borderLeft: '3px solid var(--accent-primary)', margin: '12px 0', padding: '11px 16px', background: 'rgba(124,106,255,.06)', borderRadius: '0 10px 10px 0', color: 'var(--text-secondary)', fontStyle: 'italic', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: -4, left: 10, fontSize: 28, color: 'var(--accent-primary)', opacity: .25, lineHeight: 1 }}>"</span>
                    <span style={{ position: 'relative' }}>{fmt(t.slice(2))}</span>
                </blockquote>
            );
            i++; continue;
        }

        // Code block
        if (t.startsWith('```')) {
            flush();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
            out.push(
                <pre key={uid()} style={{ background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 18px', overflowX: 'auto', margin: '12px 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 9, right: 12, fontSize: 10, color: 'rgba(255,255,255,.2)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>code</span>
                    <code style={{ background: 'none', fontSize: 13, color: 'rgba(255,255,255,.85)', fontFamily: "'JetBrains Mono',monospace" }}>{codeLines.join('\n')}</code>
                </pre>
            );
            i++; continue;
        }

        // Unordered list
        if (/^[-*+] /.test(t)) {
            if (listType !== 'ul') { flush(); listType = 'ul'; }
            buf.push(t.replace(/^[-*+] /, ''));
            i++; continue;
        }

        // Ordered list
        if (/^\d+\. /.test(t)) {
            if (listType !== 'ol') { flush(); listType = 'ol'; }
            buf.push(t.replace(/^\d+\. /, ''));
            i++; continue;
        }

        // Empty line
        if (t === '') {
            flush();
            out.push(<div key={uid()} style={{ height: 6 }} />);
            i++; continue;
        }

        // Paragraph
        flush();
        out.push(<p key={uid()} style={{ margin: '0 0 12px', lineHeight: 1.8 }}>{fmt(t)}</p>);
        i++;
    }
    flush();
    return <div className="db-md">{out}</div>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ContentSkeleton() {
    return (
        <div style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div className="db-skel" style={{ height: 20, width: '52%', marginBottom: 4 }} />
            {[92, 78, 86, 65, 90, 55, 82, 70, 94, 60].map((w, i) => (
                <div key={i} className="db-skel" style={{ height: 14, width: `${w}%`, animationDelay: `${i * 0.06}s` }} />
            ))}
            <div style={{ height: 10 }} />
            <div className="db-skel" style={{ height: 17, width: '38%' }} />
            {[0, 1, 2].map(i => (
                <div key={i} className="db-skel" style={{ height: 38, width: '100%', borderRadius: 10, animationDelay: `${(i + 10) * 0.06}s` }} />
            ))}
        </div>
    );
}

// ─── Quiz loading overlay ─────────────────────────────────────────────────────
function QuizLoadingOverlay() {
    const steps = ['Analyzing topic…', 'Building questions…', 'Calibrating difficulty…', 'Almost ready…'];
    const [step, setStep] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1100);
        return () => clearInterval(t);
    }, []);
    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 22, animation: 'db-fadeIn .2s ease' }}>
            <div style={{ position: 'relative', width: 88, height: 88, marginBottom: 28 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(124,106,255,.15)', animation: 'db-ring 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'rgba(124,106,255,.1)', animation: 'db-ring 1.5s ease-out .35s infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(124,106,255,.5)' }}>
                    <Brain size={34} color="#fff" />
                </div>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>Generating Quiz</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 22px', fontFamily: "'Outfit',sans-serif", minHeight: 20 }}>{steps[step]}</p>
            <div style={{ display: 'flex', gap: 6 }}>
                <span className="db-dot" /><span className="db-dot" /><span className="db-dot" />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 22 }}>
                {steps.map((_, i) => (
                    <div key={i} style={{ width: i <= step ? 18 : 5, height: 5, borderRadius: 3, background: i <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,.12)', transition: 'width .4s ease, background .3s' }} />
                ))}
            </div>
        </div>
    );
}

// ─── Reading progress bar ─────────────────────────────────────────────────────
function ReadingProgress({ scrollRef }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const fn = () => { const { scrollTop: st, scrollHeight: sh, clientHeight: ch } = el; setPct(sh - ch > 0 ? (st / (sh - ch)) * 100 : 0); };
        el.addEventListener('scroll', fn);
        return () => el.removeEventListener('scroll', fn);
    }, []);
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5, background: 'rgba(255,255,255,.05)', overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c6aff,#a78bfa)', transition: 'width .1s linear', borderRadius: '0 3px 3px 0' }} />
        </div>
    );
}

// ─── References panel ─────────────────────────────────────────────────────────
function ReferencesPanel({ references }) {
    if (!references) return <div style={{ padding: 24 }}><ContentSkeleton /></div>;

    if (typeof references === 'string') {
        return <div style={{ padding: '20px 24px', animation: 'db-slideIn .3s ease' }}>{parseMarkdown(references)}</div>;
    }

    if (Array.isArray(references) && references.length > 0) {
        return (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {references.map((ref, idx) => {
                    let host = ref.url || '';
                    try { host = new URL(ref.url).hostname.replace('www.', ''); } catch {}
                    return (
                        <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', background: 'rgba(255,255,255,.03)', borderRadius: 13, border: '1px solid rgba(255,255,255,.07)', textDecoration: 'none', transition: 'border-color .2s, background .2s, transform .15s', animation: `db-fadeUp .3s ease ${idx * 0.07}s both` }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,255,.4)'; e.currentTarget.style.background = 'rgba(124,106,255,.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = ''; }}
                        >
                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(124,106,255,.12)', border: '1px solid rgba(124,106,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ExternalLink size={14} color="var(--accent-primary)" />
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontFamily: "'Outfit',sans-serif" }}>{ref.title || host}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif" }}>{host}</div>
                            </div>
                            <ArrowRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </a>
                    );
                })}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-muted)' }}>
            <ExternalLink size={28} style={{ opacity: .3 }} />
            <p style={{ margin: 0, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>No resources found for this topic</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user }  = useAuth();
    const toast     = useToast();
    const navigate  = useNavigate();
    const { setCurrentTopicId: setDoubtTopicId, setCurrentTopicTitle: setDoubtTopicTitle } = useDoubt();

    const [explanation,     setExplanation]     = useState(null);
    const [simplified,      setSimplified]      = useState(null);
    const [references,      setReferences]      = useState(null);
    const [contentLoading,  setContentLoading]  = useState(false);
    const [activeTab,       setActiveTab]       = useState('explain');
    const [currentTopicId,  setCurrentTopicId]  = useState(null);
    const [topicTitle,      setTopicTitle]      = useState('');

    const [flipped,         setFlipped]         = useState(false);
    const [quiz,            setQuiz]            = useState(null);
    const [quizLoading,     setQuizLoading]     = useState(false);
    const [currentQIdx,     setCurrentQIdx]     = useState(0);
    const [answers,         setAnswers]         = useState({});
    const [submitted,       setSubmitted]       = useState(false);
    const [quizScore,       setQuizScore]       = useState(null);
    const [submitLoading,   setSubmitLoading]   = useState(false);
    const [allPlans,        setAllPlans]        = useState([]);
    const [pageReady,       setPageReady]       = useState(false);

    const scrollRef = useRef(null);

    useEffect(() => {
        if (!document.getElementById('db-css')) {
            const s = document.createElement('style');
            s.id = 'db-css'; s.textContent = STYLES;
            document.head.appendChild(s);
        }
        loadCurrentTopic();
    }, []);

    async function loadCurrentTopic() {
        try {
            const res   = await api.getPlans();
            const plans = res.plans || [];
            setAllPlans(plans);
            if (plans.length > 0) {
                const sorted = [...plans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                for (const day of sorted[0].days || []) {
                    const inc = day.topics?.find(t => !t.completed);
                    if (inc) {
                        setCurrentTopicId(inc.topicId);
                        setTopicTitle(inc.title || '');
                        setDoubtTopicId(inc.topicId);
                        setDoubtTopicTitle(inc.title);
                        setExplanation(null); setSimplified(null); setReferences(null);
                        fetchContent(inc.topicId, 'explain');
                        break;
                    }
                }
            }
        } catch { /* ignore */ }
        finally { setPageReady(true); }
    }

    async function fetchContent(topicId, tab) {
        setContentLoading(true);
        try {
            if (tab === 'explain')    { const r = await api.getExplanation(topicId); setExplanation(r.content); }
            else if (tab === 'simplify') { const r = await api.getSimplified(topicId); setSimplified(r.content); }
            else                      { const r = await api.getReferences(topicId); setReferences(r.references || r.content || []); }
        } catch { toast.error('Failed to load content.'); }
        finally { setContentLoading(false); }
    }

    function switchTab(tab) {
        if (!currentTopicId || contentLoading || tab === activeTab) return;
        setActiveTab(tab);
        const cache = tab === 'explain' ? explanation : tab === 'simplify' ? simplified : references;
        if (!cache) fetchContent(currentTopicId, tab);
    }

    async function handleTakeQuiz() {
        if (!currentTopicId) { toast.error('No active topic found.'); return; }
        setQuizLoading(true);
        try {
            const r = await api.generateTopicQuiz(currentTopicId);
            setQuiz(r.quiz || r);
            setFlipped(true);
        } catch { toast.error('Could not generate quiz for this topic'); }
        finally { setQuizLoading(false); }
    }

    function selectAnswer(opt) {
        if (submitted) return;
        const qs  = quiz.questions || quiz;
        const qId = qs[currentQIdx]?.questionId || `q${currentQIdx}`;
        setAnswers(prev => ({ ...prev, [qId]: opt }));
        if (currentQIdx < qs.length - 1) setTimeout(() => setCurrentQIdx(c => c + 1), 300);
    }

    async function submitQuiz() {
        const qs = quiz.questions || quiz;
        if (Object.keys(answers).length < qs.length) { toast.error('Answer all questions first'); return; }
        setSubmitLoading(true);
        try {
            const r = await api.submitQuiz(quiz.quizId, answers);
            finalizeScore(r.score);
        } catch {
            let correct = 0;
            qs.forEach((q, i) => { if (answers[q.questionId || `q${i}`] === q.correctAnswer) correct++; });
            finalizeScore(Math.round((correct / qs.length) * 100));
        } finally { setSubmitLoading(false); }
    }

    async function finalizeScore(score) {
        setQuizScore(score); setSubmitted(true);
        if (score >= 70 && currentTopicId) {
            try { await api.markComplete(currentTopicId); toast.success('🎉 Topic mastered & marked complete!'); setTimeout(() => { resetCoach(); loadCurrentTopic(); }, 2200); } catch {}
        }
    }

    function resetCoach() {
        setFlipped(false);
        setTimeout(() => { setQuiz(null); setAnswers({}); setSubmitted(false); setQuizScore(null); setCurrentQIdx(0); }, 500);
    }

    const qs          = quiz ? (quiz.questions || quiz) : [];
    const qObj        = qs[currentQIdx];
    const qId         = qObj?.questionId || `q${currentQIdx}`;
    const selectedOpt = answers[qId];
    const allAnswered  = qs.length > 0 && Object.keys(answers).length === qs.length;
    const curContent   = activeTab === 'explain' ? explanation : activeTab === 'simplify' ? simplified : null;

    if (!pageReady) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(124,106,255,.4)', animation: 'db-pulse 1.5s ease infinite' }}>
                    <Brain size={24} color="#fff" />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: "'Outfit',sans-serif", margin: 0 }}>Loading your session…</p>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 40px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

            {/* Empty state */}
            {allPlans.length === 0 && (
                <div style={{ width: '100%', padding: '52px 40px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed rgba(124,106,255,.35)', borderRadius: 22, animation: 'db-fadeUp .5s ease', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,106,255,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(124,106,255,.1)', border: '1px solid rgba(124,106,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                        <BookOpen size={28} color="var(--accent-primary)" />
                    </div>
                    <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 10px', fontFamily: "'Outfit',sans-serif" }}>Start Your Learning Journey</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 auto 26px', maxWidth: 400, fontSize: 14, lineHeight: 1.6, fontFamily: "'Outfit',sans-serif" }}>Generate a personalized study plan to begin learning with your AI tutor.</p>
                    <button onClick={() => navigate('/plan')} className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: 40, gap: 8, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                        <Sparkles size={15} /> Generate Study Plan
                    </button>
                </div>
            )}

            {/* Flip card */}
            {allPlans.length > 0 && (
                <div className="db-scene">
                    <div className={`db-card ${flipped ? 'flipped' : ''}`} style={{ minHeight: 580 }}>

                        {/* ── FRONT ── */}
                        <div className="db-face db-front">
                            <ReadingProgress scrollRef={scrollRef} />

                            {/* Header */}
                            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(124,106,255,.4)' }}>
                                    <GraduationCap size={19} color="#fff" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15.5, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>AI Learning Coach</div>
                                    {topicTitle && (
                                        <div style={{ fontSize: 12, color: 'var(--accent-primary)', marginTop: 2, fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: .8 }}>
                                            ▸ {topicTitle}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: 20, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,.07)', marginTop: 4, overflowX: 'auto' }}>
                                {[{ id: 'explain', label: '📖 Explanation' }, { id: 'simplify', label: '✨ Simplified' }, { id: 'references', label: '🔗 Resources' }].map(tab => (
                                    <button key={tab.id} className={`db-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => switchTab(tab.id)}>{tab.label}</button>
                                ))}
                            </div>

                            {/* Content */}
                            <div ref={scrollRef} className="db-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 360, position: 'relative' }}>
                                {quizLoading && <QuizLoadingOverlay />}
                                {contentLoading ? <ContentSkeleton />
                                    : activeTab === 'references' ? <ReferencesPanel references={references} />
                                    : curContent ? (
                                        <div style={{ padding: '20px 24px 24px', animation: 'db-slideIn .3s ease' }}>
                                            {parseMarkdown(curContent)}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-muted)' }}>
                                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(124,106,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Brain size={22} style={{ opacity: .35 }} />
                                            </div>
                                            <p style={{ margin: 0, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                                {currentTopicId ? 'Loading…' : 'All caught up! Create a new plan to continue.'}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.1)', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={handleTakeQuiz}
                                    disabled={quizLoading || !currentTopicId}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 30px', borderRadius: 40, background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: quizLoading || !currentTopicId ? 'not-allowed' : 'pointer', opacity: quizLoading || !currentTopicId ? .5 : 1, boxShadow: '0 4px 18px rgba(124,106,255,.4)', transition: 'transform .15s, box-shadow .15s, opacity .2s', fontFamily: "'Outfit',sans-serif" }}
                                    onMouseEnter={e => { if (!quizLoading && currentTopicId) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 26px rgba(124,106,255,.55)'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,106,255,.4)'; }}
                                >
                                    {quizLoading ? <><Loader size={15} style={{ animation: 'db-spin .7s linear infinite' }} /> Generating…</> : <><Zap size={15} /> Take Knowledge Quiz</>}
                                </button>
                            </div>
                        </div>

                        {/* ── BACK ── */}
                        <div className="db-face db-back">
                            {/* Quiz header */}
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Brain size={13} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Knowledge Check</span>
                                </div>
                                <button onClick={resetCoach}
                                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '6px 13px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, transition: 'background .2s, color .2s', fontFamily: "'Outfit',sans-serif" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.09)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    <ChevronLeft size={12} /> Back
                                </button>
                            </div>

                            {/* Score screen */}
                            {submitted && quizScore !== null ? (
                                <div style={{ textAlign: 'center', paddingTop: 20, animation: 'db-fadeUp .4s ease' }}>
                                    <div className="db-trophy" style={{ marginBottom: 18 }}>
                                        <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto', background: quizScore >= 70 ? 'radial-gradient(circle,rgba(0,229,160,.2),transparent)' : 'radial-gradient(circle,rgba(255,159,67,.2),transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trophy size={42} color={quizScore >= 70 ? '#00e5a0' : '#ff9f43'} />
                                        </div>
                                    </div>
                                    <div className="db-score-num" style={{ color: quizScore >= 70 ? '#00e5a0' : '#ff9f43' }}>
                                        {quizScore}<span style={{ fontSize: 34, opacity: .6 }}>%</span>
                                    </div>
                                    <h3 style={{ fontSize: 19, fontWeight: 700, margin: '12px 0 7px', fontFamily: "'Outfit',sans-serif" }}>
                                        {quizScore >= 70 ? '🎉 Topic Mastered!' : '📚 Keep Reviewing'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px', fontFamily: "'Outfit',sans-serif" }}>
                                        {quizScore >= 70 ? 'Marked as complete. Moving to next topic shortly…' : 'Review the explanation and retry when ready.'}
                                    </p>
                                    {/* Score bar */}
                                    <div style={{ width: 260, height: 7, background: 'rgba(255,255,255,.08)', borderRadius: 8, overflow: 'hidden', margin: '0 auto 24px' }}>
                                        <div style={{ height: '100%', borderRadius: 8, width: `${quizScore}%`, background: quizScore >= 70 ? 'linear-gradient(90deg,#00e5a0,#00b884)' : 'linear-gradient(90deg,#ff9f43,#ff6b6b)', transition: 'width 1s ease .3s' }} />
                                    </div>
                                    <button onClick={resetCoach} style={{ padding: '11px 30px', borderRadius: 40, background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 18px rgba(124,106,255,.4)', fontFamily: "'Outfit',sans-serif" }}>
                                        Continue Learning
                                    </button>
                                </div>

                            ) : qObj ? (
                                <div style={{ animation: 'db-slideIn .3s ease' }}>
                                    {/* Dot + bar progress */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif" }}>{currentQIdx + 1} / {qs.length}</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {qs.map((_, i) => (
                                                <div key={i} style={{ width: i === currentQIdx ? 16 : 5, height: 5, borderRadius: 3, background: answers[qs[i]?.questionId || `q${i}`] ? 'var(--accent-primary)' : i === currentQIdx ? 'rgba(124,106,255,.45)' : 'rgba(255,255,255,.1)', transition: 'width .3s, background .3s' }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c6aff,#a78bfa)', width: `${((currentQIdx + 1) / qs.length) * 100}%`, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
                                    </div>

                                    <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.6, marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>{qObj.questionText}</h3>

                                    {['A', 'B', 'C', 'D'].map((opt, oi) => {
                                        if (!qObj.options?.[opt]) return null;
                                        const isSel = selectedOpt === opt;
                                        return (
                                            <button key={opt} onClick={() => selectAnswer(opt)} className={`db-opt ${isSel ? 'db-sel' : ''}`} style={{ animationDelay: `${oi * 0.06}s` }}>
                                                <div style={{ width: 29, height: 29, borderRadius: '50%', flexShrink: 0, background: isSel ? 'linear-gradient(135deg,#7c6aff,#a78bfa)' : 'rgba(255,255,255,.05)', border: isSel ? 'none' : '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isSel ? '#fff' : 'var(--text-secondary)', transition: 'background .2s', boxShadow: isSel ? '0 2px 10px rgba(124,106,255,.4)' : 'none' }}>
                                                    {opt}
                                                </div>
                                                <span style={{ fontSize: 14, fontWeight: isSel ? 600 : 400, fontFamily: "'Outfit',sans-serif" }}>{qObj.options[opt]}</span>
                                            </button>
                                        );
                                    })}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, gap: 10 }}>
                                        <button onClick={() => setCurrentQIdx(c => Math.max(0, c - 1))} disabled={currentQIdx === 0}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 30, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: currentQIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
                                            <ChevronLeft size={13} /> Prev
                                        </button>
                                        {currentQIdx < qs.length - 1 ? (
                                            <button onClick={() => setCurrentQIdx(c => c + 1)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 20px', borderRadius: 30, background: 'linear-gradient(135deg,#7c6aff,#a78bfa)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 12px rgba(124,106,255,.35)', fontFamily: "'Outfit',sans-serif" }}>
                                                Next <ChevronRight size={13} />
                                            </button>
                                        ) : (
                                            <button onClick={submitQuiz} disabled={!allAnswered || submitLoading}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 20px', borderRadius: 30, background: allAnswered ? 'linear-gradient(135deg,#00e5a0,#00b884)' : 'rgba(255,255,255,.08)', border: 'none', color: allAnswered ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: allAnswered && !submitLoading ? 'pointer' : 'not-allowed', boxShadow: allAnswered ? '0 3px 12px rgba(0,229,160,.3)' : 'none', transition: 'background .3s, box-shadow .3s', fontFamily: "'Outfit',sans-serif" }}>
                                                {submitLoading ? <Loader size={13} style={{ animation: 'db-spin .7s linear infinite' }} /> : <><CheckCircle size={13} /> Submit</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                                    <div style={{ display: 'flex', gap: 7 }}><span className="db-dot" /><span className="db-dot" /><span className="db-dot" /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
