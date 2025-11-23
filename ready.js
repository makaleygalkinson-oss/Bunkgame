// Управление готовностью игроков с real-time обновлением

let readyChannel = null;
let isReady = false;
let isAdmin = false; // Флаг для проверки админа

// Получение текущего user_id
function getCurrentUserId() {
    return (typeof window !== 'undefined' && window.currentUserId) || null;
}

// Инициализация системы готовности
function initReadySystem() {
    console.log('🔧 Инициализация системы готовности...');
    
    // Показываем кнопку всем
    showReadySection();
    setupReadySystem();
    
    // Проверяем авторизацию
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session && session.user) {
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
            console.log('✅ Пользователь авторизован');
            
            // Проверяем lobby_id - если игрок в лобби, перекидываем на game.html
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('lobby_id')
                .eq('id', currentUserId)
                .maybeSingle();
            
            if (!userError && userData && userData.lobby_id > 0) {
                console.log('🎮 Игрок в лобби (lobby_id =', userData.lobby_id, '), перекидываем на game.html');
                window.location.href = 'game.html';
                return;
            }
            
            updateReadyCountVisibility(); // Показываем счётчик
            subscribeToReadyUpdates();
            // Проверяем статус готовности (это обновит кнопку Ready)
            await checkCurrentReadyStatus();
            // Проверяем админа для показа кнопки START GAME
            await checkAdminForStartButton();
        } else {
            console.log('ℹ️ Пользователь не авторизован');
            if (typeof window !== 'undefined') {
                window.currentUserId = null;
            }
            updateReadyCountVisibility(); // Скрываем счётчик
            hideStartGameButton();
        }
    }).catch(err => {
        console.error('❌ Ошибка проверки сессии:', err);
        updateReadyCountVisibility(); // Скрываем счётчик при ошибке
    });

    // Отслеживание изменений авторизации
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Изменение авторизации:', event);
        if (event === 'SIGNED_IN' && session) {
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
            console.log('✅ Вход выполнен');
            
            // Проверяем lobby_id - если игрок в лобби, перекидываем на game.html
            const currentUserId = getCurrentUserId();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('lobby_id')
                .eq('id', currentUserId)
                .maybeSingle();
            
            if (!userError && userData && userData.lobby_id > 0) {
                console.log('🎮 Игрок в лобби (lobby_id =', userData.lobby_id, '), перекидываем на game.html');
                window.location.href = 'game.html';
                return;
            }
            
            updateReadyCountVisibility(); // Показываем счётчик
            subscribeToReadyUpdates();
            // Проверяем статус готовности (это обновит кнопку Ready)
            await checkCurrentReadyStatus();
            // Проверяем админа для показа кнопки START GAME
            await checkAdminForStartButton();
        } else if (event === 'SIGNED_OUT') {
            if (typeof window !== 'undefined') {
                window.currentUserId = null;
            }
            isReady = false;
            isAdmin = false;
            updateReadyButton(false);
            updateReadyCountVisibility(); // Скрываем счётчик
            hideStartGameButton();
            console.log('👋 Выход выполнен');
            if (readyChannel) {
                try {
                    supabase.removeChannel(readyChannel);
                } catch (e) {
                    // Игнорируем ошибки при удалении канала
                }
                readyChannel = null;
            }
            // Удаляем канал сигналов начала игры
            if (window.gameStartListener) {
                try {
                    supabase.removeChannel(window.gameStartListener);
                } catch (e) {
                    // Игнорируем ошибки
                }
                window.gameStartListener = null;
            }
            // Останавливаем периодическое обновление
            if (window.readyCountInterval) {
                clearInterval(window.readyCountInterval);
                window.readyCountInterval = null;
            }
        }
    });
}

// Показать секцию готовности (всегда показываем, даже неавторизованным)
function showReadySection() {
    const readySection = document.getElementById('readySection');
    if (readySection) {
        readySection.style.display = 'flex'; // Используем flex вместо block для правильного отображения
        console.log('✅ Ready секция показана');
        
        updateReadyCountVisibility();
    } else {
        console.error('❌ Элемент readySection не найден');
    }
}

// Обновление видимости счётчика готовых игроков
function updateReadyCountVisibility() {
    const countEl = document.getElementById('readyCount');
    if (countEl) {
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
            // Показываем счётчик только для авторизованных
            countEl.style.display = 'block';
        } else {
            // Скрываем для неавторизованных
            countEl.style.display = 'none';
        }
    }
}

// Скрыть секцию готовности (не используем, кнопка всегда видна)
function hideReadySection() {
    // Не скрываем кнопку, просто сбрасываем статус
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
        removeReadyStatus();
    }
    // Кнопка остаётся видимой
}

