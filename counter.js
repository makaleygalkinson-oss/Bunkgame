// Real-time счётчик посетителей с мгновенными обновлениями
class VisitorCounter {
    constructor() {
        this.counterElement = document.getElementById('visitorCount');
        this.apiUrl = '/api/counter';
        this.sessionId = this.getOrCreateSessionId();
        this.isActive = true;
        this.lastUpdate = 0;
        this.rafId = null;
        this.updateDebounceTimer = null;
        this.lastStableCount = 0;
        this.countHistory = []; // История значений для стабилизации
        this.init();
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('visitor_session_id', sessionId);
        }
        return sessionId;
    }

    async init() {
        // Регистрируем посетителя
        await this.registerVisitor();
        
        // Начинаем real-time обновления
        this.startRealTimeUpdates();
        
        // Отслеживание активности
        this.setupActivityTracking();
        
        // Обновление при возврате на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.registerVisitor();
            } else {
                this.isActive = false;
            }
        });
    }

    async registerVisitor() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId
                },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDisplay(data.count);
                this.sessionId = data.sessionId || this.sessionId;
                localStorage.setItem('visitor_session_id', this.sessionId);
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
        }
    }

    async updateCounter() {
        if (!this.isActive || document.hidden) return;
        
        const now = Date.now();
        // Дебаунсинг - обновляем не чаще чем раз в 500мс
        if (now - this.lastUpdate < 500) return;
        this.lastUpdate = now;

        try {
            // Используем только GET запрос для получения актуального счётчика
            const response = await fetch(`${this.apiUrl}?sessionId=${encodeURIComponent(this.sessionId)}&t=${now}`, {
                method: 'GET',
                headers: {
                    'X-Session-ID': this.sessionId,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDisplayStable(data.count);
            }
        } catch (error) {
            // Тихая обработка ошибок
        }
    }
    
    // Обновление счётчика со стабилизацией (предотвращает дрожание)
    updateDisplayStable(count) {
        if (!this.counterElement) return;
        
        const targetCount = count || 0;
        
        // Добавляем в историю
        this.countHistory.push(targetCount);
        if (this.countHistory.length > 5) {
            this.countHistory.shift(); // Оставляем только последние 5 значений
        }
        
        // Определяем стабильное значение (самое частое в последних значениях)
        const stableCount = this.getStableCount();
        
        const currentCount = parseInt(this.counterElement.textContent) || 0;
        
        // Обновляем только если значение стабильно изменилось
        if (stableCount !== currentCount && stableCount !== this.lastStableCount) {
            this.lastStableCount = stableCount;
            this.counterElement.textContent = stableCount;
        }
    }
    
    // Получить стабильное значение из истории
    getStableCount() {
        if (this.countHistory.length === 0) return 0;
        
        // Если все значения одинаковые - возвращаем их
        const allSame = this.countHistory.every(val => val === this.countHistory[0]);
        if (allSame) return this.countHistory[0];
        
        // Иначе возвращаем последнее значение (самое актуальное)
        return this.countHistory[this.countHistory.length - 1];
    }

    updateDisplay(count) {
        if (!this.counterElement) return;
        
        const currentCount = parseInt(this.counterElement.textContent) || 0;
        const targetCount = count || 0;
        
        if (currentCount !== targetCount) {
            // МГНОВЕННОЕ обновление БЕЗ анимации - никаких задержек
            this.counterElement.textContent = targetCount;
            // Убираем все анимации и переходы для мгновенного отклика
            this.counterElement.style.transform = 'none';
        }
    }

    startRealTimeUpdates() {
        // Обновляем каждые 800мс для стабильности (не слишком часто)
        this.updateIntervalId = setInterval(() => {
            if (this.isActive && !document.hidden) {
                this.updateCounter();
            }
        }, 800);
        
        // Также обновляем активность через POST каждые 3 секунды
        this.activityUpdateInterval = setInterval(() => {
            if (this.isActive && !document.hidden) {
                this.registerVisitor();
            }
        }, 3000);
    }

    setupActivityTracking() {
        let activityTimeout;
        let lastActivity = Date.now();
        
        const markActivity = () => {
            lastActivity = Date.now();
            this.isActive = true;
            
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                // Если нет активности 5 секунд, помечаем как неактивного
                if (Date.now() - lastActivity > 5000) {
                    this.isActive = false;
                }
            }, 5000);
            
            // Мгновенное обновление при любой активности - без ограничений
            this.updateCounter();
        };
        
        // Отслеживание всех видов активности
        ['mousemove', 'mousedown', 'keydown', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, markActivity, { passive: true });
        });
        
        // Периодическая проверка активности
        setInterval(() => {
            if (Date.now() - lastActivity < 10000) {
                this.isActive = true;
            }
        }, 1000);
    }

    removeVisitor() {
        // МАКСИМАЛЬНО БЫСТРОЕ удаление сессии при выходе
        const url = `${this.apiUrl}?action=delete&sessionId=${encodeURIComponent(this.sessionId)}`;
        
        // Множественные попытки для гарантии отправки
        // 1. sendBeacon - самый быстрый способ
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url);
        }
        
        // 2. Fetch с keepalive - параллельно
        fetch(url, {
            method: 'DELETE',
            headers: {
                'X-Session-ID': this.sessionId
            },
            keepalive: true
        }).catch(() => {});
        
        // 3. Еще одна попытка через POST для надежности
        fetch(this.apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId
            },
            body: JSON.stringify({ sessionId: this.sessionId }),
            keepalive: true
        }).catch(() => {});
        
        // 4. Синхронный XMLHttpRequest как последняя попытка (блокирующий, но гарантированный)
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('DELETE', url, false); // false = синхронный
            xhr.setRequestHeader('X-Session-ID', this.sessionId);
            xhr.send();
        } catch (e) {
            // Игнорируем
        }
    }

    destroy() {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }
        if (this.activityUpdateInterval) {
            clearInterval(this.activityUpdateInterval);
        }
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }
        // Удаляем посетителя при закрытии
        this.removeVisitor();
    }
}

// Инициализация
let visitorCounter;
document.addEventListener('DOMContentLoaded', () => {
    visitorCounter = new VisitorCounter();
});

// Немедленное удаление при закрытии вкладки
window.addEventListener('beforeunload', () => {
    if (visitorCounter) {
        visitorCounter.removeVisitor();
    }
});

window.addEventListener('unload', () => {
    if (visitorCounter) {
        visitorCounter.removeVisitor();
    }
});

// Также при скрытии страницы - удаляем сразу
document.addEventListener('visibilitychange', () => {
    if (document.hidden && visitorCounter) {
        visitorCounter.isActive = false;
        // Удаляем сразу при скрытии для мгновенного обновления
        visitorCounter.removeVisitor();
    }
});
