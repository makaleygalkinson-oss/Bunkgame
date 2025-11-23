// Управление лобби

let lobbiesChannel = null;

// Инициализация системы лобби
function initLobbiesSystem() {
    console.log('🔧 Инициализация системы лобби...');
    
    // Получаем текущего пользователя
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
        }
    });
    
    // Отслеживание изменений авторизации
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
        } else if (event === 'SIGNED_OUT') {
            if (typeof window !== 'undefined') {
                window.currentUserId = null;
            }
        }
    });
    
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
        
        // Получаем все активные лобби (игроки с lobby_id > 0)
        const { data: usersInLobbies, error } = await supabase
            .from('users')
            .select('id, email, name, lobby_id')
            .gt('lobby_id', 0)
            .order('lobby_id', { ascending: true });
        
        if (error) {
            console.error('Ошибка получения лобби:', error);
            lobbiesList.innerHTML = '<p class="lobbies-error">Ошибка загрузки лобби</p>';
            return;
        }
        
        if (!usersInLobbies || usersInLobbies.length === 0) {
            lobbiesList.innerHTML = '<p class="lobbies-empty">Активных лобби нет</p>';
            return;
        }
        
        // Группируем игроков по lobby_id
        const lobbiesMap = new Map();
        usersInLobbies.forEach(user => {
            const lobbyId = user.lobby_id;
            if (!lobbiesMap.has(lobbyId)) {
                lobbiesMap.set(lobbyId, []);
            }
            lobbiesMap.get(lobbyId).push(user);
        });
        
        // Отображаем лобби
        lobbiesList.innerHTML = '';
        
        const MAX_PLAYERS = 16; // Максимальное количество игроков в лобби
        
        lobbiesMap.forEach((players, lobbyId) => {
            const lobbyCard = document.createElement('div');
            lobbyCard.className = 'lobby-card';
            
            // Получаем ники игроков
            const playerNames = players.map(player => {
                return player.name || player.email || 'Игрок';
            });
            
            const userId = (typeof window !== 'undefined' && window.currentUserId) || null;
            const isUserInLobby = userId && players.some(p => p.id === userId);
            
            const playersCount = players.length;
            const playersCountText = `${playersCount}/${MAX_PLAYERS}`;
            
            lobbyCard.innerHTML = `
                <div class="lobby-header">
                    <span class="lobby-count-badge">${playersCountText}</span>
                    <h3 class="lobby-title">Лобби ${lobbyId}</h3>
                </div>
                <div class="lobby-players">
                    <p class="lobby-players-list">${playerNames.join(', ')}</p>
                </div>
                ${isUserInLobby ? '<button class="lobby-connect-btn" data-lobby-id="' + lobbyId + '">CONNECT</button>' : ''}
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

// Группировка игроков в лобби (не используется, заменено на группировку по lobby_id)
function groupPlayersIntoLobbies(players) {
    // Эта функция больше не используется, так как лобби теперь определяются по lobby_id в таблице users
    return [];
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
                    table: 'users',
                    filter: 'lobby_id=gt.0'
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
    document.addEventListener('DOMContentLoaded', () => {
        initLobbiesSystem();
    });
} else {
    initLobbiesSystem();
}