// Настройка системы готовности
function setupReadySystem() {
    const readyBtn = document.getElementById('readyBtn');
    if (!readyBtn) return;

    // Проверяем текущий статус (только для авторизованных)
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
        checkCurrentReadyStatus();
    }

    // Обработчик нажатия на кнопку Ready
    readyBtn.addEventListener('click', async () => {
        const currentUserId = getCurrentUserId();
        // Если не авторизован - показываем сообщение и открываем окно входа
        if (!currentUserId) {
            showAuthRequiredMessage();
            return;
        }
        
        // Позволяем переключать статус готовности
        await toggleReadyStatus();
    });
    
    // Обработчик кнопки START GAME (только для админа)
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', async () => {
            if (!isAdmin) {
                alert('Только администратор может начать игру');
                return;
            }
            
            // Проверяем количество готовых игроков
            const playerCount = await getReadyPlayersCount();
            
            if (playerCount < 4) {
                alert(`❌ Ошибка: Недостаточно игроков!\n\nГотовых игроков: ${playerCount}\nМинимум требуется: 4`);
                return;
            }
            
            if (playerCount > 16) {
                alert(`❌ Ошибка: Слишком много игроков!\n\nГотовых игроков: ${playerCount}\nМаксимум допускается: 16`);
                return;
            }
            
            // Если проверка пройдена - начинаем игру (перекидываем всех готовых)
            await startGame(false, true); // false = с проверками, true = перекинуть всех готовых
        });
    }

    // Удаление статуса при выходе со страницы
    const removeOnExit = () => {
        const currentUserId = getCurrentUserId();
        if (currentUserId && isReady) {
            // Пытаемся удалить асинхронно
            removeReadyStatus();
            // И синхронно на всякий случай
            removeReadyStatusSync();
        }
    };

    window.addEventListener('beforeunload', removeOnExit);
    window.addEventListener('unload', removeOnExit);
    window.addEventListener('pagehide', removeOnExit);
    
    // Также при скрытии вкладки
    document.addEventListener('visibilitychange', () => {
        const currentUserId = getCurrentUserId();
        if (document.hidden && currentUserId && isReady) {
            // Не удаляем сразу, но помечаем для удаления при полном выходе
        }
    });
}

// Проверка, началась ли игра (игрок находится в активном лобби)
async function checkIfGameStarted() {
    try {
        // Проверяем lobby_id пользователя
        // Если lobby_id > 0 - игрок в лобби
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return false;
        
        const { data, error } = await supabase
            .from('users')
            .select('lobby_id')
            .eq('id', currentUserId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Ошибка проверки статуса игры:', error);
            return false;
        }
        
        // Если lobby_id > 0 - игра началась (игрок в лобби)
        const lobbyId = data?.lobby_id || 0;
        const isInGame = lobbyId > 0;
        console.log('🎮 Проверка статуса игры:', { isInGame, lobbyId, hasRecord: !!data });
        return isInGame;
    } catch (err) {
        console.error('Ошибка в checkIfGameStarted:', err);
        return false;
    }
}

// Проверка текущего статуса готовности
async function checkCurrentReadyStatus() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    try {
        // Проверяем статус готовности
        console.log('ℹ️ Проверяем статус готовности');
        
        const { data, error } = await supabase
            .from('ready_players')
            .select('*')
            .eq('user_id', currentUserId)
            .maybeSingle();

        if (error) {
            // Тихо обрабатываем ошибки RLS
            if (error.code !== '42501' && !error.message?.includes('permission denied') && !error.message?.includes('RLS')) {
                console.error('Ошибка проверки статуса:', error);
            }
            isReady = false;
            await updateReadyButton(false);
            return;
        }

        if (data) {
            // Запись есть - игрок готов к игре
            isReady = true;
            await updateReadyButton(true);
        } else {
            // Записи нет - игрок не готов
            isReady = false;
            await updateReadyButton(false);
        }
    } catch (err) {
        // Тихо обрабатываем ошибки
        if (err.code !== '42501' && !err.message?.includes('permission denied')) {
            console.error('Ошибка проверки статуса:', err);
        }
        isReady = false;
        await updateReadyButton(false);
    }

    // Обновляем счётчик
    updateReadyCount();
}

