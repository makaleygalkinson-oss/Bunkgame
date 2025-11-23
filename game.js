// Логика страницы игры

let currentLobbyId = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Получаем ID лобби из sessionStorage
    const lobbyIdStr = sessionStorage.getItem('currentLobbyId');
    if (!lobbyIdStr) {
        console.error('ID лобби не найден');
        window.location.href = 'index.html';
        return;
    }
    
    currentLobbyId = parseInt(lobbyIdStr);
    
    // Настраиваем кнопку выхода
    setupExitButton();
    
    // Загружаем информацию о лобби
    await loadLobbyInfo();
    
    // Обновляем last_seen при активности
    startLastSeenUpdates();
});

// Настройка кнопки выхода из лобби
function setupExitButton() {
    const exitBtn = document.getElementById('exitLobbyBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', async () => {
            await exitFromLobby();
        });
    }
}

// Выход из лобби
async function exitFromLobby() {
    try {
        const userStr = sessionStorage.getItem('currentUser');
        if (!userStr) {
            window.location.href = 'index.html';
            return;
        }
        
        const user = JSON.parse(userStr);
        
        // Обновляем запись пользователя в БД - убираем lobby_id
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                lobby_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('Ошибка выхода из лобби:', updateError);
            alert('Ошибка выхода из лобби. Попробуйте позже.');
            return;
        }
        
        // Удаляем информацию о лобби из sessionStorage
        sessionStorage.removeItem('currentLobbyId');
        
        // Переходим на главную страницу
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Ошибка выхода из лобби:', err);
        alert('Ошибка выхода из лобби. Попробуйте позже.');
    }
}

// Загрузка информации о лобби
async function loadLobbyInfo() {
    const gameInfo = document.getElementById('gameInfo');
    if (!gameInfo) return;
    
    try {
        // Получаем информацию о лобби
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('lobby_id, creator_name, active_role')
            .eq('lobby_id', currentLobbyId)
            .maybeSingle();
        
        if (lobbyError) {
            console.error('Ошибка загрузки лобби:', lobbyError);
            gameInfo.innerHTML = '<p class="game-error">Ошибка загрузки информации о лобби</p>';
            return;
        }
        
        if (!lobby) {
            gameInfo.innerHTML = '<p class="game-error">Лобби не найдено</p>';
            return;
        }
        
        // Получаем список игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', currentLobbyId);
        
        if (playersError) {
            console.error('Ошибка загрузки игроков:', playersError);
        }
        
        const roleNames = {
            'maniac': 'Маньяк',
            'killer': 'Убийца',
            'both': 'Маньяк и убийца',
            'none': 'Без активных ролей'
        };
        
        const roleName = roleNames[lobby.active_role] || lobby.active_role;
        const playersList = players && players.length > 0 
            ? players.map(p => p.name || p.email).join(', ')
            : 'Нет игроков';
        
        gameInfo.innerHTML = `
            <div class="game-lobby-info">
                <p><strong>ID Лобби:</strong> ${lobby.lobby_id}</p>
                <p><strong>Создатель:</strong> ${lobby.creator_name || '-'}</p>
                <p><strong>Роль:</strong> ${roleName}</p>
                <p><strong>Игроки:</strong> ${playersList}</p>
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка загрузки информации о лобби:', err);
        gameInfo.innerHTML = '<p class="game-error">Ошибка загрузки информации о лобби</p>';
    }
}

// Обновление last_seen для авторизованного пользователя
let lastSeenUpdateTimer = null;
const LAST_SEEN_DEBOUNCE = 5000;

async function updateUserLastSeen() {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return;
    
    if (lastSeenUpdateTimer) {
        clearTimeout(lastSeenUpdateTimer);
    }
    
    lastSeenUpdateTimer = setTimeout(async () => {
        try {
            const user = JSON.parse(userStr);
            
            const { error } = await supabase
                .from('users')
                .update({ 
                    last_seen: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (error) {
                console.error('Ошибка обновления last_seen:', error);
            }
        } catch (err) {
            console.error('Ошибка обновления last_seen:', err);
        }
    }, LAST_SEEN_DEBOUNCE);
}

let lastSeenUpdateInterval = null;
let activityListenersAdded = false;

function startLastSeenUpdates() {
    updateUserLastSeen();
    
    if (lastSeenUpdateInterval) {
        clearInterval(lastSeenUpdateInterval);
    }
    
    lastSeenUpdateInterval = setInterval(() => {
        updateUserLastSeen();
    }, 15000);
    
    if (!activityListenersAdded) {
        activityListenersAdded = true;
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(eventType => {
            document.addEventListener(eventType, updateUserLastSeen, { passive: true });
        });
    }
}

window.addEventListener('beforeunload', () => {
    if (lastSeenUpdateInterval) {
        clearInterval(lastSeenUpdateInterval);
    }
    updateUserLastSeen();
});
