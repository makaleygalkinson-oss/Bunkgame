// Система регистрации и логина

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация пароля
function isValidPassword(password) {
    return password.length >= 6;
}

// Валидация имени
function isValidName(name) {
    return name.trim().length >= 2 && name.trim().length <= 50;
}

// Генерация валидного UUID
function generateUUID() {
    // Генерируем UUID v4 (стандартный формат)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Простое хеширование пароля (для демонстрации)
function hashPassword(password) {
    // Простое хеширование через base64 (в продакшене используйте bcrypt или подобное)
    return btoa(password + 'salt_key_2024').substring(0, 100);
}

// Очистка localStorage
function clearLocalStorage() {
    try {
        localStorage.clear();
        console.log('✅ localStorage очищен');
    } catch (err) {
        console.error('Ошибка очистки localStorage:', err);
    }
}

// Создание пользователя в базе данных
async function createUserInDB(userId, email, name, passwordHash) {
    try {
        const userData = {
            id: userId,
            email: email,
            name: name,
            password_hash: passwordHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('users')
            .insert([userData]);
        
        if (error) {
            console.error('Ошибка создания пользователя в БД:', error);
            return error;
        }
        
        console.log('✅ Пользователь успешно создан в БД');
        return null; // Успешно
    } catch (err) {
        console.error('Исключение при создании пользователя в БД:', err);
        return err;
    }
}

// Инициализация формы регистрации
function initRegistrationForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) {
        console.error('❌ Форма регистрации не найдена');
        return;
    }
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const messageEl = document.getElementById('registerMessage');
        const submitBtn = e.target.querySelector('.submit-btn');
        if (!messageEl || !submitBtn) return;
        
        const originalText = submitBtn.textContent;
        messageEl.textContent = '';
        messageEl.className = 'form-message';
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value.trim();
        
        // Валидация полей
        if (!email || !password || !name) {
            messageEl.textContent = 'Пожалуйста, заполните все поля';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (!isValidEmail(email)) {
            messageEl.textContent = 'Введите корректный email адрес';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (!isValidPassword(password)) {
            messageEl.textContent = 'Пароль должен содержать минимум 6 символов';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (!isValidName(name)) {
            messageEl.textContent = 'Имя должно содержать от 2 до 50 символов';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        try {
            // Проверяем, существует ли пользователь с таким email или именем
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id, email, name')
                .or(`email.eq.${email},name.eq.${name}`)
                .maybeSingle();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Ошибка проверки пользователя:', checkError);
                throw new Error('Ошибка при проверке данных. Попробуйте позже.');
            }
            
            if (existingUser) {
                if (existingUser.email === email) {
                    throw new Error('Пользователь с таким email уже зарегистрирован');
                }
                if (existingUser.name === name) {
                    throw new Error('Пользователь с таким именем уже зарегистрирован');
                }
            }
            
            // Генерируем валидный UUID для пользователя
            const userId = generateUUID();
            
            // Хешируем пароль
            const passwordHash = hashPassword(password);
            
            // Создаем запись пользователя в базе данных
            const dbError = await createUserInDB(userId, email, name, passwordHash);
            
            if (dbError) {
                // Обработка различных ошибок
                let errorMessage = 'Ошибка при регистрации';
                
                if (dbError.code === '23505' || dbError.message?.includes('duplicate key')) {
                    errorMessage = 'Пользователь с таким email или именем уже зарегистрирован';
                } else if (dbError.message) {
                    errorMessage = dbError.message;
                }
                
                throw new Error(errorMessage);
            }
            
            // Очищаем localStorage
            clearLocalStorage();
            
            messageEl.textContent = 'Регистрация успешна!';
            messageEl.className = 'form-message success';
            e.target.reset();
            
            // Закрываем модальное окно через 2 секунды, чтобы пользователь увидел сообщение
            setTimeout(() => {
                closeRegisterModal();
            }, 2000);
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            messageEl.textContent = error.message || 'Ошибка при регистрации. Попробуйте позже.';
            messageEl.className = 'form-message error';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Инициализация формы логина
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('❌ Форма логина не найдена');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const messageEl = document.getElementById('loginMessage');
        const submitBtn = e.target.querySelector('.submit-btn');
        if (!messageEl || !submitBtn) return;
        
        const originalText = submitBtn.textContent;
        messageEl.textContent = '';
        messageEl.className = 'form-message';
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;
        
        const name = document.getElementById('loginName').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Валидация полей
        if (!name || !password) {
            messageEl.textContent = 'Пожалуйста, заполните все поля';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (!isValidName(name)) {
            messageEl.textContent = 'Имя должно содержать от 2 до 50 символов';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        try {
            // Ищем пользователя по имени (без учета регистра и пробелов)
            const { data: users, error: findError } = await supabase
                .from('users')
                .select('id, name, email, password_hash, is_admin');
            
            if (findError) {
                console.error('Ошибка поиска пользователя:', findError);
                throw new Error('Ошибка при входе. Попробуйте позже.');
            }
            
            // Ищем пользователя по имени (без учета регистра и пробелов)
            const user = users?.find(u => 
                u.name && u.name.trim().toLowerCase() === name.toLowerCase()
            );
            
            if (!user) {
                console.log('Пользователи в БД:', users?.map(u => u.name));
                throw new Error('Пользователь с таким именем не найден');
            }
            
            // Проверяем пароль
            const passwordHash = hashPassword(password);
            if (user.password_hash !== passwordHash) {
                throw new Error('Неверный пароль');
            }
            
            // Проверяем, является ли пользователь админом из БД
            const isAdmin = user.is_admin === true || user.is_admin === 1;
            
            // Сохраняем информацию о пользователе в sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: isAdmin
            }));
            
            messageEl.textContent = 'Вход выполнен успешно!';
            messageEl.className = 'form-message success';
            e.target.reset();
            
            // Закрываем модальное окно сразу
            closeLoginModal();
            
            // Обновляем UI
            updateAuthUI(user);
            
            // Перезагружаем страницу через небольшую задержку
            setTimeout(() => {
                location.reload();
            }, 500);
        } catch (error) {
            console.error('Ошибка входа:', error);
            messageEl.textContent = error.message || 'Ошибка при входе. Проверьте имя и пароль.';
            messageEl.className = 'form-message error';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Проверка, является ли пользователь админом (из БД)
async function checkIfAdminFromDB(userId) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .maybeSingle();
        
        if (error) {
            console.error('Ошибка проверки админа:', error);
            return false;
        }
        
        return user?.is_admin === true || user?.is_admin === 1;
    } catch (err) {
        console.error('Ошибка проверки админа:', err);
        return false;
    }
}

// Обновление UI после входа
function updateAuthUI(user) {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    // Кнопка Register показывает имя игрока
    if (registerBtn) {
        registerBtn.textContent = user.name;
        registerBtn.style.cursor = 'default';
        registerBtn.onclick = null;
        registerBtn.style.opacity = '0.8';
    }
    
    // Кнопка Login меняется на "Выйти"
    if (loginBtn) {
        loginBtn.textContent = 'Выйти';
        loginBtn.onclick = () => {
            sessionStorage.removeItem('currentUser');
            location.reload();
        };
    }
    
    // Показываем кнопку АДМИНКУ только для админов
    if (adminBtn) {
        if (user.isAdmin) {
            adminBtn.style.display = 'block';
            // Пока без функционала - просто кнопка
            adminBtn.onclick = () => {
                console.log('Админка открыта (функционал пока не реализован)');
                // Здесь будет функционал админки
            };
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

// Функция выхода
function logout() {
    sessionStorage.removeItem('currentUser');
    location.reload();
}

// Функции для работы с модальными окнами
function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    const form = document.getElementById('registerForm');
    if (form) form.reset();
    
    const messageEl = document.getElementById('registerMessage');
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    const form = document.getElementById('loginForm');
    if (form) form.reset();
    
    const messageEl = document.getElementById('loginMessage');
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initRegistrationForm();
        initLoginForm();
    });
} else {
    initRegistrationForm();
    initLoginForm();
}

// Проверка текущего пользователя при загрузке
async function checkCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // Если isAdmin не установлен, проверяем заново из БД
            if (user.isAdmin === undefined) {
                user.isAdmin = await checkIfAdminFromDB(user.id);
                // Обновляем в sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }
            updateAuthUI(user);
        } catch (err) {
            console.error('Ошибка парсинга пользователя:', err);
            sessionStorage.removeItem('currentUser');
        }
    } else {
        // Скрываем кнопку админки, если пользователь не авторизован
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        // Если пользователь не авторизован, показываем кнопки регистрации и входа
        const registerBtn = document.getElementById('registerBtn');
        const loginBtn = document.getElementById('loginBtn');
        
        if (registerBtn) {
            registerBtn.textContent = 'Register';
            registerBtn.style.cursor = 'pointer';
            registerBtn.style.opacity = '1';
        }
        
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.style.cursor = 'pointer';
        }
    }
}

