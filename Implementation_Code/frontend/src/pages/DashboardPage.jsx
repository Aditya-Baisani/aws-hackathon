import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Brain, GraduationCap, RotateCw, CheckCircle, Trophy,
    Loader, ChevronRight, BookOpen, ExternalLink, Zap,
    Sparkles, Star, ArrowRight, ChevronLeft
} from 'lucide-react';
import api from '../lib/api';
import { useDoubt } from '../contexts/DoubtContext';

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --db-radius: 24px;
  --db-glow: rgba(124,106,255,0.18);
  --db-glow-strong: rgba(124,106,255,0.35);
  --db-green: #00e5a0;
  --db-orange: #ff9f43;
  --db-red: #ff6b6b;
}

@keyframes db-shimmer {
  0%   { background-position: -700px 0; }
  100% { background-position:  700px 0; }
}
@keyframes db-fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes db-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes db-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .7; transform: scale(0.97); }
}
@keyframes db-ring {
  0%   { transform: scale(0.85); opacity: .8; }
  70%  { transform: scale(1.15); opacity: 0;  }
  100% { transform: scale(0.85); opacity: 0;  }
}
@keyframes db-spin     { to { transform: rotate(360deg); } }
@keyframes db-bounceIn {
  0%   { transform: scale(0.2) rotate(-10deg); opacity: 0; }
  55%  { transform: scale(1.1) rotate(3deg);  opacity: 1; }
  75%  { transform: scale(0.93) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes db-scoreCount {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes db-glow-pulse {
  0%, 100% { box-shadow: 0 0 20px var(--db-glow); }
  50%       { box-shadow: 0 0 40px var(--db-glow-strong), 0 0 80px var(--db-glow); }
}
@keyframes db-slideLeft {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes db-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1;   }
}

/* ── Skeleton ── */
.db-skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 700px 100%;
  animation: db-shimmer 1.8s infinite linear;
  border-radius: 8px;
}

/* ── Flip card ── */
.db-scene { perspective: 1600px; width: 100%; }
.db-card {
  position: relative; width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.35, 0.1, 0.15, 1.0);
}
.db-card.flipped { transform: rotateY(180deg); }
.db-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--db-radius);
  background: var(--bg-card);
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow:
    0 24px 64px rgba(0,0,0,0.32),
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 1px 0 rgba(255,255,255,0.08) inset;
  display: flex; flex-direction: column; overflow: hidden;
}
.db-front { position: relative; min-height: 580px; }
.db-back  {
  position: absolute; inset: 0;
  transform: rotateY(180deg);
  overflow-y: auto; padding: 32px 36px;
  scrollbar-width: thin;
  scrollbar-color: rgba(124,106,255,0.3) transparent;
}

/* ── Tab bar ── */
.db-tab {
  position: relative;
  background: none; border: none;
  padding: 18px 2px; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  color: var(--text-secondary);
  transition: color 0.2s;
  font-family: 'Outfit', sans-serif;
  letter-spacing: 0.2px;
}
.db-tab::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 2px; border-radius: 2px 2px 0 0;
  background: var(--accent-primary);
  transform: scaleX(0);
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
}
.db-tab.active { color: var(--accent-primary); }
.db-tab.active::after { transform: scaleX(1); }
.db-tab:not(.active):hover { color: var(--text-primary); }

/* ── Quiz option ── */
.db-opt {
  display: flex; align-items: center; gap: 14px;
  width: 100%; padding: 14px 18px;
  border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  color: var(--text-primary); font-size: 14.5px;
  cursor: pointer; text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.12s, box-shadow 0.15s;
  margin-bottom: 10px;
  animation: db-fadeUp 0.3s ease both;
  font-family: 'Outfit', sans-serif;
}
.db-opt:hover:not(:disabled) {
  border-color: var(--accent-primary);
  background: rgba(124,106,255,0.08);
  transform: translateX(4px);
  box-shadow: -3px 0 12px rgba(124,106,255,0.15);
}
.db-opt.selected {
  border-color: var(--accent-primary);
  background: rgba(124,106,255,0.12);
  box-shadow: 0 0 0 3px rgba(124,106,255,0.12), -3px 0 16px rgba(124,106,255,0.2);
}
.db-opt.correct {
  border-color: var(--db-green);
  background: rgba(0,229,160,0.1);
  color: var(--db-green);
  box-shadow: 0 0 0 3px rgba(0,229,160,0.12);
}
.db-opt.wrong {
  border-color: var(--db-red);
  background: rgba(255,107,107,0.1);
  color: var(--db-red);
}

