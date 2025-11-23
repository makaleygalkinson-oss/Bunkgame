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
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value.trim();
        
        if (!email || !password || !name) {
            messageEl.textContent = 'Заполните все поля';
            messageEl.className = 'form-message error';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (password.length < 6) {
            messageEl.textContent = 'Пароль должен содержать минимум 6 символов';
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
            
            if (authError) throw authError;
            
            if (authData.user) {
                // Создаем запись пользователя в базе данных
                await createUserInDB(authData.user, name, email);
                
                // Пытаемся сразу войти
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (!loginError && loginData.user) {
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
                    messageEl.textContent = 'Регистрация успешна! Войдите в систему.';
                    messageEl.className = 'form-message success';
                    e.target.reset();
                    setTimeout(() => {
                        closeRegisterModal();
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            messageEl.textContent = error.message || 'Ошибка при регистрации';
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
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            messageEl.textContent = 'Заполните все поля';
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
                throw error;
            }
            
            // Supabase возвращает { user, session }
            const user = data?.user;
            
            if (user) {
                currentUser = user;
                if (typeof window !== 'undefined') {
                    window.currentUserId = user.id;
                }
                
                // Убеждаемся, что пользователь есть в БД (не блокируем выполнение)
                ensureUserInDB(user).catch(() => {});
                
                // Обновляем UI
                updateAuthUI(user);
                
                messageEl.textContent = 'Вход выполнен успешно!';
                messageEl.className = 'form-message success';
                e.target.reset();
                
                // Закрываем модальное окно сразу
                closeLoginModal();
            } else {
                messageEl.textContent = 'Ошибка: пользователь не найден';
                messageEl.className = 'form-message error';
            }
        } catch (error) {
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
        const userData = {
            id: user.id,
            email: email,
            name: name,
            lobby_id: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('users')
            .upsert([userData], { onConflict: 'id' });
        
        if (error) {
            // Пытаемся через RPC функцию, если есть
            if (error.code === '42501' || error.message?.includes('permission denied')) {
                try {
                    await supabase.rpc('create_user_on_login', {
                        p_user_id: user.id,
                        p_email: email,
                        p_name: name,
                        p_device_id: null,
                        p_lobby_id: 0
                    });
                } catch (rpcError) {
                    // Игнорируем ошибки RPC
                }
            }
        }
    } catch (err) {
        // Игнорируем ошибки создания пользователя
    }
}

// Убедиться, что пользователь есть в БД
async function ensureUserInDB(user) {
    try {
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
            const name = user.user_metadata?.name || user.email;
            await createUserInDB(user, name, user.email);
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
        
        // Инициализация кнопки лобби
        if (typeof setupLobbiesModal === 'function') {
            setTimeout(() => setupLobbiesModal(), 100);
        }
        
        // Обработчик выхода (удаляем старый, если есть, и добавляем новый)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Клонируем кнопку, чтобы удалить все старые обработчики
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (typeof removeReadyStatus === 'function') {
                    await removeReadyStatus();
                }
                await supabase.auth.signOut();
                currentUser = null;
                if (typeof window !== 'undefined') {
                    window.currentUserId = null;
                }
                location.reload();
            });
        }
    } else {
        authButtons.innerHTML = `
            <button class="auth-btn" id="loginBtn">Войти</button>
            <button class="auth-btn" id="registerBtn">Регистрация</button>
            <button class="auth-btn lobbies-btn" id="lobbiesBtn" title="Активные лобби">ЛОББИ</button>
        `;
        
        // Переинициализация кнопок
        const newRegisterBtn = document.getElementById('registerBtn');
        const newLoginBtn = document.getElementById('loginBtn');
        if (newRegisterBtn) newRegisterBtn.addEventListener('click', () => openModal('registerModal'));
        if (newLoginBtn) newLoginBtn.addEventListener('click', () => openModal('loginModal'));
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

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAuthSession();
    });
} else {
    initAuthSession();
}

