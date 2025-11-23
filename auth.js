// Система регистрации и авторизации

let isClosingModal = false;
let currentUser = null;

// Универсальная функция закрытия модального окна
function closeModal(modalId, formId, messageId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    const form = document.getElementById(formId);
    if (form) form.reset();
    
    const messageEl = document.getElementById(messageId);
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }
}

function closeRegisterModal() { closeModal('registerModal', 'registerForm', 'registerMessage'); }
function closeLoginModal() { closeModal('loginModal', 'loginForm', 'loginMessage'); }

// Универсальная функция открытия модального окна
function openModal(modalId) {
    if (isClosingModal) return;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.removeAttribute('style');
        modal.style.cssText = 'display: flex; visibility: visible; opacity: 1; pointer-events: auto;';
        modal.classList.remove('hidden');
    }
}

// Инициализация модальных окон
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const closeRegisterModalBtn = document.getElementById('closeRegisterModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const closeRulesModalBtn = document.getElementById('closeRulesModal');
const rulesBtn = document.getElementById('rulesBtn');

if (registerBtn) registerBtn.addEventListener('click', () => openModal('registerModal'));
if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
if (closeRegisterModalBtn) closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);

// Закрытие при клике вне модального окна
window.addEventListener('click', (e) => {
    const modals = ['registerModal', 'loginModal', 'rulesModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) {
            if (id === 'registerModal') {
                closeRegisterModal();
            } else if (id === 'loginModal') {
                closeLoginModal();
            } else {
                modal.style.display = 'none';
            }
        }
    });
});

if (rulesBtn) rulesBtn.addEventListener('click', () => {
    const rulesModal = document.getElementById('rulesModal');
    if (rulesModal) rulesModal.style.display = 'flex';
});

if (closeRulesModalBtn) {
    closeRulesModalBtn.addEventListener('click', () => {
        const rulesModal = document.getElementById('rulesModal');
        if (rulesModal) rulesModal.style.display = 'none';
    });
}

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

// Регистрация
const registerForm = document.getElementById('registerForm');
if (registerForm) {
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
            // Регистрация через Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name
                    },
                    emailRedirectTo: undefined // Отключаем подтверждение email
                }
            });
            
            if (authError) {
                // Обработка различных ошибок
                let errorMessage = 'Ошибка при регистрации';
                
                if (authError.message.includes('User already registered') || 
                    authError.message.includes('already registered') ||
                    authError.message.includes('already exists')) {
                    errorMessage = 'Пользователь с таким email уже зарегистрирован';
                } else if (authError.message.includes('Invalid email')) {
                    errorMessage = 'Некорректный email адрес';
                } else if (authError.message.includes('Password')) {
                    errorMessage = 'Пароль не соответствует требованиям';
                } else if (authError.message) {
                    errorMessage = authError.message;
                }
                
                throw new Error(errorMessage);
            }
            
            if (!authData || !authData.user) {
                throw new Error('Не удалось создать пользователя. Попробуйте позже.');
            }
            
            // Создаем запись пользователя в базе данных
            const dbError = await createUserInDB(authData.user, name, email);
            
            if (dbError) {
                console.warn('Предупреждение при создании пользователя в БД:', dbError);
                // Не прерываем процесс, так как пользователь уже создан в Auth
            }
            
            // Пытаемся сразу войти
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (!loginError && loginData && loginData.user) {
                currentUser = loginData.user;
                if (typeof window !== 'undefined') {
                    window.currentUserId = loginData.user.id;
                }
                updateAuthUI(loginData.user);
                messageEl.textContent = 'Регистрация успешна! Вы вошли в систему.';
                messageEl.className = 'form-message success';
                e.target.reset();
                setTimeout(() => {
                    closeRegisterModal();
                }, 1500);
            } else {
                // Регистрация прошла, но автоматический вход не удался
                messageEl.textContent = 'Регистрация успешна! Пожалуйста, войдите в систему.';
                messageEl.className = 'form-message success';
                e.target.reset();
                setTimeout(() => {
                    closeRegisterModal();
                    // Открываем окно входа
                    setTimeout(() => {
                        openModal('loginModal');
                    }, 300);
                }, 1500);
            }
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

