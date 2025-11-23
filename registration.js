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

// Загрузка данных лобби (заглушка, можно расширить)
function loadLobbyData() {
    const creatorNameEl = document.getElementById('lobbyCreatorName');
    const lobbyIdEl = document.getElementById('lobbyId');
    
    // Показываем заглушку, можно будет заменить на реальные данные
    if (creatorNameEl) {
        creatorNameEl.textContent = '-';
    }
    if (lobbyIdEl) {
        lobbyIdEl.textContent = '-';
    }
}

// Экспорт функций
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openLobbyModal = openLobbyModal;
window.closeLobbyModal = closeLobbyModal;

// Проверяем пользователя при загрузке
checkCurrentUser();

