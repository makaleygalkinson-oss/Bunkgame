// Логика страницы игры

let currentLobbyId = null;
let currentUserId = null;
let revealRealtimeChannel = null;

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
        
        // Загружаем голосование
        await loadVoting();
        
        // Настраиваем кнопку выхода
        setupExitButton();
        
        // Настраиваем переворот карточек
        setupFlipCards();
        
        // Подписываемся на realtime обновления разблокировки
        subscribeToRevealUpdates();
        
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
                    <div class="player-info-item" data-item="genderAge">
                        <span class="item-content"><strong>Пол и возраст:</strong> ${currentPlayerData.genderAge}</span>
                        <span class="reveal-icon" data-reveal="genderAge">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="profession">
                        <span class="item-content"><strong>Профессия:</strong> ${currentPlayerData.profession}</span>
                        <span class="reveal-icon" data-reveal="profession">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="health">
                        <span class="item-content"><strong>Состояние здоровья:</strong> ${currentPlayerData.health}</span>
                        <span class="reveal-icon" data-reveal="health">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="hobby">
                        <span class="item-content"><strong>Хобби:</strong> ${currentPlayerData.hobby}</span>
                        <span class="reveal-icon" data-reveal="hobby">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="phobia">
                        <span class="item-content"><strong>Фобия:</strong> ${currentPlayerData.phobia}</span>
                        <span class="reveal-icon" data-reveal="phobia">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="fact1">
                        <span class="item-content"><strong>Факт №1:</strong> ${currentPlayerData.fact1}</span>
                        <span class="reveal-icon" data-reveal="fact1">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="fact2">
                        <span class="item-content"><strong>Факт №2:</strong> ${currentPlayerData.fact2}</span>
                        <span class="reveal-icon" data-reveal="fact2">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="action1">
                        <span class="item-content"><strong>Карточка действия №1:</strong> ${currentPlayerData.action1}</span>
                        <span class="reveal-icon" data-reveal="action1">👁️</span>
                    </div>
                    <div class="player-info-item" data-item="action2">
                        <span class="item-content"><strong>Карточка действия №2:</strong> ${currentPlayerData.action2}</span>
                        <span class="reveal-icon" data-reveal="action2">👁️</span>
                    </div>
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
                    <div class="flip-card" style="min-height: 900px; width: 468px; flex-shrink: 0;" data-player-id="${player.id}">
                        <div class="flip-card-inner flipped">
                            <div class="flip-card-front game-block player-card-block">
                                <div class="game-block-header">
                                    <h2 class="game-block-title">${playerName}</h2>
                                </div>
                                <div class="game-block-content player-card-info">
                                    <div class="player-info-item blurred" data-item="genderAge" data-player-id="${player.id}"><strong>Пол и возраст:</strong> ${playerData.genderAge}</div>
                                    <div class="player-info-item blurred" data-item="profession" data-player-id="${player.id}"><strong>Профессия:</strong> ${playerData.profession}</div>
                                    <div class="player-info-item blurred" data-item="health" data-player-id="${player.id}"><strong>Состояние здоровья:</strong> ${playerData.health}</div>
                                    <div class="player-info-item blurred" data-item="hobby" data-player-id="${player.id}"><strong>Хобби:</strong> ${playerData.hobby}</div>
                                    <div class="player-info-item blurred" data-item="phobia" data-player-id="${player.id}"><strong>Фобия:</strong> ${playerData.phobia}</div>
                                    <div class="player-info-item blurred" data-item="fact1" data-player-id="${player.id}"><strong>Факт №1:</strong> ${playerData.fact1}</div>
                                    <div class="player-info-item blurred" data-item="fact2" data-player-id="${player.id}"><strong>Факт №2:</strong> ${playerData.fact2}</div>
                                    <div class="player-info-item blurred" data-item="action1" data-player-id="${player.id}"><strong>Карточка действия №1:</strong> ${playerData.action1}</div>
                                    <div class="player-info-item blurred" data-item="action2" data-player-id="${player.id}"><strong>Карточка действия №2:</strong> ${playerData.action2}</div>
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
            
            // Восстанавливаем состояние разблокированных пунктов из sessionStorage
            if (currentPlayer) {
                restoreRevealStates(currentPlayer.id);
                // Настраиваем обработчики для значков разблокировки после создания всех карточек
                setupRevealIcons(currentPlayer.id);
            }
        }
        
    } catch (err) {
        console.error('Ошибка загрузки информации о игроках:', err);
        currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Загрузка голосования
async function loadVoting() {
    const votingContent = document.getElementById('votingContent');
    if (!votingContent) return;
    
    try {
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков для голосования:', playersError);
            votingContent.innerHTML = '<p class="game-error">Ошибка загрузки игроков</p>';
            return;
        }
        
        if (!players || players.length === 0) {
            votingContent.innerHTML = '<p>Нет игроков в лобби</p>';
            return;
        }
        
        // Создаем список игроков с кнопками голосования
        const votingHTML = players.map(player => {
            const playerName = player.name || player.email || 'Неизвестный';
            return `
                <div class="voting-item">
                    <span class="voting-player-name">${playerName}</span>
                    <button class="voting-btn" disabled>Голосовать</button>
                </div>
            `;
        }).join('');
        
        votingContent.innerHTML = `
            <div class="voting-list">
                ${votingHTML}
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка загрузки голосования:', err);
        votingContent.innerHTML = '<p class="game-error">Ошибка загрузки голосования</p>';
    }
}

// Настройка значков разблокировки
function setupRevealIcons(currentPlayerId) {
    // Используем делегирование событий для значков
    const currentPlayerCard = document.getElementById('currentPlayerCard');
    if (!currentPlayerCard) return;
    
    // Удаляем старые обработчики, если они есть
    const newHandler = async (e) => {
        const icon = e.target.closest('.reveal-icon');
        if (!icon) return;
        
        e.stopPropagation(); // Предотвращаем переворот карточки
        const itemType = icon.getAttribute('data-reveal');
        
        // Проверяем, не использован ли уже этот значок
        if (icon.style.opacity === '0.5' || icon.classList.contains('used')) {
            return; // Уже использован
        }
        
        // Сохраняем разблокировку в БД
        await saveRevealState(currentPlayerId, itemType);
        
        // Убираем blur локально
        revealItem(currentPlayerId, itemType);
        
        // Делаем иконку неактивной после использования
        icon.style.opacity = '0.5';
        icon.style.cursor = 'not-allowed';
        icon.classList.add('used');
    };
    
    // Удаляем предыдущий обработчик, если он был
    currentPlayerCard.removeEventListener('click', currentPlayerCard._revealHandler);
    currentPlayerCard._revealHandler = newHandler;
    currentPlayerCard.addEventListener('click', newHandler);
}

// Сохранение состояния разблокировки в БД
async function saveRevealState(playerId, itemType) {
    try {
        // Создаем или обновляем запись о разблокировке
        // Используем таблицу для хранения разблокированных пунктов
        // Пока сохраняем в sessionStorage для быстрого доступа
        const revealKey = `revealed_${playerId}_${itemType}`;
        sessionStorage.setItem(revealKey, 'true');
        
        // Можно также сохранить в БД через Supabase, если есть таблица для этого
        // Пока используем sessionStorage + realtime broadcast
    } catch (err) {
        console.error('Ошибка сохранения состояния разблокировки:', err);
    }
}

// Функция для разблокировки пункта
function revealItem(playerId, itemType) {
    console.log('Разблокировка пункта:', itemType, 'для игрока:', playerId);
    
    // Убираем blur с соответствующего пункта в карточке этого игрока среди других игроков
    const selector = `.player-card-info .player-info-item[data-item="${itemType}"][data-player-id="${playerId}"]`;
    console.log('Селектор:', selector);
    
    const otherItems = document.querySelectorAll(selector);
    console.log('Найдено элементов:', otherItems.length);
    
    otherItems.forEach(item => {
        console.log('Убираем blur с элемента:', item);
        item.classList.remove('blurred');
    });
    
    // Также проверяем все элементы с этим itemType и playerId
    const allItems = document.querySelectorAll(`[data-item="${itemType}"][data-player-id="${playerId}"]`);
    console.log('Всего элементов с такими атрибутами:', allItems.length);
    allItems.forEach(item => {
        item.classList.remove('blurred');
    });
}

// Подписка на realtime обновления разблокировки
function subscribeToRevealUpdates() {
    if (!currentLobbyId) return;
    
    // Отписываемся от предыдущей подписки
    unsubscribeFromRevealUpdates();
    
    // Подписываемся на изменения в таблице users для обновления карточек игроков
    revealRealtimeChannel = supabase
        .channel(`reveal-updates-${currentLobbyId}`)
        .on('postgres_changes', 
            { 
                event: '*',
                schema: 'public',
                table: 'users',
                filter: `lobby_id=eq.${currentLobbyId}`
            },
            (payload) => {
                console.log('Обновление игроков:', payload);
                // Перезагружаем информацию о игроках при изменениях
                loadPlayersInfo();
            }
        )
        .subscribe();
}

// Отписка от обновлений
function unsubscribeFromRevealUpdates() {
    if (revealRealtimeChannel) {
        supabase.removeChannel(revealRealtimeChannel);
        revealRealtimeChannel = null;
    }
}

// Восстановление состояния разблокированных пунктов
function restoreRevealStates(playerId) {
    const itemTypes = ['genderAge', 'profession', 'health', 'hobby', 'phobia', 'fact1', 'fact2', 'action1', 'action2'];
    
    itemTypes.forEach(itemType => {
        const revealKey = `revealed_${playerId}_${itemType}`;
        if (sessionStorage.getItem(revealKey) === 'true') {
            revealItem(playerId, itemType);
            
            // Помечаем иконку как использованную
            const icon = document.querySelector(`.reveal-icon[data-reveal="${itemType}"]`);
            if (icon) {
                icon.style.opacity = '0.5';
                icon.style.cursor = 'not-allowed';
                icon.classList.add('used');
            }
        }
    });
}

// Настройка переворота карточек
function setupFlipCards() {
    // Используем делегирование событий для всех карточек
    document.addEventListener('click', (e) => {
        // Не переворачиваем карточку при клике на иконку разблокировки
        if (e.target.closest('.reveal-icon')) {
            return;
        }
        
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
        
        // Отписываемся от realtime обновлений
        unsubscribeFromRevealUpdates();
        
        // Возвращаемся на главную страницу
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Ошибка выхода из лобби:', err);
        // В случае ошибки всё равно возвращаемся на главную
        window.location.href = 'index.html';
    }
}