/* ── Markdown ── */
.db-md {
  font-size: 14.5px; line-height: 1.8;
  color: var(--text-primary);
  font-family: 'Outfit', sans-serif;
  animation: db-fadeIn 0.35s ease;
}
.db-md h1 { font-size: 22px; font-weight: 800; margin: 32px 0 14px; color: var(--text-primary); letter-spacing: -0.3px; }
.db-md h2 {
  font-size: 18px; font-weight: 700; margin: 28px 0 12px;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.db-md h3 {
  font-size: 15px; font-weight: 700; margin: 22px 0 8px;
  color: var(--accent-primary);
  display: flex; align-items: center; gap: 8px;
}
.db-md h3::before {
  content: '';
  display: inline-block; width: 4px; height: 16px;
  background: var(--accent-primary); border-radius: 2px;
  flex-shrink: 0;
}
.db-md h4 { font-size: 14px; font-weight: 700; margin: 18px 0 6px; color: var(--accent-primary); opacity: 0.85; }
.db-md h5 { font-size: 12px; font-weight: 600; margin: 14px 0 4px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
.db-md h6 { font-size: 11px; font-weight: 600; margin: 12px 0 4px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
.db-md p { margin: 0 0 14px; }
.db-md strong { color: var(--accent-primary); font-weight: 700; }
.db-md em { font-style: italic; color: var(--text-secondary); }
.db-md ul, .db-md ol { margin: 8px 0 16px; padding-left: 0; list-style: none; }
.db-md li {
  display: flex; gap: 10px; align-items: flex-start;
  margin-bottom: 7px; padding: 10px 14px;
  background: rgba(124,106,255,0.05);
  border-radius: 10px;
  border: 1px solid rgba(124,106,255,0.12);
  animation: db-fadeUp 0.3s ease both;
  transition: background 0.2s, border-color 0.2s;
}
.db-md li:hover { background: rgba(124,106,255,0.09); border-color: rgba(124,106,255,0.22); }
.db-md li-bullet { color: var(--accent-primary); flex-shrink: 0; margin-top: 2px; font-size: 12px; }
.db-md code {
  background: rgba(124,106,255,0.14); color: var(--accent-primary);
  padding: 2px 8px; border-radius: 6px; font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid rgba(124,106,255,0.2);
}
.db-md pre {
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 18px 20px;
  overflow-x: auto; margin: 14px 0;
  position: relative;
}
.db-md pre::before {
  content: 'code';
  position: absolute; top: 10px; right: 14px;
  font-size: 10px; color: rgba(255,255,255,0.2);
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase; letter-spacing: 1px;
}
.db-md pre code { background: none; padding: 0; border: none; font-size: 13px; color: rgba(255,255,255,0.85); }
.db-md blockquote {
  border-left: 3px solid var(--accent-primary);
  margin: 14px 0; padding: 12px 18px;
  background: rgba(124,106,255,0.06);
  border-radius: 0 12px 12px 0;
  color: var(--text-secondary); font-style: italic;
  position: relative;
}
.db-md blockquote::before {
  content: '"';
  position: absolute; top: -4px; left: 12px;
  font-size: 32px; color: var(--accent-primary); opacity: 0.3;
  font-family: Georgia, serif; line-height: 1;
}
.db-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0; }
.db-md a { color: var(--accent-primary); text-decoration: none; border-bottom: 1px solid rgba(124,106,255,0.35); transition: border-color 0.2s; }
.db-md a:hover { border-bottom-color: var(--accent-primary); }
.db-md table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13.5px; border-radius: 10px; overflow: hidden; }
.db-md th { background: rgba(124,106,255,0.15); padding: 11px 16px; text-align: left; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.db-md td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.db-md tr:hover td { background: rgba(255,255,255,0.02); }

/* ── Score screen ── */
.db-score-num {
  font-family: 'Outfit', sans-serif;
  font-size: 80px; font-weight: 900; line-height: 1;
  animation: db-scoreCount 0.5s 0.2s ease both;
  letter-spacing: -3px;
}
.db-trophy { animation: db-bounceIn 0.65s cubic-bezier(0.36,0.07,0.19,0.97) both; }

/* ── Dots loader ── */
.db-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--accent-primary); animation: db-dot 1.2s ease-in-out infinite; }
.db-dot:nth-child(2) { animation-delay: 0.2s; }
.db-dot:nth-child(3) { animation-delay: 0.4s; }

/* ── Ambient glow on card ── */
.db-glow-card { animation: db-glow-pulse 3s ease-in-out infinite; }

