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
        
        // Загружаем карточку бункера
        loadBunkerCard();
        
        // Настраиваем кнопку выхода
        setupExitButton();
        
        // Настраиваем переворот карточек
        setupFlipCards();
        
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

// Загрузка карточки бункера
function loadBunkerCard() {
    const bunkerCardContent = document.getElementById('bunkerCardContent');
    if (!bunkerCardContent) return;
    
    // Генерируем рандомные значения для карточки бункера
    const catastrophe = Math.floor(Math.random() * 100) + 1;
    const catastropheDesc = Math.floor(Math.random() * 100) + 1;
    const lifetime = Math.floor(Math.random() * 100) + 1;
    const capacity = Math.floor(Math.random() * 100) + 1;
    const medpoint = Math.floor(Math.random() * 100) + 1;
    const mechanicRoom = Math.floor(Math.random() * 100) + 1;
    const growingRoom = Math.floor(Math.random() * 100) + 1;
    const specialSupply = Math.floor(Math.random() * 100) + 1;
    
    bunkerCardContent.innerHTML = `
        <div class="bunker-card-info">
            <div class="bunker-info-item"><strong>Катастрофа:</strong> ${catastrophe}</div>
            <div class="bunker-info-item"><strong>Описание катастрофы:</strong> ${catastropheDesc}</div>
            <div class="bunker-info-item"><strong>Срок жизни в бункере:</strong> ${lifetime}</div>
            <div class="bunker-info-item"><strong>Условия Бункера:</strong> (вместимость: ${capacity} человек)</div>
            <div class="bunker-info-item"><strong>Оснащение бункера:</strong></div>
            <div class="bunker-info-subitem">Медпункт: ${medpoint}</div>
            <div class="bunker-info-subitem">Комната механика: ${mechanicRoom}</div>
            <div class="bunker-info-subitem">Комната выращивания: ${growingRoom}</div>
            <div class="bunker-info-item"><strong>Спец.Снабжение:</strong> ${specialSupply}</div>
        </div>
    `;
}

// Генерация стабильных рандомных значений для игрока на основе его ID
function generatePlayerCardData(playerId) {
    // Используем ID игрока как seed для генерации стабильных значений
    const seed = playerId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Простая функция для генерации псевдослучайных чисел на основе seed
    function seededRandom(seed, index) {
        const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
    
    return {
        genderAge: Math.floor(seededRandom(seed, 1) * 100) + 1,
        profession: Math.floor(seededRandom(seed, 2) * 100) + 1,
        health: Math.floor(seededRandom(seed, 3) * 100) + 1,
        hobby: Math.floor(seededRandom(seed, 4) * 100) + 1,
        phobia: Math.floor(seededRandom(seed, 5) * 100) + 1,
        fact1: Math.floor(seededRandom(seed, 6) * 100) + 1,
        fact2: Math.floor(seededRandom(seed, 7) * 100) + 1,
        action1: Math.floor(seededRandom(seed, 8) * 100) + 1,
        action2: Math.floor(seededRandom(seed, 9) * 100) + 1
    };
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
        
        // Генерируем данные для карточки текущего игрока
        if (currentPlayer) {
            const currentPlayerData = generatePlayerCardData(currentPlayer.id);
            currentPlayerCardEl.innerHTML = `
                <div class="player-card-info">
                    <div class="player-info-item"><strong>Пол и возраст:</strong> ${currentPlayerData.genderAge}</div>
                    <div class="player-info-item"><strong>Профессия:</strong> ${currentPlayerData.profession}</div>
                    <div class="player-info-item"><strong>Состояние здоровья:</strong> ${currentPlayerData.health}</div>
                    <div class="player-info-item"><strong>Хобби:</strong> ${currentPlayerData.hobby}</div>
                    <div class="player-info-item"><strong>Фобия:</strong> ${currentPlayerData.phobia}</div>
                    <div class="player-info-item"><strong>Факт №1:</strong> ${currentPlayerData.fact1}</div>
                    <div class="player-info-item"><strong>Факт №2:</strong> ${currentPlayerData.fact2}</div>
                    <div class="player-info-item"><strong>Карточка действия №1:</strong> ${currentPlayerData.action1}</div>
                    <div class="player-info-item"><strong>Карточка действия №2:</strong> ${currentPlayerData.action2}</div>
                </div>
            `;
        } else {
            currentPlayerCardEl.innerHTML = '';
        }
        
        // Карточки других игроков (ВНЕ карточки текущего игрока)
        if (otherPlayers.length === 0) {
            playersContent.innerHTML = '';
        } else {
            const otherPlayersHTML = otherPlayers.map(player => {
                const playerName = player.name || player.email || 'Неизвестный';
                
                // Генерируем стабильные значения для карточки игрока на основе его ID
                const playerData = generatePlayerCardData(player.id);
                
                return `
                    <div class="flip-card" style="min-height: 900px; width: 468px; flex-shrink: 0;">
                        <div class="flip-card-inner flipped">
                            <div class="flip-card-front game-block player-card-block">
                                <div class="game-block-header">
                                    <h2 class="game-block-title">${playerName}</h2>
                                </div>
                                <div class="game-block-content player-card-info">
                                    <div class="player-info-item"><strong>Пол и возраст:</strong> ${playerData.genderAge}</div>
                                    <div class="player-info-item"><strong>Профессия:</strong> ${playerData.profession}</div>
                                    <div class="player-info-item"><strong>Состояние здоровья:</strong> ${playerData.health}</div>
                                    <div class="player-info-item"><strong>Хобби:</strong> ${playerData.hobby}</div>
                                    <div class="player-info-item"><strong>Фобия:</strong> ${playerData.phobia}</div>
                                    <div class="player-info-item"><strong>Факт №1:</strong> ${playerData.fact1}</div>
                                    <div class="player-info-item"><strong>Факт №2:</strong> ${playerData.fact2}</div>
                                    <div class="player-info-item"><strong>Карточка действия №1:</strong> ${playerData.action1}</div>
                                    <div class="player-info-item"><strong>Карточка действия №2:</strong> ${playerData.action2}</div>
                                </div>
                            </div>
                            <div class="flip-card-back">
                                <img src="bunker-logo.png" alt="BUNKER THE BOARD GAME" class="bunker-logo">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            playersContent.innerHTML = `<div class="players-list">${otherPlayersHTML}</div>`;
        }
        
    } catch (err) {
        console.error('Ошибка загрузки информации о игроках:', err);
        currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Настройка переворота карточек
function setupFlipCards() {
    // Используем делегирование событий для всех карточек
    document.addEventListener('click', (e) => {
        const flipCard = e.target.closest('.flip-card');
        if (flipCard) {
            const flipCardInner = flipCard.querySelector('.flip-card-inner');
            if (flipCardInner) {
                flipCardInner.classList.toggle('flipped');
            }
        }
    });
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

