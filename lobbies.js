// Управление лобби

let lobbiesChannel = null;
let currentDeviceId = null;

// Инициализация системы лобби
function initLobbiesSystem() {
    console.log('🔧 Инициализация системы лобби...');
    
    // Получаем device_id
    const deviceInfo = typeof getDeviceInfo === 'function' ? getDeviceInfo() : { device_id: null };
    currentDeviceId = deviceInfo.device_id;
    
    if (typeof window !== 'undefined') {
        window.currentDeviceId = currentDeviceId;
    }
    
    // Настройка кнопки и модального окна
    setupLobbiesModal();
    
    // Подписка на обновления лобби
    subscribeToLobbiesUpdates();
}

// Настройка модального окна лобби
function setupLobbiesModal() {
    const lobbiesBtn = document.getElementById('lobbiesBtn');
    const lobbiesModal = document.getElementById('lobbiesModal');
    const closeLobbiesModal = document.getElementById('closeLobbiesModal');
    
    if (!lobbiesModal) {
        console.error('❌ Модальное окно лобби не найдено!');
        return;
    }
    
    console.log('🔧 Настройка модального окна лобби...');
    
    // Обработчик кнопки открытия (удаляем старый, если есть, и добавляем новый)
    if (lobbiesBtn) {
        // Клонируем кнопку, чтобы удалить все старые обработчики
        const newLobbiesBtn = lobbiesBtn.cloneNode(true);
        lobbiesBtn.parentNode.replaceChild(newLobbiesBtn, lobbiesBtn);
        
        newLobbiesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Кнопка ЛОББИ нажата');
            const freshModal = document.getElementById('lobbiesModal');
            if (freshModal) {
                freshModal.style.display = 'flex';
                updateLobbiesList(); // Обновляем список при открытии
            }
        });
        console.log('✅ Обработчик кнопки ЛОББИ добавлен');
    } else {
        console.warn('⚠️ Кнопка ЛОББИ не найдена');
    }
    
    // Обработчик кнопки закрытия (крестик)
    if (closeLobbiesModal) {
        // Клонируем кнопку закрытия, чтобы удалить все старые обработчики
        const newCloseBtn = closeLobbiesModal.cloneNode(true);
        closeLobbiesModal.parentNode.replaceChild(newCloseBtn, closeLobbiesModal);
        
        newCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Кнопка закрытия лобби нажата');
            const freshModal = document.getElementById('lobbiesModal');
            if (freshModal) {
                freshModal.style.display = 'none';
            }
        });
        console.log('✅ Обработчик кнопки закрытия добавлен');
    } else {
        console.warn('⚠️ Кнопка закрытия лобби не найдена');
    }
    
    // Закрытие при клике вне модального окна (удаляем старый обработчик, если есть)
    // Клонируем модальное окно, чтобы удалить все старые обработчики
    const newLobbiesModal = lobbiesModal.cloneNode(true);
    lobbiesModal.parentNode.replaceChild(newLobbiesModal, lobbiesModal);
    
    // Получаем свежие элементы после клонирования
    const freshLobbiesModal = document.getElementById('lobbiesModal');
    const freshCloseLobbiesModal = document.getElementById('closeLobbiesModal');
    
    if (freshLobbiesModal) {
        // Закрытие при клике вне модального окна
        freshLobbiesModal.addEventListener('click', (e) => {
            // Проверяем, что клик был именно по фону модального окна, а не по его содержимому
            if (e.target === freshLobbiesModal) {
                console.log('🖱️ Клик вне модального окна лобби');
                freshLobbiesModal.style.display = 'none';
            }
        });
        
        // Предотвращаем закрытие при клике на содержимое модального окна
        const modalContent = freshLobbiesModal.querySelector('.lobbies-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation(); // Останавливаем всплытие события
            });
            console.log('✅ Обработчик для содержимого модального окна добавлен');
        }
    }
    
    console.log('✅ Модальное окно лобби настроено');
}

