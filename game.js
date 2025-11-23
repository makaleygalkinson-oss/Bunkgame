// Логика игры "Бункер"

console.log('🎮 Страница игры загружена');

let currentDeviceId = null;
let playersCountInterval = null;
let lastPlayersCount = -1; // Последнее известное количество игроков
let playersChannel = null; // Канал для real-time обновлений
let lastPlayersList = null; // Последний список игроков (для предотвращения моргания)

// Предотвращаем удаление записи из ready_players при переходе на страницу игры
// Это важно, чтобы счетчик игроков работал правильно
window.addEventListener('beforeunload', (e) => {
    // НЕ удаляем запись при переходе на страницу игры
    // Запись должна остаться, чтобы другие игроки видели, что игрок в игре
    console.log('ℹ️ Переход на страницу игры - запись остается в ready_players');
});

// Ждем загрузки DOM и Supabase
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен');
    
    // Проверяем наличие элемента
    const playersValueEl = document.getElementById('playersInGame');
    if (!playersValueEl) {
        console.error('❌ Элемент playersInGame не найден!');
        return;
    }
    console.log('✅ Элемент playersInGame найден');
    
    // Проверяем наличие supabase
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase не загружен!');
        return;
    }
    console.log('✅ Supabase загружен');
    
    // Получаем device_id
    const deviceInfo = typeof getDeviceInfo === 'function' ? getDeviceInfo() : { device_id: null };
    currentDeviceId = deviceInfo.device_id;
    
    if (!currentDeviceId) {
        console.log('❌ Device ID не найден, возвращаем на главную');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Device ID получен:', currentDeviceId);
    
    // Проверяем, есть ли запись в ready_players
    (async () => {
        const { data: readyData } = await supabase
            .from('ready_players')
            .select('device_id')
            .eq('device_id', currentDeviceId)
            .maybeSingle();
        
        if (!readyData) {
            console.log('ℹ️ Игрок не в игре, возвращаем на главную');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('🎮 Игрок в игре');
        
        // Убеждаемся, что запись игрока есть в ready_players
        await ensurePlayerInGame();
        
        // Инициализируем игру
        initGame();
    })();
});

// Убеждаемся, что запись игрока есть в ready_players
async function ensurePlayerInGame() {
    if (!currentDeviceId) return;
    
    try {
        // Проверяем, есть ли запись
        const { data, error } = await supabase
            .from('ready_players')
            .select('device_id')
            .eq('device_id', currentDeviceId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found, это нормально
            console.error('Ошибка проверки записи игрока:', error);
            return;
        }
        
        // Если записи нет - создаем её
        if (!data) {
            console.log('📝 Записи игрока нет, создаем...');
            const deviceInfo = typeof getDeviceInfo === 'function' ? getDeviceInfo() : { device_id: null };
            const { error: insertError } = await supabase
                .from('ready_players')
                .upsert([
                    {
                        device_id: deviceInfo.device_id,
                        ready_at: new Date().toISOString()
                    }
                ], {
                    onConflict: 'device_id'
                });
            
            if (insertError) {
                console.error('Ошибка создания записи игрока:', insertError);
            } else {
                console.log('✅ Запись игрока создана');
            }
        } else {
            console.log('✅ Запись игрока уже существует');
        }
    } catch (err) {
        console.error('Ошибка в ensurePlayerInGame:', err);
    }
}

// Инициализация игры
function initGame() {
    console.log('🔧 Инициализация игры...');
    
    // Настраиваем кнопку выхода
    setupExitButton();
    
    // Обновляем счетчик игроков и карточки сразу
    updatePlayersCount();
    updatePlayersCards();
    
    // Подписываемся на изменения в real-time
    subscribeToPlayersUpdates();
    
        // Периодическое обновление счетчика (на случай, если real-time не работает)
        // Увеличиваем интервал до 10 секунд, так как real-time должен обновлять мгновенно
        if (!playersCountInterval) {
            playersCountInterval = setInterval(() => {
                if (currentDeviceId && !document.hidden) {
                    updatePlayersCount(true); // silent = true для периодических обновлений
                    updatePlayersCards(true); // Обновляем карточки тоже
                }
            }, 10000); // 10 секунд вместо 2
            console.log('✅ Интервал обновления счетчика установлен (10 секунд)');
        }
}

