// Real-time API endpoint для счётчика посетителей
// Используем глобальное хранилище для отслеживания активных посетителей

const globalStore = {
    visitors: new Map(),
    subscribers: new Set(), // Для broadcast обновлений
    lastBroadcast: 0
};

const SESSION_TIMEOUT = 8000; // 8 секунд - время неактивности (увеличено для стабильности)
const BROADCAST_INTERVAL = 500; // Broadcast каждые 500мс для плавности

function cleanupVisitors() {
    const now = Date.now();
    const activeVisitors = new Map();
    
    for (const [sessionId, lastSeen] of globalStore.visitors.entries()) {
        if (now - lastSeen <= SESSION_TIMEOUT) {
            activeVisitors.set(sessionId, lastSeen);
        }
    }
    
    globalStore.visitors = activeVisitors;
    return globalStore.visitors.size;
}

function broadcastUpdate(count) {
    const now = Date.now();
    // Без ограничений - broadcast всегда
    globalStore.lastBroadcast = now;
    
    // Отправляем обновление всем подписчикам
    const message = JSON.stringify({ count, timestamp: now });
    globalStore.subscribers.forEach(subscriber => {
        try {
            subscriber(message);
        } catch (e) {
            // Игнорируем ошибки
        }
    });
}

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    cleanupVisitors();
    const now = Date.now();

    // Обработка DELETE через query параметр (для sendBeacon)
    if (req.query?.action === 'delete' || req.method === 'DELETE') {
        let sessionId = req.query?.sessionId || req.headers['x-session-id'];
        
        if (!sessionId && req.body) {
            try {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                sessionId = body.sessionId;
            } catch (e) {
                // Игнорируем
            }
        }
        
        if (sessionId && globalStore.visitors.has(sessionId)) {
            globalStore.visitors.delete(sessionId);
            const count = cleanupVisitors();
            broadcastUpdate(count);
            
            return res.status(200).json({
                success: true,
                count: count
            });
        }
        
        const count = cleanupVisitors();
        return res.status(200).json({
            success: true,
            count: count
        });
    }

    if (req.method === 'POST') {
        // Регистрация или обновление посетителя
        let sessionId = req.headers['x-session-id'];
        
        if (!sessionId && req.body) {
            try {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                sessionId = body.sessionId;
            } catch (e) {
                // Игнорируем
            }
        }
        
        if (!sessionId) {
            sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Обновляем активность
        const wasNew = !globalStore.visitors.has(sessionId);
        globalStore.visitors.set(sessionId, now);
        const count = cleanupVisitors();
        
        // Broadcast обновление если что-то изменилось
        if (wasNew || count !== globalStore.visitors.size) {
            broadcastUpdate(count);
        }

        return res.status(200).json({
            success: true,
            count: count,
            sessionId: sessionId
        });
    }

    if (req.method === 'GET') {
        // Получение текущего количества
        let sessionId = req.query?.sessionId || req.headers['x-session-id'];
        
        if (sessionId) {
            if (globalStore.visitors.has(sessionId)) {
                globalStore.visitors.set(sessionId, now);
            } else {
                globalStore.visitors.set(sessionId, now);
            }
        }
        
        const count = cleanupVisitors();

        return res.status(200).json({
            count: count,
            timestamp: now
        });
    }


    return res.status(405).json({ error: 'Method not allowed' });
}
