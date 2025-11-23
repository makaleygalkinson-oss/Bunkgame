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
            
            // Закрываем модальное окно сразу
            closeRegisterModal();
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
            // Ищем пользователя по имени
            const { data: user, error: findError } = await supabase
                .from('users')
                .select('id, name, email, password_hash')
                .eq('name', name)
                .maybeSingle();
            
            if (findError && findError.code !== 'PGRST116') {
                console.error('Ошибка поиска пользователя:', findError);
                throw new Error('Ошибка при входе. Попробуйте позже.');
            }
            
            if (!user) {
                throw new Error('Пользователь с таким именем не найден');
            }
            
            // Проверяем пароль
            const passwordHash = hashPassword(password);
            if (user.password_hash !== passwordHash) {
                throw new Error('Неверный пароль');
            }
            
            // Сохраняем информацию о пользователе в sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
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

// Обновление UI после входа
function updateAuthUI(user) {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    
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
function checkCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            updateAuthUI(user);
        } catch (err) {
            console.error('Ошибка парсинга пользователя:', err);
            sessionStorage.removeItem('currentUser');
        }
    } else {
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

// Функции для работы с модальным окном лобби
function openLobbyModal() {
    const modal = document.getElementById('lobbyModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        // Здесь можно загрузить данные лобби
        loadLobbyData();
    }
}

function closeLobbyModal() {
    const modal = document.getElementById('lobbyModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
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
            .select('id, creator_name, active_role, created_at')
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
        
        // Очищаем контент
        lobbyContent.innerHTML = '';
        
        // Создаем карточки для каждого лобби
        lobbies.forEach((lobby) => {
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
                        <span class="lobby-card-value">${lobby.id || '-'}</span>
                    </div>
                </div>
                <div class="lobby-card-info">
                    <span class="lobby-card-role">Роль: ${roleName}</span>
                </div>
                <div class="lobby-card-actions">
                    <button class="lobby-connect-btn" disabled>CONNECT</button>
                </div>
            `;
            
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
        
        // Создаем запись лобби в базе данных
        // ID будет сгенерирован автоматически в БД (если используется DEFAULT gen_random_uuid())
        // Или можно передать null, чтобы БД сама сгенерировала UUID
        const lobbyData = {
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
checkCurrentUser();