// Настройка кнопки выхода из лобби
function setupExitButton() {
    const exitBtn = document.getElementById('exitGameBtn');
    if (exitBtn) {
        // Удаляем старые обработчики, если есть
        const newExitBtn = exitBtn.cloneNode(true);
        exitBtn.parentNode.replaceChild(newExitBtn, exitBtn);
        
        newExitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Нажата кнопка выхода');
            
            // Подтверждение выхода
            const confirmExit = confirm('⚠️ Вы уверены, что хотите выйти из лобби?\n\nВы будете удалены из игры.');
            if (!confirmExit) {
                return;
            }
            
            console.log('✅ Подтверждение получено, выходим из лобби...');
            await exitFromLobby();
        });
        console.log('✅ Кнопка выхода настроена');
    } else {
        console.error('❌ Кнопка exitGameBtn не найдена!');
    }
}

// Выход из лобби
async function exitFromLobby() {
    console.log('🚪 Функция exitFromLobby вызвана');
    
    if (!currentDeviceId) {
        console.log('ℹ️ Device ID не найден, просто перекидываем на главную');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        console.log('🚪 Выход из лобби для deviceId:', currentDeviceId);
        
        // Отключаем кнопку выхода, чтобы предотвратить повторные нажатия
        const exitBtn = document.getElementById('exitGameBtn');
        if (exitBtn) {
            exitBtn.disabled = true;
            exitBtn.textContent = 'Выход...';
        }
        
        // Удаляем запись игрока из ready_players
        const { error } = await supabase
            .from('ready_players')
            .delete()
            .eq('device_id', currentDeviceId);
        
        if (error) {
            console.error('❌ Ошибка выхода из лобби:', error);
            // В случае ошибки всё равно перекидываем на главную
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = 'index.html';
        } else {
            console.log('✅ Игрок удален из лобби');
            // Добавляем небольшую задержку, чтобы дать время базе данных обработать удаление
            await new Promise(resolve => setTimeout(resolve, 500));
            // Перекидываем на главную страницу
            console.log('🔄 Перенаправление на index.html...');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('❌ Ошибка выхода из лобби:', err);
        // В случае ошибки всё равно перекидываем на главную
        window.location.href = 'index.html';
    }
}

// Обновление счетчика игроков
async function updatePlayersCount(silent = false) {
    try {
        if (!silent) {
            console.log('🔄 Обновление счетчика игроков...');
        }
        
        // Получаем количество игроков (используем head для экономии трафика)
        const { count, error } = await supabase
            .from('ready_players')
            .select('*', { count: 'exact', head: true });

        if (error) {
            if (!silent) {
                console.error('❌ Ошибка получения количества игроков:', error);
            }
            return;
        }

        const playersCount = count || 0;
        
        // Обновляем только если значение изменилось
        if (playersCount !== lastPlayersCount) {
            lastPlayersCount = playersCount;
            
            const playersValueEl = document.getElementById('playersInGame');
            
            if (playersValueEl) {
                playersValueEl.textContent = playersCount;
                console.log(`📊 Игроков в игре: ${playersCount} (обновлено)`);
            } else {
                if (!silent) {
                    console.error('❌ Элемент playersInGame не найден при обновлении!');
                }
            }
            
            // Обновляем карточки игроков при изменении количества (но только если список действительно изменился)
            updatePlayersCards(silent);
        } else {
            // Значение не изменилось - не логируем и не обновляем карточки
            if (!silent) {
                console.log(`ℹ️ Количество игроков не изменилось: ${playersCount}`);
            }
        }
    } catch (err) {
        if (!silent) {
            console.error('❌ Ошибка обновления счетчика игроков:', err);
        }
    }
}

// Обновление карточек игроков
async function updatePlayersCards(silent = false) {
    try {
        if (!silent) {
            console.log('🔄 Обновление карточек игроков...');
        }
        
        // Получаем список всех игроков
        const { data: players, error } = await supabase
            .from('ready_players')
            .select('device_id, ready_at')
            .order('ready_at', { ascending: true });

        if (error) {
            if (!silent) {
                console.error('❌ Ошибка получения списка игроков:', error);
            }
            return;
        }

        // Проверяем, изменился ли список игроков
        const currentPlayersIds = players ? players.map(p => p.device_id).sort().join(',') : '';
        const lastPlayersIds = lastPlayersList ? lastPlayersList.map(p => p.device_id).sort().join(',') : '';
        
        // Если список не изменился - не обновляем карточки (предотвращаем моргание)
        if (currentPlayersIds === lastPlayersIds && lastPlayersList !== null) {
            if (!silent) {
                console.log('ℹ️ Список игроков не изменился, карточки не обновляем');
            }
            return;
        }

        // Сохраняем текущий список
        lastPlayersList = players;

        const container = document.getElementById('playersCardsContainer');
        if (!container) {
            if (!silent) {
                console.error('❌ Контейнер карточек игроков не найден!');
            }
            return;
        }

        // Очищаем контейнер только если список действительно изменился
        container.innerHTML = '';

        if (!players || players.length === 0) {
            if (!silent) {
                console.log('ℹ️ Игроков нет');
            }
            return;
        }

        // Создаем карточки для каждого игрока
        players.forEach((player, index) => {
            const playerName = `Игрок ${index + 1}`;
            const deviceIdShort = player.device_id ? player.device_id.substring(0, 8) : '';

            const card = document.createElement('div');
            card.className = 'player-card';
            card.setAttribute('data-device-id', player.device_id); // Добавляем data-атрибут для идентификации
            card.innerHTML = `
                <div class="player-card-header">
                    <div class="player-card-name">${playerName}</div>
                    <div class="player-card-info">${deviceIdShort}</div>
                </div>
                <div class="player-card-content">
                    <p class="player-card-placeholder">Информация об игроке появится здесь</p>
                </div>
            `;

            container.appendChild(card);
        });

        if (!silent) {
            console.log(`✅ Создано карточек игроков: ${players.length}`);
        }
    } catch (err) {
        if (!silent) {
            console.error('❌ Ошибка обновления карточек игроков:', err);
        }
    }
}

// Подписка на real-time обновления
function subscribeToPlayersUpdates() {
    try {
        playersChannel = supabase
            .channel('game_players_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'ready_players' 
                }, 
                (payload) => {
                    // Мгновенное обновление счётчика и карточек при любых изменениях (тихо, без лишних логов)
                    updatePlayersCount(true); // silent = true
                    updatePlayersCards(true); // Обновляем карточки тоже
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time подписка на игроков активна');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('ℹ️ Real-time недоступен, используем периодическое обновление');
                }
            });
        
        // Сохраняем канал для очистки
        window.playersChannel = playersChannel;
    } catch (err) {
        console.log('ℹ️ Real-time подписка недоступна, используем периодическое обновление');
    }
}

// Очистка при уходе со страницы
window.addEventListener('beforeunload', () => {
    if (playersCountInterval) {
        clearInterval(playersCountInterval);
        playersCountInterval = null;
    }
    if (playersChannel) {
        try {
            supabase.removeChannel(playersChannel);
        } catch (e) {
            // Игнорируем ошибки
        }
        playersChannel = null;
    }
    if (window.playersChannel) {
        try {
            supabase.removeChannel(window.playersChannel);
        } catch (e) {
            // Игнорируем ошибки
        }
        window.playersChannel = null;
    }
});

