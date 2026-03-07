import { fetchAuthSession } from 'aws-amplify/auth';

// In dev: uses Vite proxy (/aws-api → AWS API Gateway, bypasses CORS)
// In production: set VITE_API_URL to your full AWS endpoint URL
const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL           // production: direct AWS URL
    : '/aws-api';                             // dev: via Vite proxy (no CORS issues)

async function getHeaders() {
    try {
        const session = await fetchAuthSession({ forceRefresh: false });
        const token = session.tokens?.idToken?.toString();
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    } catch {
        return { 'Content-Type': 'application/json' };
    }
}

async function request(method, path, body = null) {
    const headers = await getHeaders();
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data.message || `Request failed: ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

const api = {
    // Auth
    register: (email, password) => request('POST', '/auth/register', { email, password }),
    deleteAccount: () => request('DELETE', '/auth/user'),

    // Materials
    uploadMaterial: (file) => {
        // Step 1: Get presigned URL
        return request('POST', '/materials/upload', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
        });
    },
    uploadToS3: async (presignedUrl, file) => {
        await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });
    },
    getMaterials: () => request('GET', '/materials'),
    getMaterial: (id) => request('GET', `/materials/${id}`),
    processMaterial: (id) => request('POST', `/materials/${id}`), 

    // Study Plans
    generatePlan: (materialId, params) =>
        request('POST', '/plans/generate', { materialId, ...params }),
    getPlans: () => request('GET', '/plans'),
    getPlan: (planId) => request('GET', `/plans/${planId}`),
    modifyPlan: (planId, params) => request('PUT', `/plans/${planId}`, params),

    // Content
    getExplanation: (topicId) => request('GET', `/content/explain/${topicId}`),
    getSimplified: (topicId) => request('GET', `/content/simplify/${topicId}`),
    clarifyTerm: (term, context) => request('POST', '/content/clarify', { term, context }),
    getReferences: (topicId) => request('GET', `/content/references/${topicId}`),

    // Quizzes
    generateTopicQuiz: (topicId) => request('POST', `/quizzes/generate/topic/${topicId}`),
    generateContextQuiz: (topicIds) => request('POST', '/quizzes/generate/context', { topicIds }),
    submitQuiz: (quizId, answers) => request('POST', `/quizzes/${quizId}/submit`, { answers }),
    getQuizResults: (quizId) => request('GET', `/quizzes/${quizId}/results`),

    // Progress
    markComplete: (topicId) => request('POST', `/progress/topics/${topicId}/complete`),
    markIncomplete: (topicId) => request('DELETE', `/progress/topics/${topicId}/complete`),
    getProgress: (planId) => request('GET', `/progress/${planId}`),
    getStreak: () => request('GET', '/progress/streak'),
    getDashboard: () => request('GET', '/dashboard'),

    // Notifications
    updateNotifPrefs: (prefs) => request('PUT', '/notifications/preferences', prefs),
    getNotifHistory: () => request('GET', '/notifications/history'),

    // Doubts
    createDoubtSession: (context) => request('POST', '/doubts/session', context),
    askDoubt: (sessionId, question) => request('POST', '/doubts/ask', { sessionId, question }),
    getDoubtHistory: (sessionId) => request('GET', `/doubts/session/${sessionId}`),
    closeDoubtSession: (sessionId) => request('DELETE', `/doubts/session/${sessionId}`),
    getFrequentDoubts: () => request('GET', '/doubts/frequent'),
};

export default api;
