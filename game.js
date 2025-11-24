// Логика страницы игры

let currentLobbyId = null;
let currentUserId = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Страница игры загружена');
    
    // Проверяем наличие Supabase
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase не загружен');
        return;
    }
    
    // Получаем информацию о пользователе и лобби
    const userStr = sessionStorage.getItem('currentUser');
    const lobbyIdStr = sessionStorage.getItem('currentLobbyId');
    
    if (!userStr) {
        console.log('❌ Пользователь не авторизован, возвращаем на главную');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        currentUserId = user.id;
        
        if (!lobbyIdStr) {
            // Если нет lobby_id в sessionStorage, проверяем БД
            const { data: userData, error } = await supabase
                .from('users')
                .select('lobby_id')
                .eq('id', currentUserId)
                .maybeSingle();
            
            if (error) {
                console.error('Ошибка проверки lobby_id:', error);
                window.location.href = 'index.html';
                return;
            }
            
            if (!userData || !userData.lobby_id || userData.lobby_id === 0) {
                console.log('ℹ️ Пользователь не в лобби, возвращаем на главную');
                window.location.href = 'index.html';
                return;
            }
            
            currentLobbyId = userData.lobby_id.toString();
            sessionStorage.setItem('currentLobbyId', currentLobbyId);
        } else {
            currentLobbyId = lobbyIdStr;
        }
        
        // Загружаем информацию о лобби
        await loadLobbyInfo();
        
        // Загружаем информацию о игроках
        await loadPlayersInfo();
        
        // Настраиваем кнопку выхода
        setupExitButton();
        
    } catch (err) {
        console.error('Ошибка инициализации игры:', err);
        window.location.href = 'index.html';
    }
});

// Загрузка информации о лобби
async function loadLobbyInfo() {
    const gameInfo = document.getElementById('gameInfo');
    if (!gameInfo) return;
    
    try {
        // Получаем информацию о лобби
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('lobby_id, creator_name, active_role')
            .eq('lobby_id', parseInt(currentLobbyId))
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
            .eq('lobby_id', parseInt(currentLobbyId));
        
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
                <p><strong>Создатель:</strong> ${lobby.creator_name}</p>
                <p><strong>Активная роль:</strong> ${roleName}</p>
                <p><strong>Игроки в лобби:</strong> ${playersList}</p>
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка загрузки информации о лобби:', err);
        gameInfo.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Настройка кнопки выхода
function setupExitButton() {
    const exitBtn = document.getElementById('exitLobbyBtn');
    if (!exitBtn) {
        console.error('❌ Кнопка выхода не найдена');
        return;
    }
    
    exitBtn.addEventListener('click', async () => {
        const confirmExit = confirm('Вы уверены, что хотите выйти из лобби?');
        if (!confirmExit) return;
        
        await exitFromLobby();
    });
}

// Загрузка информации о игроках
async function loadPlayersInfo() {
    const currentPlayerNameEl = document.getElementById('currentPlayerName');
    const currentPlayerCardEl = document.getElementById('currentPlayerCard');
    const playersContent = document.getElementById('playersContent');
    
    if (!currentPlayerNameEl || !currentPlayerCardEl || !playersContent) return;
    
    try {
        // Получаем информацию о текущем пользователе
        const userStr = sessionStorage.getItem('currentUser');
        if (!userStr) return;
        
        const currentUser = JSON.parse(userStr);
        const currentUserName = currentUser.name || currentUser.email || 'Неизвестный';
        
        // Отображаем ник текущего пользователя в шапке
        currentPlayerNameEl.textContent = currentUserName;
        
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков:', playersError);
            currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки игроков</p>';
            return;
        }
        
        if (!players || players.length === 0) {
            currentPlayerCardEl.innerHTML = '<p>Нет игроков в лобби</p>';
            return;
        }
        
        // Находим текущего игрока и остальных
        const currentPlayer = players.find(p => p.id === currentUserId);
        const otherPlayers = players.filter(p => p.id !== currentUserId);
        
        // Карточка текущего игрока (просто текст, без внутренних блоков)
        if (currentPlayer) {
            currentPlayerCardEl.innerHTML = `<div class="player-card">${currentUserName}</div>`;
        } else {
            currentPlayerCardEl.innerHTML = '<p>Ошибка: текущий игрок не найден</p>';
        }
        
        // Карточки других игроков (ВНЕ карточки текущего игрока)
        if (otherPlayers.length === 0) {
            playersContent.innerHTML = '';
        } else {
            const otherPlayersHTML = otherPlayers.map(player => {
                const playerName = player.name || player.email || 'Неизвестный';
                return `<div class="player-card">${playerName}</div>`;
            }).join('');
            
            playersContent.innerHTML = `<div class="players-list">${otherPlayersHTML}</div>`;
        }
        
    } catch (err) {
        console.error('Ошибка загрузки информации о игроках:', err);
        currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Выход из лобби
async function exitFromLobby() {
    try {
        if (!currentUserId) {
            window.location.href = 'index.html';
            return;
        }
        
        // Отключаем кнопку выхода
        const exitBtn = document.getElementById('exitLobbyBtn');
        if (exitBtn) {
            exitBtn.disabled = true;
            exitBtn.textContent = 'Выход...';
        }
        
        // Сбрасываем lobby_id в БД (устанавливаем в NULL или пустую строку)
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                lobby_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);
        
        if (updateError) {
            console.error('Ошибка выхода из лобби:', updateError);
        }
        
        // Удаляем информацию о лобби из sessionStorage
        sessionStorage.removeItem('currentLobbyId');
        
        // Возвращаемся на главную страницу
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Ошибка выхода из лобби:', err);
        // В случае ошибки всё равно возвращаемся на главную
        window.location.href = 'index.html';
    }
}