/* ── Reading progress bar ── */
.db-read-progress {
  position: absolute; top: 0; left: 0; height: 3px;
  background: linear-gradient(90deg, var(--accent-primary), #a78bfa);
  border-radius: 0 3px 3px 0;
  transition: width 0.1s linear;
  z-index: 10;
}

/* ── Scrollbar ── */
.db-content-scroll { scrollbar-width: thin; scrollbar-color: rgba(124,106,255,0.25) transparent; }
.db-content-scroll::-webkit-scrollbar { width: 4px; }
.db-content-scroll::-webkit-scrollbar-track { background: transparent; }
.db-content-scroll::-webkit-scrollbar-thumb { background: rgba(124,106,255,0.25); border-radius: 4px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// KATEX — lazy-load once, render math inline and block
// ─────────────────────────────────────────────────────────────────────────────
let _katexReady = false;
let _katexPromise = null;

function _ensureKatex() {
    if (_katexReady) return Promise.resolve();
    if (_katexPromise) return _katexPromise;
    _katexPromise = new Promise((resolve) => {
        if (!document.getElementById('katex-css')) {
            const link = document.createElement('link');
            link.id = 'katex-css'; link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
            document.head.appendChild(link);
        }
        if (window.katex) { _katexReady = true; resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
        script.onload = () => { _katexReady = true; resolve(); };
        document.head.appendChild(script);
    });
    return _katexPromise;
}

// Renders a math expression using KaTeX (inline or display block)
function MathNode({ latex, display = false }) {
    const ref = useRef(null);
    const [ready, setReady] = useState(_katexReady);

    useEffect(() => {
        if (!ready) { _ensureKatex().then(() => setReady(true)); }
    }, []);

    useEffect(() => {
        if (!ready || !ref.current || !window.katex) return;
        try {
            window.katex.render(latex.trim(), ref.current, {
                displayMode: display,
                throwOnError: false,
                output: 'html',
            });
        } catch {
            if (ref.current) ref.current.textContent = latex;
        }
    }, [ready, latex, display]);

    // Fallback while KaTeX loads
    if (!ready) {
        return (
            <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: 'var(--accent-primary)', opacity: 0.75,
                background: 'rgba(124,106,255,0.08)',
                padding: display ? '8px 16px' : '1px 6px',
                borderRadius: 8,
                display: display ? 'block' : 'inline',
                margin: display ? '14px 0' : '0 2px',
            }}>{latex}</span>
        );
    }

    return (
        <span
            ref={ref}
            style={{
                display: display ? 'block' : 'inline',
                margin: display ? '16px 0' : '0 2px',
                padding: display ? '16px 20px' : '0',
                background: display ? 'rgba(124,106,255,0.05)' : 'transparent',
                borderRadius: display ? 12 : 0,
                border: display ? '1px solid rgba(124,106,255,0.12)' : 'none',
                overflowX: display ? 'auto' : 'visible',
                textAlign: display ? 'center' : 'inherit',
            }}
        />
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN PARSER
// ─────────────────────────────────────────────────────────────────────────────
function parseMarkdown(text) {
    if (!text) return null;

    // Pre-process: collapse block math \[ ... \] and $$ ... $$ into single-line tokens
    text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, l) =>
        '%%BLOCKMATH%%' + l.replace(/\n/g, ' ') + '%%ENDMATH%%'
    );
    text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, l) =>
        '%%BLOCKMATH%%' + l.replace(/\n/g, ' ') + '%%ENDMATH%%'
    );

    const lines = text.split('\n');
    const elements = [];
    let i = 0, listBuffer = [], listType = null, k = 0;
    const key = () => k++;

    function flushList() {
        if (!listBuffer.length) return;
        elements.push(
            <ul key={key()} style={{ margin: '8px 0 16px', padding: 0, listStyle: 'none' }}>
                {listBuffer.map((item, idx) => (
                    <li key={idx} className="db-md li" style={{ animationDelay: `${idx * 0.04}s` }}>
                        <span style={{ color: 'var(--accent-primary)', flexShrink: 0, fontSize: 10, marginTop: 4 }}>▸</span>
                        <span>{inlineFmt(item)}</span>
                    </li>
                ))}
            </ul>
        );
        listBuffer = []; listType = null;
    }

    function inlineFmt(str) {
        // Split on inline math \( ... \) and $...$ first
        const mathChunks = str.split(/(\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g);
        return mathChunks.map((chunk, ci) => {
            if (/^\\\([\s\S]*?\\\)$/.test(chunk)) {
                return <MathNode key={ci} latex={chunk.slice(2, -2)} />;
            }
            if (/^\$[^$]+\$$/.test(chunk)) {
                return <MathNode key={ci} latex={chunk.slice(1, -1)} />;
            }
            // Regular inline formatting
            return chunk.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`|\[.*?\]\(.*?\))/g).map((p, idx) => {
                if (/^\*\*.*\*\*$/.test(p)) return <strong key={idx}>{p.slice(2,-2)}</strong>;
                if (/^\*[^*]+\*$/.test(p))  return <em key={idx}>{p.slice(1,-1)}</em>;
                if (/^`[^`]+`$/.test(p))    return <code key={idx}>{p.slice(1,-1)}</code>;
                const lm = p.match(/^\[(.*?)\]\((.*?)\)$/);
                if (lm) return <a key={idx} href={lm[2]} target="_blank" rel="noopener noreferrer">{lm[1]}</a>;
                return p;
            });
        });
    }

    while (i < lines.length) {
        const raw = lines[i], t = raw.trim();

        // Block math: \[ ... \] or $$ ... $$
        if (t === '\\[' || t === '$$') {
            flushList();
            const closer = t === '\\[' ? '\\]' : '$$';
            const mathLines = [];
            i++;
            while (i < lines.length && lines[i].trim() !== closer) { mathLines.push(lines[i]); i++; }
            elements.push(<MathBlock key={key()} latex={mathLines.join('\n')} display={true} />);
            i++; continue;
        }
        // Single-line block math: \[...\] on one line
        if (/^\\\[.*\\\]$/.test(t)) {
            flushList();
            elements.push(<MathBlock key={key()} latex={t.slice(2, -2)} display={true} />);
            i++; continue;
        }

        // ── Block math token (pre-processed \[...\] and $$...$$) ──
        if (t.startsWith('%%BLOCKMATH%%')) {
            flushList();
            const latex = t.replace(/%%BLOCKMATH%%|%%ENDMATH%%/g, '').trim();
            elements.push(<MathNode key={key()} latex={latex} display={true} />);
            i++; continue;
        }

        if (/^#{1,6} /.test(t)) {
            flushList();
            const lvl = Math.min(t.match(/^(#+)/)[1].length, 6);
            const content = t.replace(/^#+\s/, '');
            const sizes   = [22, 18, 15, 14, 12, 11];
            const weights = [800, 700, 700, 700, 600, 600];
            const colors  = ['var(--text-primary)', 'var(--text-primary)', 'var(--accent-primary)', 'var(--accent-primary)', 'var(--text-secondary)', 'var(--text-muted)'];
            const style   = { fontSize: sizes[lvl-1], fontWeight: weights[lvl-1], color: colors[lvl-1], margin: `${28 - lvl*3}px 0 ${12 - lvl}px` };
            if (lvl === 3) {
                elements.push(
                    <div key={key()} style={{ ...style, display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 8 }}>
                        <span style={{ display: 'inline-block', width: 4, height: 16, background: 'var(--accent-primary)', borderRadius: 2, flexShrink: 0 }} />
                        <span>{inlineFmt(content)}</span>
                    </div>
                );
            } else if (lvl === 2) {
                elements.push(
                    <div key={key()} style={{ ...style, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {inlineFmt(content)}
                    </div>
                );
            } else {
                elements.push(<div key={key()} style={style}>{inlineFmt(content)}</div>);
            }
            i++; continue;
        }

        if (/^[-*_]{3,}$/.test(t)) {
            flushList();
            elements.push(<hr key={key()} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '24px 0' }} />);
            i++; continue;
        }

        if (t.startsWith('> ')) {
            flushList();
            elements.push(
                <blockquote key={key()} style={{
                    borderLeft: '3px solid var(--accent-primary)', margin: '14px 0', padding: '12px 18px',
                    background: 'rgba(124,106,255,0.06)', borderRadius: '0 12px 12px 0',
                    color: 'var(--text-secondary)', fontStyle: 'italic', position: 'relative',
                }}>
                    <span style={{ position: 'absolute', top: -4, left: 12, fontSize: 32, color: 'var(--accent-primary)', opacity: 0.25, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>
                    <span style={{ position: 'relative' }}>{inlineFmt(t.slice(2))}</span>
                </blockquote>
            );
            i++; continue;
        }

        if (t.startsWith('```')) {
            flushList();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
            elements.push(
                <pre key={key()} style={{
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '18px 20px', overflowX: 'auto', margin: '14px 0', position: 'relative',
                }}>
                    <span style={{ position: 'absolute', top: 10, right: 14, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>code</span>
                    <code style={{ background: 'none', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace" }}>{codeLines.join('\n')}</code>
                </pre>
            );
            i++; continue;
        }

        if (/^[-*+] /.test(t)) {
            if (listType !== 'ul') { flushList(); listType = 'ul'; }
            listBuffer.push(t.replace(/^[-*+] /, ''));
            i++; continue;
        }

        if (/^\d+\. /.test(t)) {
            if (listType !== 'ol') { flushList(); listType = 'ol'; }
            listBuffer.push(t.replace(/^\d+\. /, ''));
            i++; continue;
        }

        if (t === '') {
            flushList();
            elements.push(<div key={key()} style={{ height: 6 }} />);
            i++; continue;
        }

        flushList();
        elements.push(<p key={key()} style={{ margin: '0 0 12px', lineHeight: 1.8 }}>{inlineFmt(t)}</p>);
        i++;
    }
    flushList();
    return <div className="db-md" style={{ fontSize: '14.5px', lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", animation: 'db-fadeIn 0.35s ease' }}>{elements}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function ContentSkeleton() {
    const rows = [92, 78, 86, 65, 90, 55, 82, 70, 94, 60, 75, 88];
    return (
        <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Fake heading */}
            <div className="db-skeleton" style={{ height: 22, width: '55%', marginBottom: 6 }} />
            {rows.map((w, i) => (
                <div key={i} className="db-skeleton" style={{ height: 14, width: `${w}%`, animationDelay: `${i * 0.07}s` }} />
            ))}
            <div style={{ height: 8 }} />
            <div className="db-skeleton" style={{ height: 18, width: '40%' }} />
            {[80, 68, 74].map((w, i) => (
                <div key={i+20} className="db-skeleton" style={{ height: 40, width: '100%', borderRadius: 10, animationDelay: `${(i+12) * 0.07}s` }} />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ LOADING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function QuizLoadingOverlay() {
    const [step, setStep] = useState(0);
    const steps = ['Analyzing topic…', 'Building questions…', 'Calibrating difficulty…', 'Almost ready…'];
    useEffect(() => {
        const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1200);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', borderRadius: 'var(--db-radius)',
            animation: 'db-fadeIn 0.2s ease',
        }}>
            {/* Orbiting ring */}
            <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 32 }}>
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(124,106,255,0.15)',
                    animation: 'db-ring 1.6s ease-out infinite',
                }} />
                <div style={{
                    position: 'absolute', inset: 8, borderRadius: '50%',
                    background: 'rgba(124,106,255,0.1)',
                    animation: 'db-ring 1.6s ease-out 0.4s infinite',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c6aff, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 32px rgba(124,106,255,0.5)',
                }}>
                    <Brain size={36} color="#fff" />
                </div>
            </div>

            <h3 style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                Generating Quiz
            </h3>
            <p style={{
                color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 24px',
                minHeight: 20, transition: 'opacity 0.3s',
                fontFamily: "'Outfit', sans-serif",
            }}>
                {steps[step]}
            </p>

            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 7 }}>
                <span className="db-dot" />
                <span className="db-dot" />
                <span className="db-dot" />
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
                {steps.map((_, i) => (
                    <div key={i} style={{
                        width: i <= step ? 20 : 6, height: 6,
                        borderRadius: 3,
                        background: i <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.12)',
                        transition: 'width 0.4s ease, background 0.3s',
                    }} />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// READING PROGRESS
// ─────────────────────────────────────────────────────────────────────────────
function ReadingProgress({ scrollRef }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const max = scrollHeight - clientHeight;
            setPct(max > 0 ? (scrollTop / max) * 100 : 0);
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [scrollRef]);
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5, background: 'rgba(255,255,255,0.05)', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
            <div style={{
                height: '100%', borderRadius: '0 3px 3px 0',
                background: 'linear-gradient(90deg, #7c6aff, #a78bfa)',
                width: `${pct}%`, transition: 'width 0.1s linear',
            }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user }   = useAuth();
    const toast      = useToast();
    const navigate   = useNavigate();
    const { setCurrentTopicId: setDoubtTopicId, setCurrentTopicTitle: setDoubtTopicTitle } = useDoubt();

    const [explanation,    setExplanation]    = useState(null);
    const [simplified,     setSimplified]     = useState(null);
    const [references,     setReferences]     = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeTab,      setActiveTab]      = useState('explain');
    const [currentTopicId, setCurrentTopicId] = useState(null);
    const [currentTopicTitle, setCurrentTopicTitle] = useState('');

    const [flipped,      setFlipped]      = useState(false);
    const [quiz,         setQuiz]         = useState(null);
    const [quizLoading,  setQuizLoading]  = useState(false);
    const [currentQIdx,  setCurrentQIdx]  = useState(0);
    const [answers,      setAnswers]      = useState({});
    const [submitted,    setSubmitted]    = useState(false);
    const [quizScore,    setQuizScore]    = useState(null);
    const [submitLoading,setSubmitLoading]= useState(false);
    const [allPlans,     setAllPlans]     = useState([]);
    const [pageReady,    setPageReady]    = useState(false);

    const contentScrollRef = useRef(null);

    useEffect(() => {
        if (!document.getElementById('db-styles')) {
            const s = document.createElement('style');
            s.id = 'db-styles'; s.textContent = STYLES;
            document.head.appendChild(s);
        }
        loadKatex(); // preload KaTeX so math renders instantly
        loadCurrentTopic();
    }, []);

    async function loadCurrentTopic() {
        try {
            const res = await api.getPlans();
            const plans = res.plans || [];
            setAllPlans(plans);
            setPageReady(true);
            if (plans.length > 0) {
                const sorted = [...plans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const active = sorted[0];
                if (active.days) {
                    for (const day of active.days) {
                        const inc = day.topics?.find(t => !t.completed);
                        if (inc) {
                            setCurrentTopicId(inc.topicId);
                            setCurrentTopicTitle(inc.title || '');
                            setDoubtTopicId(inc.topicId);
                            setDoubtTopicTitle(inc.title);
                            setExplanation(null); setSimplified(null); setReferences(null);
                            fetchContent(inc.topicId, 'explain');
                            return;
                        }
                    }
                }
            }
        } catch { setPageReady(true); }
    }

    async function fetchContent(topicId, tab) {
        setContentLoading(true);
        try {
            if (tab === 'explain') {
                const r = await api.getExplanation(topicId);
                setExplanation(r.content);
            } else if (tab === 'simplify') {
                const r = await api.getSimplified(topicId);
                setSimplified(r.content);
            } else {
                const r = await api.getReferences(topicId);
                setReferences(r.references || r.content || []);
            }
        } catch { toast.error('Failed to load content.'); }
        finally { setContentLoading(false); }
    }

    function handleTabSwitch(tab) {
        if (!currentTopicId || contentLoading || tab === activeTab) return;
        setActiveTab(tab);
        const cached = tab === 'explain' ? explanation : tab === 'simplify' ? simplified : references;
        if (!cached) fetchContent(currentTopicId, tab);
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
        const qs = quiz.questions || quiz;
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
            finalizeQuiz(r.score, qs);
        } catch {
            let correct = 0;
            qs.forEach((q, i) => { if (answers[q.questionId || `q${i}`] === q.correctAnswer) correct++; });
            finalizeQuiz(Math.round((correct / qs.length) * 100), qs);
        } finally { setSubmitLoading(false); }
    }

    async function finalizeQuiz(score, qs) {
        setQuizScore(score);
        setSubmitted(true);
        if (score >= 70 && currentTopicId) {
            try {
                await api.markComplete(currentTopicId);
                toast.success('🎉 Topic mastered & marked complete!');
                setTimeout(() => { resetToCoach(); loadCurrentTopic(); }, 2200);
            } catch { /* ignore */ }
        }
    }

    function resetToCoach() {
        setFlipped(false);
        setTimeout(() => { setQuiz(null); setAnswers({}); setSubmitted(false); setQuizScore(null); setCurrentQIdx(0); }, 500);
    }

    const qs          = quiz ? (quiz.questions || quiz) : [];
    const qObj        = qs[currentQIdx];
    const qId         = qObj?.questionId || `q${currentQIdx}`;
    const selectedOpt = answers[qId];
    const allAnswered  = qs.length > 0 && Object.keys(answers).length === qs.length;
    const currentContent = activeTab === 'explain' ? explanation : activeTab === 'simplify' ? simplified : null;

    if (!pageReady) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(124,106,255,0.4)', animation: 'db-pulse 1.5s ease infinite' }}>
                        <Brain size={24} color="#fff" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>Loading your learning session…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 40px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

            {/* ── Empty state ── */}
            {allPlans.length === 0 && (
                <div style={{
                    width: '100%', padding: '56px 40px', textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: '1px dashed rgba(124,106,255,0.35)',
                    borderRadius: 'var(--db-radius)',
                    animation: 'db-fadeUp 0.5s ease',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Background glow */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,106,255,0.15), rgba(124,106,255,0.05))', border: '1px solid rgba(124,106,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <BookOpen size={30} color="var(--accent-primary)" />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>Start Your Learning Journey</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 auto 28px', maxWidth: 420, fontSize: 14, lineHeight: 1.6, fontFamily: "'Outfit', sans-serif" }}>
                        Generate a personalized study plan from your materials or any topic to begin.
                    </p>
                    <button onClick={() => navigate('/plan')} className="btn btn-primary"
                        style={{ padding: '12px 32px', borderRadius: 40, gap: 8, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                        <Sparkles size={16} /> Generate Study Plan
                    </button>
                </div>
            )}

            {/* ── Main flip card ── */}
            {allPlans.length > 0 && (
                <div className="db-scene" style={{ width: '100%' }}>
                    <div className={`db-card ${flipped ? 'flipped' : ''}`} style={{ minHeight: 600 }}>

                        {/* ════════════════════════════════════════
                            FRONT — AI Coach
                        ════════════════════════════════════════ */}
                        <div className="db-face db-front">
                            <ReadingProgress scrollRef={contentScrollRef} />

                            {/* Header */}
                            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                    background: 'linear-gradient(135deg, #7c6aff, #a78bfa)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(124,106,255,0.4)',
                                }}>
                                    <GraduationCap size={20} color="#fff" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                                        AI Learning Coach
                                    </div>
                                    {currentTopicTitle && (
                                        <div style={{
                                            fontSize: 12, color: 'var(--accent-primary)',
                                            marginTop: 2, fontFamily: "'Outfit', sans-serif",
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            opacity: 0.85,
                                        }}>
                                            ▸ {currentTopicTitle}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: 20, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginTop: 4, overflowX: 'auto' }}>
                                {[
                                    { id: 'explain',    icon: '📖', label: 'Explanation' },
                                    { id: 'simplify',   icon: '✨', label: 'Simplified'  },
                                    { id: 'references', icon: '🔗', label: 'Resources'   },
                                ].map(tab => (
                                    <button key={tab.id}
                                        className={`db-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => handleTabSwitch(tab.id)}
                                        style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
                                        <span>{tab.icon}</span> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content scroll area */}
                            <div ref={contentScrollRef} className="db-content-scroll"
                                style={{ flex: 1, overflowY: 'auto', minHeight: 380, position: 'relative' }}>

                                {quizLoading && <QuizLoadingOverlay />}

                                {contentLoading ? (
                                    <ContentSkeleton />
                                ) : activeTab === 'references' ? (
                                    <ReferencesPanel references={references} />
                                ) : currentContent ? (
                                    <div style={{ padding: '20px 24px 24px', animation: 'db-slideLeft 0.3s ease' }}>
                                        {parseMarkdown(currentContent)}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, color: 'var(--text-muted)' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,106,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Brain size={24} style={{ opacity: 0.4 }} />
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                                            {currentTopicId ? 'Loading content…' : 'All caught up! Create a new plan to continue.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '14px 24px 20px',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(0,0,0,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <button
                                    onClick={handleTakeQuiz}
                                    disabled={quizLoading || !currentTopicId}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 9,
                                        padding: '12px 32px', borderRadius: 40,
                                        background: 'linear-gradient(135deg, #7c6aff, #a78bfa)',
                                        border: 'none', color: '#fff', fontWeight: 700,
                                        fontSize: 14, cursor: quizLoading || !currentTopicId ? 'not-allowed' : 'pointer',
                                        opacity: quizLoading || !currentTopicId ? 0.5 : 1,
                                        boxShadow: '0 4px 20px rgba(124,106,255,0.4)',
                                        transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                    onMouseEnter={e => { if (!quizLoading && currentTopicId) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,106,255,0.55)'; }}}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,106,255,0.4)'; }}
                                >
                                    {quizLoading
                                        ? <><Loader size={15} style={{ animation: 'db-spin 0.7s linear infinite' }} /> Generating…</>
                                        : <><Zap size={15} /> Take Knowledge Quiz</>}
                                </button>
                            </div>
                        </div>

                        {/* ════════════════════════════════════════
                            BACK — Quiz
                        ════════════════════════════════════════ */}
                        <div className="db-face db-back">

                            {/* Quiz header */}
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c6aff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Brain size={14} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
                                        Knowledge Check
                                    </span>
                                </div>
                                <button onClick={resetToCoach}
                                    style={{
                                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                                        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                                        transition: 'background 0.2s, color 0.2s',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    <ChevronLeft size={12} /> Back
                                </button>
                            </div>

                            {/* Score screen */}
                            {submitted && quizScore !== null ? (
                                <div style={{ textAlign: 'center', paddingTop: 24, animation: 'db-fadeUp 0.4s ease' }}>
                                    <div className="db-trophy" style={{ marginBottom: 20 }}>
                                        <div style={{
                                            width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                                            background: quizScore >= 70
                                                ? 'radial-gradient(circle, rgba(0,229,160,0.2), transparent)'
                                                : 'radial-gradient(circle, rgba(255,159,67,0.2), transparent)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Trophy size={44} color={quizScore >= 70 ? 'var(--db-green)' : 'var(--db-orange)'} />
                                        </div>
                                    </div>
                                    <div className="db-score-num" style={{ color: quizScore >= 70 ? 'var(--db-green)' : 'var(--db-orange)' }}>
                                        {quizScore}<span style={{ fontSize: 36, opacity: 0.6 }}>%</span>
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: '14px 0 8px', fontFamily: "'Outfit', sans-serif" }}>
                                        {quizScore >= 70 ? '🎉 Topic Mastered!' : '📚 Keep Reviewing'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 28px', fontFamily: "'Outfit', sans-serif" }}>
                                        {quizScore >= 70
                                            ? 'Marked as complete. Moving to your next topic shortly…'
                                            : 'Review the explanation tab and revisit this quiz when ready.'}
                                    </p>

                                    {/* Score breakdown bar */}
                                    <div style={{ width: '100%', maxWidth: 280, margin: '0 auto 28px', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 8,
                                            background: quizScore >= 70
                                                ? 'linear-gradient(90deg, #00e5a0, #00b884)'
                                                : 'linear-gradient(90deg, #ff9f43, #ff6b6b)',
                                            width: `${quizScore}%`,
                                            transition: 'width 1s ease 0.3s',
                                        }} />
                                    </div>

                                    <button onClick={resetToCoach}
                                        style={{
                                            padding: '12px 32px', borderRadius: 40,
                                            background: 'linear-gradient(135deg, #7c6aff, #a78bfa)',
                                            border: 'none', color: '#fff', fontWeight: 700,
                                            fontSize: 14, cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(124,106,255,0.4)',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}>
                                        Continue Learning
                                    </button>
                                </div>

                            ) : qObj ? (
                                <div style={{ animation: 'db-slideLeft 0.3s ease' }}>
                                    {/* Progress bar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'Outfit', sans-serif" }}>
                                            {currentQIdx + 1} <span style={{ opacity: 0.5 }}>/ {qs.length}</span>
                                        </span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {qs.map((_, i) => (
                                                <div key={i} style={{
                                                    width: i === currentQIdx ? 18 : 6, height: 6,
                                                    borderRadius: 3,
                                                    background: answers[qs[i]?.questionId || `q${i}`]
                                                        ? 'var(--accent-primary)'
                                                        : i === currentQIdx
                                                            ? 'rgba(124,106,255,0.5)'
                                                            : 'rgba(255,255,255,0.1)',
                                                    transition: 'width 0.3s, background 0.3s',
                                                }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 28, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: 'linear-gradient(90deg, #7c6aff, #a78bfa)',
                                            width: `${((currentQIdx + 1) / qs.length) * 100}%`,
                                            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                                        }} />
                                    </div>

                                    <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6, marginBottom: 24, fontFamily: "'Outfit', sans-serif" }}>
                                        {qObj.questionText}
                                    </h3>

                                    {['A', 'B', 'C', 'D'].map((opt, oi) => {
                                        if (!qObj.options?.[opt]) return null;
                                        const isSel = selectedOpt === opt;
                                        return (
                                            <button key={opt} onClick={() => selectAnswer(opt)}
                                                className={`db-opt ${isSel ? 'selected' : ''}`}
                                                style={{ animationDelay: `${oi * 0.06}s` }}
                                            >
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                                    background: isSel ? 'linear-gradient(135deg, #7c6aff, #a78bfa)' : 'rgba(255,255,255,0.05)',
                                                    border: isSel ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 11, fontWeight: 800,
                                                    color: isSel ? '#fff' : 'var(--text-secondary)',
                                                    transition: 'background 0.2s, border 0.2s',
                                                    boxShadow: isSel ? '0 2px 10px rgba(124,106,255,0.4)' : 'none',
                                                }}>
                                                    {opt}
                                                </div>
                                                <span style={{ fontSize: 14, fontWeight: isSel ? 600 : 400, fontFamily: "'Outfit', sans-serif" }}>
                                                    {qObj.options[opt]}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
                                        <button
                                            onClick={() => setCurrentQIdx(c => Math.max(0, c - 1))}
                                            disabled={currentQIdx === 0}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '10px 18px', borderRadius: 30,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: currentQIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                                cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer',
                                                fontSize: 13, fontWeight: 600,
                                                fontFamily: "'Outfit', sans-serif",
                                                transition: 'background 0.2s',
                                            }}>
                                            <ChevronLeft size={13} /> Prev
                                        </button>

                                        {currentQIdx < qs.length - 1 ? (
                                            <button onClick={() => setCurrentQIdx(c => c + 1)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '10px 22px', borderRadius: 30,
                                                    background: 'linear-gradient(135deg, #7c6aff, #a78bfa)',
                                                    border: 'none', color: '#fff', fontWeight: 600,
                                                    fontSize: 13, cursor: 'pointer',
                                                    boxShadow: '0 3px 14px rgba(124,106,255,0.35)',
                                                    fontFamily: "'Outfit', sans-serif",
                                                }}>
                                                Next <ChevronRight size={13} />
                                            </button>
                                        ) : (
                                            <button onClick={submitQuiz}
                                                disabled={!allAnswered || submitLoading}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '10px 22px', borderRadius: 30,
                                                    background: allAnswered ? 'linear-gradient(135deg, #00e5a0, #00b884)' : 'rgba(255,255,255,0.08)',
                                                    border: 'none', color: allAnswered ? '#fff' : 'var(--text-muted)',
                                                    fontWeight: 700, fontSize: 13,
                                                    cursor: allAnswered && !submitLoading ? 'pointer' : 'not-allowed',
                                                    boxShadow: allAnswered ? '0 3px 14px rgba(0,229,160,0.3)' : 'none',
                                                    transition: 'background 0.3s, box-shadow 0.3s',
                                                    fontFamily: "'Outfit', sans-serif",
                                                }}>
                                                {submitLoading
                                                    ? <Loader size={13} style={{ animation: 'db-spin 0.7s linear infinite' }} />
                                                    : <><CheckCircle size={13} /> Submit Quiz</>}
                                            </button>
                                        )}
                                    </div>
                                </div>

                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span className="db-dot" /><span className="db-dot" /><span className="db-dot" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCES PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ReferencesPanel({ references }) {
    if (!references) return <div style={{ padding: 24 }}><ContentSkeleton /></div>;

    if (typeof references === 'string') {
        return <div style={{ padding: '20px 24px', animation: 'db-slideLeft 0.3s ease' }}>{parseMarkdown(references)}</div>;
    }

    if (Array.isArray(references) && references.length > 0) {
        return (
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {references.map((ref, idx) => {
                    let hostname = ref.url;
                    try { hostname = new URL(ref.url).hostname.replace('www.', ''); } catch {}
                    return (
                        <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.07)',
                                textDecoration: 'none',
                                transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
                                animation: `db-fadeUp 0.3s ease ${idx * 0.07}s both`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,255,0.4)'; e.currentTarget.style.background = 'rgba(124,106,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = ''; }}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: 'rgba(124,106,255,0.12)',
                                border: '1px solid rgba(124,106,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ExternalLink size={15} color="var(--accent-primary)" />
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontFamily: "'Outfit', sans-serif" }}>
                                    {ref.title || hostname}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
                                    {hostname}
                                </div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </a>
                    );
                })}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,106,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExternalLink size={20} style={{ opacity: 0.4 }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>No resources found for this topic</p>
        </div>
    );
}