// Переключение статуса готовности
async function toggleReadyStatus() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    try {
        if (isReady) {
            // Убираем готовность
            const { error } = await supabase
                .from('ready_players')
                .delete()
                .eq('user_id', currentUserId);

            if (error) {
                // Тихо обрабатываем ошибки RLS
                if (error.code !== '42501' && !error.message?.includes('permission denied') && !error.message?.includes('RLS')) {
                    console.error('Ошибка удаления статуса готовности:', error);
                }
            } else {
                isReady = false;
                updateReadyButton(false);
            }
        } else {
            // Добавляем готовность
            const deviceInfo = typeof getDeviceInfo === 'function' ? getDeviceInfo() : { device_id: null };
            const { error } = await supabase
                .from('ready_players')
                .upsert([
                    {
                        user_id: currentUserId,
                        device_id: deviceInfo.device_id,
                        ready_at: new Date().toISOString()
                    }
                ], {
                    onConflict: 'user_id'
                });

            if (error) {
                // Тихо обрабатываем ошибки RLS
                if (error.code !== '42501' && !error.message?.includes('permission denied') && !error.message?.includes('RLS')) {
                    console.error('Ошибка добавления статуса готовности:', error);
                }
            } else {
                isReady = true;
                updateReadyButton(true);
            }
        }
    } catch (err) {
        console.error('Ошибка переключения статуса:', err);
    }
}

// Удаление статуса готовности (доступна глобально)
async function removeReadyStatus() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    try {
        const { error } = await supabase
            .from('ready_players')
            .delete()
            .eq('user_id', currentUserId);
        
        if (error) {
            // Тихо обрабатываем ошибки RLS
            if (error.code !== '42501' && !error.message?.includes('permission denied') && !error.message?.includes('RLS')) {
                console.error('Ошибка удаления статуса:', error);
            }
        } else {
            isReady = false;
            updateReadyButton(false);
        }
    } catch (err) {
        // Тихо обрабатываем ошибки
        if (err.code !== '42501' && !err.message?.includes('permission denied')) {
            console.error('Ошибка удаления статуса:', err);
        }
    }
}

// Экспортируем функцию глобально
window.removeReadyStatus = removeReadyStatus;

// Показать сообщение о необходимости авторизации
function showAuthRequiredMessage() {
    const readySection = document.getElementById('readySection');
    if (!readySection) return;
    
    let messageEl = document.getElementById('readyAuthMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'readyAuthMessage';
        messageEl.className = 'ready-auth-message';
        readySection.insertBefore(messageEl, document.getElementById('readyBtn'));
    }
    
    messageEl.textContent = 'Для участия в игре необходимо войти в аккаунт';
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }, 4000);
}

// Синхронное удаление статуса (для beforeunload)
function removeReadyStatusSync() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    try {
        const xhr = new XMLHttpRequest();
        const url = `${SUPABASE_URL}/rest/v1/ready_players?user_id=eq.${currentUserId}`;
        xhr.open('DELETE', url, false);
        xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader('Prefer', 'return=minimal');
        xhr.send();
        // Игнорируем все ошибки при выходе - это нормально
    } catch (e) {
        // Игнорируем ошибки при выходе
    }
}

// Обновление текста кнопки
async function updateReadyButton(ready) {
    const readyBtn = document.getElementById('readyBtn');
    if (!readyBtn) return;
    
    // Всегда активируем кнопку - если пользователь на главной странице, он может использовать её
    console.log('✅ Кнопка Ready активна');
    readyBtn.disabled = false;
    readyBtn.style.opacity = '1';
    readyBtn.style.cursor = 'pointer';
    readyBtn.textContent = ready ? 'Not Ready' : 'Ready';
    readyBtn.classList.toggle('ready-active', ready);
}

// Обновление счётчика готовых игроков (только для авторизованных)
async function updateReadyCount() {
    // Обновляем счётчик только если пользователь авторизован
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        return;
    }
    
    try {
        const { count, error } = await supabase
            .from('ready_players')
            .select('*', { count: 'exact', head: true });

        if (error) {
            // Тихо обрабатываем ошибки RLS - это нормально, если политики ещё не настроены
            if (error.code !== '42501' && !error.message?.includes('permission denied') && !error.message?.includes('RLS')) {
                console.error('Ошибка обновления счётчика:', error);
            }
            return;
        }

        if (count !== null) {
            const countEl = document.getElementById('readyCount');
            if (countEl) {
                countEl.textContent = `Игроков готовых к игре: ${count}`;
            }
        }
    } catch (err) {
        // Тихо обрабатываем ошибки - не засоряем консоль
        if (err.code !== '42501' && !err.message?.includes('permission denied')) {
            console.error('Ошибка обновления счётчика:', err);
        }
    }
}