// Обновление списка лобби
async function updateLobbiesList() {
    const lobbiesList = document.getElementById('lobbiesList');
    if (!lobbiesList) return;
    
    try {
        lobbiesList.innerHTML = '<p class="lobbies-loading">Загрузка лобби...</p>';
        
        // Получаем все активные лобби (игры, которые начались)
        // Лобби = группы игроков из ready_players, которые находятся в игре
        const { data: readyPlayers, error } = await supabase
            .from('ready_players')
            .select('device_id, ready_at')
            .order('ready_at', { ascending: true });
        
        if (error) {
            console.error('Ошибка получения лобби:', error);
            lobbiesList.innerHTML = '<p class="lobbies-error">Ошибка загрузки лобби</p>';
            return;
        }
        
        // Группируем игроков по времени готовности (в пределах 5 минут = одно лобби)
        const lobbies = groupPlayersIntoLobbies(readyPlayers || []);
        
        if (lobbies.length === 0) {
            lobbiesList.innerHTML = '<p class="lobbies-empty">Активных лобби нет</p>';
            return;
        }
        
        // Отображаем лобби
        lobbiesList.innerHTML = '';
        
        lobbies.forEach((lobby, index) => {
            const lobbyCard = document.createElement('div');
            lobbyCard.className = 'lobby-card';
            
            const lobbyPlayers = lobby.players.map((deviceId, idx) => {
                const shortId = deviceId ? deviceId.substring(0, 8) : '';
                return `Игрок ${idx + 1} (${shortId})`;
            });
            
            const deviceId = (typeof window !== 'undefined' && window.currentDeviceId) || currentDeviceId || null;
            const isUserInLobby = deviceId && lobby.players.includes(deviceId);
            
            lobbyCard.innerHTML = `
                <div class="lobby-header">
                    <h3 class="lobby-title">Лобби ${index + 1}</h3>
                    <span class="lobby-players-count">Игроков: ${lobby.players.length}</span>
                </div>
                <div class="lobby-players">
                    <p class="lobby-players-list">${lobbyPlayers.join(', ')}</p>
                </div>
                ${isUserInLobby ? '<button class="lobby-connect-btn" data-lobby-id="' + lobby.id + '">CONNECT</button>' : ''}
            `;
            
            // Обработчик кнопки CONNECT
            if (isUserInLobby) {
                const connectBtn = lobbyCard.querySelector('.lobby-connect-btn');
                if (connectBtn) {
                    connectBtn.addEventListener('click', () => {
                        window.location.href = 'game.html';
                    });
                }
            }
            
            lobbiesList.appendChild(lobbyCard);
        });
        
    } catch (err) {
        console.error('Ошибка обновления списка лобби:', err);
        lobbiesList.innerHTML = '<p class="lobbies-error">Ошибка загрузки лобби</p>';
    }
}

// Группировка игроков в лобби
function groupPlayersIntoLobbies(players) {
    if (!players || players.length === 0) return [];
    
    // Все игроки в ready_players считаются одним лобби (игра началась)
    // Лобби создается когда игра запускается (все нажали READY и админ нажал START GAME)
    // Все игроки в ready_players находятся в одном активном лобби
    
    if (players.length < 4) {
        // Если игроков меньше 4 - лобби еще не создано (игра не началась)
        return [];
    }
    
    // Создаем одно лобби со всеми игроками
    const lobby = {
        id: 'lobby_' + Date.now(),
        players: players.map(p => p.device_id),
        startTime: Math.min(...players.map(p => new Date(p.ready_at).getTime()))
    };
    
    return [lobby];
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLobbiesSystem();
    });
} else {
    initLobbiesSystem();
}

// Подписка на обновления лобби
function subscribeToLobbiesUpdates() {
    try {
        lobbiesChannel = supabase
            .channel('lobbies_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'ready_players' 
                }, 
                (payload) => {
                    // Обновляем список лобби при изменениях
                    const lobbiesModal = document.getElementById('lobbiesModal');
                    if (lobbiesModal && lobbiesModal.style.display === 'flex') {
                        updateLobbiesList();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time подписка на лобби активна');
                }
            });
    } catch (err) {
        console.log('ℹ️ Real-time подписка на лобби недоступна');
    }
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLobbiesSystem);
} else {
    initLobbiesSystem();
}