// Вход
const loginForm = document.getElementById('loginForm');
if (loginForm) {
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
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Валидация полей
        if (!email || !password) {
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
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                // Обработка различных ошибок входа
                let errorMessage = 'Ошибка при входе';
                
                if (error.message.includes('Invalid login credentials') || 
                    error.message.includes('Invalid password') ||
                    error.message.includes('Wrong password')) {
                    errorMessage = 'Неверный email или пароль';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Email не подтвержден. Проверьте почту.';
                } else if (error.message.includes('User not found')) {
                    errorMessage = 'Пользователь с таким email не найден';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Слишком много попыток. Попробуйте позже.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                throw new Error(errorMessage);
            }
            
            // Supabase возвращает { user, session }
            const user = data?.user;
            
            if (!user) {
                throw new Error('Ошибка: пользователь не найден');
            }
            
            currentUser = user;
            if (typeof window !== 'undefined') {
                window.currentUserId = user.id;
            }
            
            // Убеждаемся, что пользователь есть в БД (не блокируем выполнение)
            ensureUserInDB(user).catch((err) => {
                console.warn('Не удалось проверить/создать пользователя в БД:', err);
            });
            
            // Обновляем UI
            updateAuthUI(user);
            
            messageEl.textContent = 'Вход выполнен успешно!';
            messageEl.className = 'form-message success';
            e.target.reset();
            
            // Закрываем модальное окно через небольшую задержку для показа сообщения
            setTimeout(() => {
                closeLoginModal();
            }, 500);
        } catch (error) {
            console.error('Ошибка входа:', error);
            messageEl.textContent = error.message || 'Ошибка при входе. Проверьте email и пароль.';
            messageEl.className = 'form-message error';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Создание пользователя в базе данных
async function createUserInDB(user, name, email) {
    try {
        // Проверяем, существует ли пользователь в БД
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
        
        // Если пользователь уже существует, не создаем заново
        if (existingUser) {
            console.log('Пользователь уже существует в БД');
            return null;
        }
        
        const userData = {
            id: user.id,
            email: email,
            name: name,
            lobby_id: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Пытаемся создать пользователя
        const { error } = await supabase
            .from('users')
            .insert([userData]);
        
        if (error) {
            // Если ошибка из-за дубликата, это нормально
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                console.log('Пользователь уже существует (дубликат ключа)');
                return null;
            }
            
            // Если ошибка прав доступа, пробуем через RPC функцию
            if (error.code === '42501' || error.message?.includes('permission denied')) {
                try {
                    const { error: rpcError } = await supabase.rpc('create_user_on_login', {
                        p_user_id: user.id,
                        p_email: email,
                        p_name: name,
                        p_device_id: null,
                        p_lobby_id: 0
                    });
                    
                    if (rpcError) {
                        console.warn('RPC функция недоступна или вернула ошибку:', rpcError);
                        return rpcError;
                    }
                    
                    return null; // Успешно создано через RPC
                } catch (rpcError) {
                    console.warn('Ошибка при вызове RPC функции:', rpcError);
                    return rpcError;
                }
            }
            
            // Другие ошибки
            console.error('Ошибка создания пользователя в БД:', error);
            return error;
        }
        
        console.log('Пользователь успешно создан в БД');
        return null; // Успешно
    } catch (err) {
        console.error('Исключение при создании пользователя в БД:', err);
        return err;
    }
}

// Убедиться, что пользователь есть в БД
async function ensureUserInDB(user) {
    try {
        if (!user || !user.id) {
            console.warn('Некорректные данные пользователя');
            return;
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Ошибка проверки пользователя:', error);
            return;
        }
        
        if (!data) {
            // Пользователя нет - создаем
            const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Пользователь';
            const email = user.email || '';
            const dbError = await createUserInDB(user, name, email);
            
            if (dbError) {
                console.warn('Не удалось создать пользователя в БД при проверке:', dbError);
            }
        }
    } catch (err) {
        console.error('Ошибка проверки пользователя:', err);
    }
}

// Обновление UI авторизации
function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (user) {
        const userName = user.user_metadata?.name || user.email;
        authButtons.innerHTML = `
            <span class="user-name">${userName}</span>
            <button class="auth-btn lobbies-btn" id="lobbiesBtn" title="Активные лобби">ЛОББИ</button>
            <button class="auth-btn" id="logoutBtn">Выйти</button>
        `;
        
        // Переинициализация всех кнопок после изменения DOM
        if (typeof window !== 'undefined' && typeof window.reinitButtons === 'function') {
            setTimeout(() => {
                window.reinitButtons();
                if (typeof setupLobbiesModal === 'function') {
                    setupLobbiesModal();
                }
            }, 100);
        }
    } else {
        authButtons.innerHTML = `
            <button class="auth-btn" id="loginBtn">Войти</button>
            <button class="auth-btn" id="registerBtn">Регистрация</button>
            <button class="auth-btn lobbies-btn" id="lobbiesBtn" title="Активные лобби">ЛОББИ</button>
        `;
        
        // Переинициализация всех кнопок после изменения DOM
        if (typeof window !== 'undefined' && typeof window.reinitButtons === 'function') {
            setTimeout(() => {
                window.reinitButtons();
                if (typeof setupLobbiesModal === 'function') {
                    setupLobbiesModal();
                }
            }, 100);
        }
    }
}

// Инициализация сессии
function initAuthSession() {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session && session.user) {
            currentUser = session.user;
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
            ensureUserInDB(session.user).catch(() => {});
            updateAuthUI(session.user);
        } else {
            if (typeof window !== 'undefined') {
                window.currentUserId = null;
            }
            updateAuthUI(null);
        }
    }).catch(err => {
        if (typeof window !== 'undefined') {
            window.currentUserId = null;
        }
        updateAuthUI(null);
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session && session.user) {
            currentUser = session.user;
            if (typeof window !== 'undefined') {
                window.currentUserId = session.user.id;
            }
            ensureUserInDB(session.user).catch(() => {});
            updateAuthUI(session.user);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            if (typeof window !== 'undefined') {
                window.currentUserId = null;
            }
            updateAuthUI(null);
            if (typeof removeReadyStatus === 'function') {
                await removeReadyStatus();
            }
        }
    });
}