// Подписка на real-time обновления
function subscribeToReadyUpdates() {
    if (readyChannel) {
        supabase.removeChannel(readyChannel);
        readyChannel = null;
    }

    // Пытаемся подписаться на real-time обновления
    try {
        readyChannel = supabase
            .channel('ready_players_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'ready_players' 
                }, 
                (payload) => {
                    // Мгновенное обновление счётчика при любых изменениях
                    updateReadyCount();
                    
                    // Если это наш пользователь, обновляем кнопку
                    const currentUserId = getCurrentUserId();
                    if (payload.new && payload.new.user_id === currentUserId) {
                        isReady = true;
                        updateReadyButton(true);
                    } else if (payload.old && payload.old.user_id === currentUserId) {
                        isReady = false;
                        updateReadyButton(false);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Real-time подписка активна');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('ℹ️ Real-time недоступен, используем периодическое обновление');
                    // Если real-time не работает, полагаемся только на polling
                }
            });
        
        // Отдельный канал для получения сигнала начала игры (для всех готовых игроков)
        const gameStartListener = supabase.channel('game_start_broadcast')
            .on('broadcast', { event: 'game_started' }, async (payload) => {
                // Получен сигнал начала игры - перекидываем на страницу игры
                console.log('🎮 Получен сигнал начала игры!', payload);
                const currentUserId = getCurrentUserId();
                console.log('📊 Текущий статус:', { isReady, currentUserId });
                
                // Сбрасываем статус готовности и деактивируем кнопку
                isReady = false;
                await updateReadyButton(false);
                
                // Проверяем, есть ли запись игрока в ready_players (игрок в игре)
                const userId = getCurrentUserId();
                if (userId) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('lobby_id')
                        .eq('id', userId)
                        .maybeSingle();
                    
                    if (userData && userData.lobby_id > 0) {
                        console.log('✅ Игрок в лобби (lobby_id =', userData.lobby_id, '), перекидываем на game.html');
                        window.location.href = 'game.html';
                    } else {
                        console.log('ℹ️ Игрок не в лобби, не перекидываем');
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Подписка на сигналы начала игры активна');
                } else if (status === 'CHANNEL_ERROR') {
                    console.log('⚠️ Ошибка подписки на сигналы начала игры');
                } else {
                    console.log('ℹ️ Статус подписки на сигналы начала игры:', status);
                }
            });
        
        // Сохраняем канал для очистки при выходе
        window.gameStartListener = gameStartListener;
    } catch (err) {
        // Тихо обрабатываем ошибки WebSocket - это нормально, если Realtime не включен
        console.log('ℹ️ Real-time подписка недоступна, используем периодическое обновление');
    }

        // Периодическое обновление счётчика (работает всегда, даже если real-time не доступен)
        // Увеличиваем интервал до 2 секунд, чтобы не перегружать сервер
        if (!window.readyCountInterval) {
            window.readyCountInterval = setInterval(() => {
                const currentUserId = getCurrentUserId();
                if (currentUserId && !document.hidden) {
                    updateReadyCount();
                }
            }, 2000);
        }
}

// Проверка админа для показа кнопки START GAME
async function checkAdminForStartButton() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        hideStartGameButton();
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', currentUserId)
            .maybeSingle();
        
        if (!error && data) {
            const adminValue = data.is_admin;
            isAdmin = (typeof adminValue === 'boolean' && adminValue === true) ||
                     (typeof adminValue === 'string' && (adminValue.toLowerCase() === 'true' || adminValue === '1')) ||
                     (typeof adminValue === 'number' && adminValue === 1);
            
            if (isAdmin) {
                showStartGameButton();
            } else {
                hideStartGameButton();
            }
        } else {
            hideStartGameButton();
        }
    } catch (err) {
        console.error('❌ Ошибка проверки админа:', err);
        hideStartGameButton();
    }
}

// Показать кнопку START GAME
function showStartGameButton() {
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.style.display = 'block';
        console.log('✅ Кнопка START GAME показана (админ)');
    }
}

// Скрыть кнопку START GAME
function hideStartGameButton() {
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.style.display = 'none';
        console.log('ℹ️ Кнопка START GAME скрыта');
    }
}

// Функция для получения названия роли
function getRoleName(roleValue) {
    const roles = {
        'none': 'Нет ролей',
        'maniac': 'Маньяк',
        'killer': 'Убийца',
        'both': 'Маньяк и убийца'
    };
    return roles[roleValue] || 'Нет ролей';
}

// Получить количество готовых игроков
async function getReadyPlayersCount() {
    try {
        const { count, error } = await supabase
            .from('ready_players')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Ошибка получения количества игроков:', error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error('Ошибка получения количества игроков:', err);
        return 0;
    }
}

