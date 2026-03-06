import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
    Upload, FileText, Clock, Calendar, Target, ChevronDown, ChevronRight,
    Check, Loader, BookOpen,
} from 'lucide-react';
import api from '../lib/api';

export default function StudyPlanPage() {
    const toast = useToast();
    const navigate = useNavigate();

    // Upload state
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [materials, setMaterials] = useState([]);
    const fileRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [topicName, setTopicName] = useState('');
    const [dailyMinutes, setDailyMinutes] = useState(60);
    const [totalDays, setTotalDays] = useState(14);
    const [learningGoal, setLearningGoal] = useState('exploration');
    const [generating, setGenerating] = useState(false);

    // Plan display
    const [plans, setPlans] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});

    useEffect(() => {
        loadMaterials();
        loadPlans();
    }, []);

    async function loadMaterials() {
        try {
            const res = await api.getMaterials();
            setMaterials(res.materials || []);
        } catch { /* API not connected */ }
    }

    async function loadPlans() {
        try {
            const res = await api.getPlans();
            setPlans(res.plans || []);
            if (res.plans?.length > 0) setActivePlan(res.plans[0]);
        } catch { /* API not connected */ }
    }

    function handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === 'application/pdf') setFile(dropped);
        else toast.error('Only PDF files are supported');
    }

    function handleFileSelect(e) {
        const selected = e.target.files[0];
        if (selected?.type === 'application/pdf') setFile(selected);
        else toast.error('Only PDF files are supported');
    }

    async function handleUpload() {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            toast.error('File must be under 50MB');
            return;
        }

        setUploading(true);
        try {
            const res = await api.uploadMaterial(file);
            if (res.presignedUrl) {
                await api.uploadToS3(res.presignedUrl, file);
            }
            toast.success('Material uploaded successfully!');
            setFile(null);
            loadMaterials();
        } catch (err) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleGeneratePlan() {
        if (!selectedMaterial && !topicName.trim()) {
            toast.error('Select a material or enter a topic name first');
            return;
        }
        if (dailyMinutes < 15 || dailyMinutes > 480) {
            toast.error('Daily time must be 15-480 minutes');
            return;
        }
        if (totalDays < 1 || totalDays > 365) {
            toast.error('Days must be 1-365');
            return;
        }

        setGenerating(true);
        try {
            const apiPayload = { dailyMinutes, totalDays, learningGoal };
            if (topicName.trim()) {
                apiPayload.topicName = topicName.trim();
                // Send an empty string or null for materialId if not needed by your api format.
            }

            const res = await api.generatePlan(selectedMaterial || null, apiPayload);
            toast.success('Study plan generated!');
            navigate('/'); // Direct to dashboard to see new plan immediately
        } catch (err) {
            toast.error(err.message || 'Plan generation failed');
        } finally {
            setGenerating(false);
        }
    }

    function toggleDay(dayNum) {
        setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
    }

    async function toggleTopic(topicId, completed) {
        try {
            if (completed) {
                await api.markIncomplete(topicId);
            } else {
                await api.markComplete(topicId);
            }
            // Update local state
            setActivePlan(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                updated.days = updated.days.map(day => ({
                    ...day,
                    topics: day.topics.map(t =>
                        t.topicId === topicId ? { ...t, completed: !completed } : t
                    ),
                }));
                return updated;
            });
            toast.success(completed ? 'Topic unmarked' : 'Topic completed! 🎉');
        } catch {
            toast.error('Failed to update topic');
        }
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Study Plan</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Upload materials and generate a personalized learning roadmap
            </p>

            {/* Upload Section */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={18} /> Upload Learning Material
                </h3>

                <div
                    className={`upload-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag} onDragOver={handleDrag}
                    onDragLeave={handleDrag} onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                >
                    <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
                    <div className="upload-icon"><FileText size={28} /></div>
                    {file ? (
                        <>
                            <div className="upload-text">{file.name}</div>
                            <div className="upload-hint">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                        </>
                    ) : (
                        <>
                            <div className="upload-text">Drop your PDF here or click to browse</div>
                            <div className="upload-hint">Supports PDF files up to 50MB</div>
                        </>
                    )}
                </div>

                {file && (
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                            {uploading ? <><Loader size={16} className="spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Plan Generation */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={18} /> Generate Study Plan
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Select Material
                        </label>
                        <select
                            value={selectedMaterial}
                            onChange={e => {
                                setSelectedMaterial(e.target.value);
                                if (e.target.value) setTopicName('');
                            }}
                            style={{ width: '100%', padding: '10px 14px', marginBottom: 8 }}
                            disabled={!!topicName.trim()}
                        >
                            <option value="">{materials.length === 0 ? "No uploaded materials" : "Choose material..."}</option>
                            {materials.map(m => (
                                <option key={m.materialId} value={m.materialId}>{m.fileName}</option>
                            ))}
                        </select>
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0' }}>— OR —</div>
                        <input
                            type="text"
                            placeholder="Enter a topic name..."
                            value={topicName}
                            onChange={e => {
                                setTopicName(e.target.value);
                                if (e.target.value) setSelectedMaterial('');
                            }}
                            style={{ width: '100%', padding: '10px 14px' }}
                            disabled={!!selectedMaterial}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <Clock size={13} style={{ verticalAlign: -2 }} /> Daily Study Time (minutes)
                        </label>
                        <input
                            type="number" min={15} max={480} value={dailyMinutes}
                            onChange={e => setDailyMinutes(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px 14px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <Calendar size={13} style={{ verticalAlign: -2 }} /> Total Days
                        </label>
                        <input
                            type="number" min={1} max={365} value={totalDays}
                            onChange={e => setTotalDays(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px 14px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <Target size={13} style={{ verticalAlign: -2 }} /> Learning Goal
                        </label>
                        <select
                            value={learningGoal}
                            onChange={e => setLearningGoal(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px' }}
                        >
                            <option value="exam">Exam Preparation</option>
                            <option value="interview">Interview Preparation</option>
                            <option value="exploration">Exploring Concepts</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleGeneratePlan} disabled={generating || (!selectedMaterial && !topicName.trim())}>
                        {generating ? <><Loader size={16} className="spin" /> Generating...</> : <><Sparkles size={16} /> Generate Plan</>}
                    </button>
                </div>
            </div>

            {/* Plan Display */}
            {activePlan?.days && activePlan.days.length > 0 && (
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                        📚 Your Study Plan — {activePlan.days.length} Days
                    </h3>

                    {activePlan.days.map(day => (
                        <div className="plan-day" key={day.dayNumber}>
                            <div className="plan-day-header" onClick={() => toggleDay(day.dayNumber)}>
                                <h3>
                                    {expandedDays[day.dayNumber] ? <ChevronDown size={16} style={{ verticalAlign: -3 }} /> : <ChevronRight size={16} style={{ verticalAlign: -3 }} />}
                                    {' '}Day {day.dayNumber}
                                </h3>
                                <span>{day.topics?.length || 0} topics · {day.totalEstimatedMinutes || 0} min</span>
                            </div>

                            {expandedDays[day.dayNumber] && (
                                <div className="plan-topics">
                                    {day.topics?.map(topic => (
                                        <div className={`plan-topic ${topic.completed ? 'completed' : ''}`} key={topic.topicId}>
                                            <div
                                                className={`plan-topic-check ${topic.completed ? 'completed' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleTopic(topic.topicId, topic.completed); }}
                                            >
                                                {topic.completed && <Check size={14} color="#fff" />}
                                            </div>
                                            <div className="plan-topic-info">
                                                <div className="plan-topic-title">{topic.title}</div>
                                                <div className="plan-topic-meta">
                                                    {topic.estimatedMinutes} min · {topic.description || ''}
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-icon btn-sm"
                                                title="Study this topic"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/topic/${topic.topicId}`); }}
                                                style={{ marginLeft: 'auto', borderRadius: '50%', color: 'var(--accent-primary)' }}
                                            >
                                                <BookOpen size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {(!activePlan || !activePlan.days || activePlan.days.length === 0) && materials.length === 0 && (
                <div className="empty-state">
                    <FileText size={48} />
                    <h3>No study plans yet</h3>
                    <p>Upload a PDF and generate your personalized study plan to get started.</p>
                </div>
            )}
        </div>
    );
}

function Sparkles({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}
