// Конфигурация Supabase
// ЗАМЕНИТЕ эти значения на ваши из Supabase Dashboard

const SUPABASE_URL = 'https://gvyjznoxikvydoygnpww.supabase.co'; // Например: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eWp6bm94aWt2eWRveWducHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjY1MzYsImV4cCI6MjA3OTQwMjUzNn0.pkSMxd7a1wt2VzM0-JnFVBIKob5q_LWCK1NkTthzqMc'; // Ваш публичный ключ

// Инициализация Supabase клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Генерация уникального ID устройства
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
        // Создаём уникальный ID на основе характеристик устройства
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Создаём хеш из fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
}

// Получение информации об устройстве
function getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
    
    let deviceType = 'desktop';
    if (isTablet) {
        deviceType = 'tablet';
    } else if (isMobile) {
        deviceType = 'mobile';
    }
    
    return {
        device_id: getDeviceId(),
        device_type: deviceType,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        platform: navigator.platform
    };
}