// Начать игру
async function startGame(ignoreChecks = false, redirectAll = true) {
    const selectedRoles = localStorage.getItem('gameRoles') || 'none';
    const roleName = getRoleName(selectedRoles);
    
    if (!ignoreChecks) {
        const playerCount = await getReadyPlayersCount();
        console.log(`🎮 Начало игры с ролями: ${roleName}, игроков: ${playerCount}`);
    } else {
        console.log(`🎮 АДМИН: Начало игры с ролями: ${roleName} (проверки игнорированы)`);
    }
    
    // Отправляем сигнал через broadcast
    console.log('🎮 Отправляем сигнал начала игры всем готовым игрокам');
    
    try {
        // Используем существующий канал или создаём новый
        let gameStartChannel = window.gameStartListener;
        
        if (!gameStartChannel) {
            console.log('⚠️ Канал не найден, создаём новый...');
            // Создаём новый канал для отправки
            gameStartChannel = supabase.channel('game_start_broadcast')
                .subscribe(async (status) => {
                    console.log('📡 Статус подписки канала для отправки:', status);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Канал для отправки готов, отправляем broadcast...');
                        await sendGameStartBroadcast(gameStartChannel, selectedRoles);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Ошибка канала для отправки');
                        window.location.href = 'game.html';
                    }
                });
            window.gameStartListener = gameStartChannel;
        } else {
            console.log('✅ Используем существующий канал для отправки');
            // Используем существующий канал
            await sendGameStartBroadcast(gameStartChannel, selectedRoles);
        }
    } catch (err) {
        console.error('❌ Ошибка отправки сигнала начала игры:', err);
        // В случае ошибки всё равно перекидываем админа
        window.location.href = 'game.html';
    }
}

// Вспомогательная функция для отправки broadcast
async function sendGameStartBroadcast(channel, selectedRoles) {
    try {
        console.log('📤 Отправляем broadcast сообщение...');
        
        // Получаем всех готовых игроков и устанавливаем им lobby_id = 1
        const { data: readyPlayers, error: playersError } = await supabase
            .from('ready_players')
            .select('user_id');
        
        if (!playersError && readyPlayers && readyPlayers.length > 0) {
            const userIds = readyPlayers.map(p => p.user_id);
            console.log('🎮 Устанавливаем lobby_id = 1 для игроков:', userIds);
            
            // Устанавливаем lobby_id = 1 для всех готовых игроков
            const { error: updateError } = await supabase
                .from('users')
                .update({ lobby_id: 1 })
                .in('id', userIds);
            
            if (updateError) {
                console.error('❌ Ошибка установки lobby_id:', updateError);
            } else {
                console.log('✅ lobby_id = 1 установлен для всех готовых игроков');
            }
        }
        
        // Отправляем broadcast сообщение
        const { error: sendError } = await channel.send({
            type: 'broadcast',
            event: 'game_started',
            payload: { 
                timestamp: new Date().toISOString(),
                roles: selectedRoles
            }
        });
        
        if (sendError) {
            console.error('❌ Ошибка отправки broadcast:', sendError);
            // В случае ошибки перекидываем админа напрямую
            window.location.href = 'game.html';
        } else {
            console.log('✅ Сигнал начала игры отправлен через broadcast');
            
            // Перекидываем админа через небольшую задержку
            setTimeout(() => {
                console.log('🎮 Перекидываем админа на game.html');
                window.location.href = 'game.html';
            }, 1000);
        }
    } catch (err) {
        console.error('❌ Ошибка в sendGameStartBroadcast:', err);
        window.location.href = 'game.html';
    }
}

// Экспортируем функцию глобально
window.startGame = startGame;

// Инициализация при загрузке
function startReadySystem() {
    // Ждём загрузки всех скриптов
    if (typeof supabase === 'undefined') {
        setTimeout(startReadySystem, 100);
        return;
    }
    
    // Показываем кнопку сразу (даже если не авторизован)
    showReadySection();
    initReadySystem();
}

// Запускаем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Показываем кнопку сразу
        showReadySection();
        startReadySystem();
    });
} else {
    // DOM уже загружен - показываем кнопку сразу
    showReadySection();
    startReadySystem();
}

// Также запускаем с задержкой для гарантии загрузки всех скриптов
setTimeout(() => {
    console.log('🔄 Повторная проверка инициализации Ready системы');
    showReadySection(); // Убеждаемся, что кнопка видна
    if (typeof supabase !== 'undefined') {
        startReadySystem();
    }
}, 500);

