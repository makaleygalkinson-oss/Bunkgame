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
        
        // Настраиваем значки разблокировки (один раз при инициализации)
        setupRevealIcons();
        
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
                    <div class="player-info-item">
                        <strong>Пол и возраст:</strong> ${currentPlayerData.genderAge}
                        <span class="reveal-icon" data-item="genderAge" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Профессия:</strong> ${currentPlayerData.profession}
                        <span class="reveal-icon" data-item="profession" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Состояние здоровья:</strong> ${currentPlayerData.health}
                        <span class="reveal-icon" data-item="health" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Хобби:</strong> ${currentPlayerData.hobby}
                        <span class="reveal-icon" data-item="hobby" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Фобия:</strong> ${currentPlayerData.phobia}
                        <span class="reveal-icon" data-item="phobia" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Факт №1:</strong> ${currentPlayerData.fact1}
                        <span class="reveal-icon" data-item="fact1" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Факт №2:</strong> ${currentPlayerData.fact2}
                        <span class="reveal-icon" data-item="fact2" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Карточка действия №1:</strong> ${currentPlayerData.action1}
                        <span class="reveal-icon" data-item="action1" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                    <div class="player-info-item">
                        <strong>Карточка действия №2:</strong> ${currentPlayerData.action2}
                        <span class="reveal-icon" data-item="action2" data-player-id="${currentPlayer.id}" title="Разблокировать параметр">👁️</span>
                    </div>
                </div>
            `;
            
            // Настраиваем обработчики для значков разблокировки
            setupRevealIcons();
            
            // Восстанавливаем состояние разблокированных параметров
            restoreRevealedItems();
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
                                    <div class="player-info-item" data-item="genderAge" data-player-id="${player.id}"><strong>Пол и возраст:</strong> <span class="blurred-text">${playerData.genderAge}</span></div>
                                    <div class="player-info-item" data-item="profession" data-player-id="${player.id}"><strong>Профессия:</strong> <span class="blurred-text">${playerData.profession}</span></div>
                                    <div class="player-info-item" data-item="health" data-player-id="${player.id}"><strong>Состояние здоровья:</strong> <span class="blurred-text">${playerData.health}</span></div>
                                    <div class="player-info-item" data-item="hobby" data-player-id="${player.id}"><strong>Хобби:</strong> <span class="blurred-text">${playerData.hobby}</span></div>
                                    <div class="player-info-item" data-item="phobia" data-player-id="${player.id}"><strong>Фобия:</strong> <span class="blurred-text">${playerData.phobia}</span></div>
                                    <div class="player-info-item" data-item="fact1" data-player-id="${player.id}"><strong>Факт №1:</strong> <span class="blurred-text">${playerData.fact1}</span></div>
                                    <div class="player-info-item" data-item="fact2" data-player-id="${player.id}"><strong>Факт №2:</strong> <span class="blurred-text">${playerData.fact2}</span></div>
                                    <div class="player-info-item" data-item="action1" data-player-id="${player.id}"><strong>Карточка действия №1:</strong> <span class="blurred-text">${playerData.action1}</span></div>
                                    <div class="player-info-item" data-item="action2" data-player-id="${player.id}"><strong>Карточка действия №2:</strong> <span class="blurred-text">${playerData.action2}</span></div>
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
function setupRevealIcons() {
    // Используем делегирование событий для значков разблокировки
    document.addEventListener('click', async (e) => {
        const icon = e.target.closest('.reveal-icon');
        if (!icon) return;
        
        e.stopPropagation(); // Предотвращаем переворот карточки
        
        const itemType = icon.getAttribute('data-item');
        const playerId = icon.getAttribute('data-player-id');
        
        if (!itemType || !playerId) return;
        
        // Проверяем, не использован ли уже этот значок
        if (icon.classList.contains('used')) {
            return; // Уже использован
        }
        
        console.log('Разблокировка параметра:', itemType, 'для игрока:', playerId);
        console.log('Типы данных:', typeof itemType, typeof playerId);
        
        // Сохраняем разблокировку в Supabase
        await saveRevealState(playerId, itemType);
        
        // Убираем blur локально (с небольшой задержкой для гарантии)
        setTimeout(() => {
            revealItem(playerId, itemType);
        }, 100);
        
        // Делаем иконку неактивной после использования
        icon.classList.add('used');
        icon.style.opacity = '0.5';
        icon.style.cursor = 'not-allowed';
    });
}

// Сохранение состояния разблокировки в Supabase
async function saveRevealState(playerId, itemType) {
    try {
        if (!currentLobbyId) return;
        
        // Получаем текущее состояние разблокировки из лобби
        const { data: lobby, error: fetchError } = await supabase
            .from('lobbies')
            .select('revealed_items')
            .eq('id', parseInt(currentLobbyId))
            .single();
        
        if (fetchError) {
            console.error('Ошибка получения данных лобби:', fetchError);
            return;
        }
        
        // Инициализируем объект разблокированных элементов
        let revealedItems = lobby.revealed_items || {};
        if (!revealedItems[playerId]) {
            revealedItems[playerId] = {};
        }
        
        // Добавляем разблокированный параметр
        revealedItems[playerId][itemType] = true;
        
        // Сохраняем в Supabase
        const { error: updateError } = await supabase
            .from('lobbies')
            .update({ revealed_items: revealedItems })
            .eq('id', parseInt(currentLobbyId));
        
        if (updateError) {
            console.error('Ошибка сохранения разблокировки:', updateError);
        } else {
            console.log('Разблокировка сохранена:', playerId, itemType);
        }
    } catch (err) {
        console.error('Ошибка сохранения состояния разблокировки:', err);
    }
}

// Функция для разблокировки пункта (убирает blur)
function revealItem(playerId, itemType) {
    console.log('revealItem вызвана:', playerId, itemType);
    
    // Преобразуем playerId в строку для сравнения
    const playerIdStr = String(playerId);
    
    // Находим все элементы с данным типом для данного игрока
    // Ищем во всех карточках, включая перевёрнутые
    const allItems = document.querySelectorAll(`.player-info-item[data-item="${itemType}"]`);
    console.log('Всего элементов с data-item:', allItems.length);
    
    let foundCount = 0;
    allItems.forEach((item, index) => {
        const itemPlayerId = item.getAttribute('data-player-id');
        console.log(`Элемент ${index + 1}: playerId="${itemPlayerId}" (ожидаем "${playerIdStr}")`);
        
        // Сравниваем playerId (может быть UUID или число)
        if (String(itemPlayerId) === playerIdStr) {
            foundCount++;
            console.log(`✓ Найден элемент ${index + 1} для игрока ${playerIdStr}`);
            
            const blurredText = item.querySelector('.blurred-text');
            console.log('Найден blurred-text:', blurredText);
            
            if (blurredText) {
                blurredText.classList.remove('blurred-text');
                console.log('✓ Blur убран с элемента');
            } else {
                console.log('✗ blurred-text не найден в элементе');
            }
        }
    });
    
    console.log(`Итого обработано элементов: ${foundCount}`);
    
    if (foundCount === 0) {
        console.error('⚠ Элементы не найдены! Проверьте playerId и itemType');
    }
}

// Восстановление состояния разблокированных параметров
function restoreRevealedItems() {
    if (!currentLobbyId) return;
    
    // Получаем состояние разблокировки из лобби
    supabase
        .from('lobbies')
        .select('revealed_items')
        .eq('id', parseInt(currentLobbyId))
        .single()
        .then(({ data: lobby, error }) => {
            if (error) {
                console.error('Ошибка получения разблокированных элементов:', error);
                return;
            }
            
            const revealedItems = lobby?.revealed_items || {};
            
            // Применяем разблокировку ко всем параметрам
            Object.keys(revealedItems).forEach(playerId => {
                const playerRevealed = revealedItems[playerId] || {};
                Object.keys(playerRevealed).forEach(itemType => {
                    if (playerRevealed[itemType]) {
                        revealItem(playerId, itemType);
                        
                        // Помечаем иконки как использованные
                        const icon = document.querySelector(`.reveal-icon[data-item="${itemType}"][data-player-id="${playerId}"]`);
                        if (icon) {
                            icon.classList.add('used');
                            icon.style.opacity = '0.5';
                            icon.style.cursor = 'not-allowed';
                        }
                    }
                });
            });
        });
}

// Подписка на realtime обновления разблокировки
function subscribeToRevealUpdates() {
    if (!currentLobbyId) return;
    
    // Отписываемся от предыдущей подписки
    unsubscribeFromRevealUpdates();
    
    // Подписываемся на изменения в таблице lobbies
    revealRealtimeChannel = supabase
        .channel(`reveal-updates-${currentLobbyId}`)
        .on('postgres_changes', 
            { 
                event: 'UPDATE',
                schema: 'public',
                table: 'lobbies',
                filter: `id=eq.${currentLobbyId}`
            },
            (payload) => {
                console.log('Обновление разблокировки:', payload);
                const revealedItems = payload.new.revealed_items || {};
                
                // Обновляем все карточки игроков
                Object.keys(revealedItems).forEach(playerId => {
                    const playerRevealed = revealedItems[playerId] || {};
                    Object.keys(playerRevealed).forEach(itemType => {
                        if (playerRevealed[itemType]) {
                            revealItem(playerId, itemType);
                        }
                    });
                });
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