// Подключение к лобби
async function connectToLobby(lobbyId) {
    try {
        console.log('Подключение к лобби:', lobbyId);
        
        // Проверяем, авторизован ли пользователь
        const userStr = sessionStorage.getItem('currentUser');
        if (!userStr) {
            alert('Необходимо войти в систему для подключения к лобби');
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log('Пользователь:', user);
        
        // Преобразуем lobbyId в число
        const numericLobbyId = parseInt(lobbyId);
        if (isNaN(numericLobbyId)) {
            console.error('Некорректный ID лобби:', lobbyId);
            alert('Ошибка: некорректный ID лобби');
            return;
        }
        
        console.log('Обновление lobby_id для пользователя:', user.id, 'на значение:', numericLobbyId);
        
        // Обновляем запись пользователя в БД - добавляем lobby_id (числовой)
        // Сначала пробуем с .select(), если не работает - без него
        let { data: updatedData, error: updateError } = await supabase
            .from('users')
            .update({ 
                lobby_id: numericLobbyId,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select();
        
        // Если данные не вернулись, но ошибки нет - проверяем вручную
        if (!updateError && (!updatedData || updatedData.length === 0)) {
            console.log('Данные не вернулись, проверяем обновление вручную...');
            
            // Пробуем обновить без .select()
            const { error: updateError2 } = await supabase
                .from('users')
                .update({ 
                    lobby_id: numericLobbyId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (updateError2) {
                console.error('Ошибка при обновлении без select:', updateError2);
                updateError = updateError2;
            } else {
                // Проверяем, что обновление произошло, запрашивая данные отдельно
                console.log('Проверяем обновление отдельным запросом...');
                const { data: checkData, error: checkError } = await supabase
                    .from('users')
                    .select('id, name, lobby_id')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (checkError) {
                    console.error('Ошибка при проверке обновления:', checkError);
                    alert(`Ошибка при проверке обновления: ${checkError.message}`);
                    return;
                }
                
                if (!checkData) {
                    console.error('Пользователь не найден после обновления');
                    alert('Ошибка: пользователь не найден');
                    return;
                }
                
                console.log('Проверка обновления:', checkData);
                
                if (checkData.lobby_id !== numericLobbyId) {
                    console.error('Ошибка: lobby_id не обновился! Ожидалось:', numericLobbyId, 'Получено:', checkData.lobby_id);
                    alert(`Ошибка: lobby_id не обновился. Текущее значение: ${checkData.lobby_id}`);
                    return;
                }
                
                console.log('✅ Обновление подтверждено! Новый lobby_id:', checkData.lobby_id);
                updatedData = [checkData];
            }
        }
        
        if (updateError) {
            console.error('Ошибка подключения к лобби:', updateError);
            console.error('Детали ошибки:', JSON.stringify(updateError, null, 2));
            alert(`Ошибка подключения к лобби: ${updateError.message || 'Неизвестная ошибка'}\n\nПроверьте RLS политики для UPDATE в таблице users.`);
            return;
        }
        
        if (updatedData && updatedData.length > 0) {
            console.log('Успешно обновлено:', updatedData);
            console.log('Новый lobby_id пользователя:', updatedData[0].lobby_id);
        }
        
        // Сохраняем информацию о лобби в sessionStorage
        sessionStorage.setItem('currentLobbyId', numericLobbyId.toString());
        
        console.log('Переход на страницу игры через 500мс...');
        
        // Небольшая задержка перед переходом, чтобы убедиться, что всё сохранилось
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 500);
        
    } catch (err) {
        console.error('Ошибка подключения к лобби:', err);
        alert(`Ошибка подключения к лобби: ${err.message || 'Неизвестная ошибка'}`);
    }
}

// Переменная для хранения канала реалтайм
let lobbyRealtimeChannel = null;

// Функции для работы с модальным окном лобби
function openLobbyModal() {
    const modal = document.getElementById('lobbyModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // Загружаем данные лобби
        loadLobbyData();
        // Подписываемся на изменения в реальном времени
        subscribeToLobbyUpdates();
    }
}

function closeLobbyModal() {
    const modal = document.getElementById('lobbyModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
    // Отписываемся от обновлений
    unsubscribeFromLobbyUpdates();
}

// Подписка на изменения в таблице users для обновления количества игроков
function subscribeToLobbyUpdates() {
    // Отписываемся от предыдущей подписки, если она есть
    unsubscribeFromLobbyUpdates();
    
    // Подписываемся на изменения в таблице users (все изменения, чтобы отслеживать вход/выход из лобби)
    lobbyRealtimeChannel = supabase
        .channel('lobby-players-updates')
        .on('postgres_changes', 
            { 
                event: '*', // Все события (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'users'
            },
            (payload) => {
                console.log('Изменение в users:', payload);
                // Обновляем количество игроков при любом изменении
                // (вход/выход из лобби изменяет lobby_id)
                updatePlayerCounts();
            }
        )
        .subscribe();
}

// Отписка от обновлений
function unsubscribeFromLobbyUpdates() {
    if (lobbyRealtimeChannel) {
        supabase.removeChannel(lobbyRealtimeChannel);
        lobbyRealtimeChannel = null;
    }
}

// Обновление только количества игроков без полной перезагрузки
async function updatePlayerCounts() {
    try {
        // Получаем актуальное количество игроков в каждом лобби
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('lobby_id');
        
        if (usersError) {
            console.error('Ошибка загрузки игроков:', usersError);
            return;
        }
        
        // Подсчитываем количество игроков для каждого лобби
        const playerCounts = {};
        if (users) {
            users.forEach(user => {
                if (user.lobby_id) {
                    playerCounts[user.lobby_id] = (playerCounts[user.lobby_id] || 0) + 1;
                }
            });
        }
        
        // Обновляем количество игроков в каждой карточке
        const lobbyCards = document.querySelectorAll('.lobby-card');
        lobbyCards.forEach(card => {
            const lobbyIdElement = card.querySelector('.lobby-card-value');
            if (lobbyIdElement) {
                const lobbyId = parseInt(lobbyIdElement.textContent);
                const playerCount = playerCounts[lobbyId] || 0;
                const playersElement = card.querySelector('.lobby-card-players');
                if (playersElement) {
                    playersElement.textContent = `Игроков: ${playerCount}`;
                }
            }
        });
    } catch (err) {
        console.error('Ошибка обновления количества игроков:', err);
    }
}

// Загрузка данных лобби
async function loadLobbyData() {
    const lobbyContent = document.getElementById('lobbyContent');
    if (!lobbyContent) return;
    
    try {
        lobbyContent.innerHTML = '<p class="lobby-loading">Загрузка лобби...</p>';
        
        // Получаем все лобби из базы данных
        const { data: lobbies, error } = await supabase
            .from('lobbies')
            .select('lobby_id, creator_name, active_role, created_at')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Ошибка загрузки лобби:', error);
            lobbyContent.innerHTML = '<p class="lobby-error">Ошибка загрузки лобби</p>';
            return;
        }
        
        if (!lobbies || lobbies.length === 0) {
            lobbyContent.innerHTML = '<p class="lobby-empty">Лобби не найдены</p>';
            return;
        }
        
        // Получаем количество игроков в каждом лобби
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('lobby_id');
        
        if (usersError) {
            console.error('Ошибка загрузки игроков:', usersError);
        }
        
        // Подсчитываем количество игроков для каждого лобби
        const playerCounts = {};
        if (users) {
            users.forEach(user => {
                if (user.lobby_id) {
                    playerCounts[user.lobby_id] = (playerCounts[user.lobby_id] || 0) + 1;
                }
            });
        }
        
        // Очищаем контент
        lobbyContent.innerHTML = '';
        
        // Создаем карточки для каждого лобби
        lobbies.forEach((lobby) => {
            const playerCount = playerCounts[lobby.lobby_id] || 0;
            const lobbyCard = document.createElement('div');
            lobbyCard.className = 'lobby-card';
            
            const roleNames = {
                'maniac': 'Маньяк',
                'killer': 'Убийца',
                'both': 'Маньяк и убийца',
                'none': 'Без активных ролей'
            };
            
            const roleName = roleNames[lobby.active_role] || lobby.active_role;
            
            lobbyCard.innerHTML = `
                <div class="lobby-card-header">
                    <div class="lobby-card-header-item">
                        <span class="lobby-card-label">Ник создателя лобби</span>
                        <span class="lobby-card-value">${lobby.creator_name || '-'}</span>
                    </div>
                    <div class="lobby-card-header-item">
                        <span class="lobby-card-label">id Lobby</span>
                        <span class="lobby-card-value">${lobby.lobby_id || '-'}</span>
                    </div>
                </div>
                <div class="lobby-card-info">
                    <span class="lobby-card-role">Роль: ${roleName}</span>
                    <span class="lobby-card-players">Игроков: ${playerCount}</span>
                </div>
                <div class="lobby-card-actions">
                    <button class="lobby-connect-btn" data-lobby-id="${lobby.lobby_id}">CONNECT</button>
                </div>
            `;
            
            // Добавляем обработчик для кнопки CONNECT
            const connectBtn = lobbyCard.querySelector('.lobby-connect-btn');
            if (connectBtn) {
                connectBtn.addEventListener('click', async () => {
                    await connectToLobby(lobby.lobby_id);
                });
            }
            
            lobbyContent.appendChild(lobbyCard);
        });
        
    } catch (err) {
        console.error('Ошибка загрузки лобби:', err);
        const lobbyContent = document.getElementById('lobbyContent');
        if (lobbyContent) {
            lobbyContent.innerHTML = '<p class="lobby-error">Ошибка загрузки лобби</p>';
        }
    }
}

// Функции для работы с модальным окном создания лобби
function openCreateLobbyModal() {
    const modal = document.getElementById('createLobbyModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // Сбрасываем выбор на первый вариант
        const firstOption = document.querySelector('input[name="activeRole"][value="maniac"]');
        if (firstOption) {
            firstOption.checked = true;
        }
    }
}

function closeCreateLobbyModal() {
    const modal = document.getElementById('createLobbyModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    const messageEl = document.getElementById('createLobbyMessage');
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }
}

// Создание лобби
async function createLobby() {
    const messageEl = document.getElementById('createLobbyMessage');
    const confirmBtn = document.getElementById('confirmCreateLobbyBtn');
    
    if (!messageEl || !confirmBtn) return;
    
    const originalText = confirmBtn.textContent;
    messageEl.textContent = '';
    messageEl.className = 'form-message';
    confirmBtn.textContent = 'Создание...';
    confirmBtn.disabled = true;
    
    try {
        // Проверяем, авторизован ли пользователь
        const userStr = sessionStorage.getItem('currentUser');
        if (!userStr) {
            throw new Error('Необходимо войти в систему для создания лобби');
        }
        
        const user = JSON.parse(userStr);
        
        // Получаем выбранную роль
        const selectedRole = document.querySelector('input[name="activeRole"]:checked');
        if (!selectedRole) {
            throw new Error('Выберите активную роль');
        }
        
        const roleValue = selectedRole.value;
        const roleNames = {
            'maniac': 'Маньяк',
            'killer': 'Убийца',
            'both': 'Маньяк и убийца',
            'none': 'Без активных ролей'
        };
        
        // Находим максимальный lobby_id и создаем новый (числовой)
        const { data: maxLobbyData, error: maxError } = await supabase
            .from('lobbies')
            .select('lobby_id')
            .order('lobby_id', { ascending: false })
            .limit(1);
        
        let newLobbyId = 1;
        if (!maxError && maxLobbyData && maxLobbyData.length > 0 && maxLobbyData[0].lobby_id) {
            newLobbyId = parseInt(maxLobbyData[0].lobby_id) + 1;
        }
        
        // Создаем запись лобби в базе данных
        const lobbyData = {
            lobby_id: newLobbyId,
            creator_id: user.id,
            creator_name: user.name,
            active_role: roleValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data: insertedData, error } = await supabase
            .from('lobbies')
            .insert([lobbyData])
            .select()
            .single();
        
        if (error) {
            console.error('Ошибка создания лобби:', error);
            let errorMessage = 'Ошибка при создании лобби. Попробуйте позже.';
            if (error.message) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        }
        
        if (insertedData) {
            messageEl.textContent = `Лобби успешно создано! Роль: ${roleNames[roleValue]}`;
            messageEl.className = 'form-message success';
            
            // Закрываем модальное окно через 2 секунды
            setTimeout(() => {
                closeCreateLobbyModal();
            }, 2000);
        } else {
            throw new Error('Лобби не было создано');
        }
        
    } catch (error) {
        console.error('Ошибка создания лобби:', error);
        messageEl.textContent = error.message || 'Ошибка при создании лобби. Попробуйте позже.';
        messageEl.className = 'form-message error';
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

// Экспорт функций
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openLobbyModal = openLobbyModal;
window.closeLobbyModal = closeLobbyModal;
window.openCreateLobbyModal = openCreateLobbyModal;
window.closeCreateLobbyModal = closeCreateLobbyModal;
window.createLobby = createLobby;

// Проверяем пользователя при загрузке
(async () => {
    await checkCurrentUser();
})();

// Отписываемся от обновлений при закрытии страницы
window.addEventListener('beforeunload', () => {
    unsubscribeFromLobbyUpdates();
});