// Экспорт для использования в других файлах
window.getCurrentUser = () => currentUser;
window.getCurrentUserId = () => currentUser?.id || null;

// Валидация в реальном времени для формы регистрации
function setupRealTimeValidation() {
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerName = document.getElementById('registerName');
    const registerMessage = document.getElementById('registerMessage');
    
    if (registerEmail) {
        registerEmail.addEventListener('blur', () => {
            const email = registerEmail.value.trim();
            if (email && !isValidEmail(email)) {
                registerEmail.style.borderColor = '#ff4444';
            } else {
                registerEmail.style.borderColor = '';
            }
        });
        
        registerEmail.addEventListener('input', () => {
            if (registerEmail.style.borderColor === 'rgb(255, 68, 68)') {
                const email = registerEmail.value.trim();
                if (!email || isValidEmail(email)) {
                    registerEmail.style.borderColor = '';
                }
            }
        });
    }
    
    if (registerPassword) {
        registerPassword.addEventListener('blur', () => {
            const password = registerPassword.value;
            if (password && !isValidPassword(password)) {
                registerPassword.style.borderColor = '#ff4444';
            } else {
                registerPassword.style.borderColor = '';
            }
        });
        
        registerPassword.addEventListener('input', () => {
            if (registerPassword.style.borderColor === 'rgb(255, 68, 68)') {
                const password = registerPassword.value;
                if (!password || isValidPassword(password)) {
                    registerPassword.style.borderColor = '';
                }
            }
        });
    }
    
    if (registerName) {
        registerName.addEventListener('blur', () => {
            const name = registerName.value.trim();
            if (name && !isValidName(name)) {
                registerName.style.borderColor = '#ff4444';
            } else {
                registerName.style.borderColor = '';
            }
        });
        
        registerName.addEventListener('input', () => {
            if (registerName.style.borderColor === 'rgb(255, 68, 68)') {
                const name = registerName.value.trim();
                if (!name || isValidName(name)) {
                    registerName.style.borderColor = '';
                }
            }
        });
    }
    
    // Валидация для формы входа
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('blur', () => {
            const email = loginEmail.value.trim();
            if (email && !isValidEmail(email)) {
                loginEmail.style.borderColor = '#ff4444';
            } else {
                loginEmail.style.borderColor = '';
            }
        });
        
        loginEmail.addEventListener('input', () => {
            if (loginEmail.style.borderColor === 'rgb(255, 68, 68)') {
                const email = loginEmail.value.trim();
                if (!email || isValidEmail(email)) {
                    loginEmail.style.borderColor = '';
                }
            }
        });
    }
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAuthSession();
        setupRealTimeValidation();
    });
} else {
    initAuthSession();
    setupRealTimeValidation();
}

