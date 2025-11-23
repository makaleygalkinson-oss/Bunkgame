// Система регистрации

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
async function createUserInDB(userId, email, name) {
    try {
        const userData = {
            id: userId,
            email: email,
            name: name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('users')
            .insert([userData]);
        
        if (error) {
            // Если ошибка из-за дубликата, это нормально
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                console.log('Пользователь уже существует в БД');
                return null;
            }
            
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
            const dbError = await createUserInDB(authData.user.id, email, name);
            
            if (dbError) {
                console.warn('Предупреждение при создании пользователя в БД:', dbError);
                // Не прерываем процесс, так как пользователь уже создан в Auth
            }
            
            // Очищаем localStorage
            clearLocalStorage();
            
            messageEl.textContent = 'Регистрация успешна!';
            messageEl.className = 'form-message success';
            e.target.reset();
            
            // Закрываем модальное окно через 2 секунды
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

// Функции для работы с модальным окном
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

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initRegistrationForm();
    });
} else {
    initRegistrationForm();
}

// Экспорт функций
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;

