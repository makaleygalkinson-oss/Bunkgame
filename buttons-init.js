// Универсальная система инициализации всех кнопок
// Этот файл гарантирует, что все кнопки работают правильно

console.log('🔧 Инициализация системы кнопок...');

// Флаг для отслеживания инициализации
let buttonsInitialized = false;

// Функция для безопасного получения элемента
function getElement(id) {
    return document.getElementById(id);
}

// Функция для безопасного добавления обработчика
function safeAddEventListener(element, event, handler) {
    if (!element) {
        console.warn(`⚠️ Элемент не найден для события ${event}`);
        return false;
    }
    
    // Удаляем старые обработчики через клонирование
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    
    // Добавляем новый обработчик
    newElement.addEventListener(event, handler);
    return true;
}

// Инициализация кнопки READY
function initReadyButton() {
    const readyBtn = getElement('readyBtn');
    if (!readyBtn) {
        console.warn('⚠️ Кнопка readyBtn не найдена');
        return;
    }
    
    // Активируем кнопку
    readyBtn.disabled = false;
    readyBtn.removeAttribute('disabled');
    readyBtn.style.opacity = '1';
    readyBtn.style.cursor = 'pointer';
    readyBtn.style.pointerEvents = 'auto';
    readyBtn.style.userSelect = 'none';
    
    // Добавляем обработчик
    safeAddEventListener(readyBtn, 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Кнопка Ready нажата');
        
        // Проверяем авторизацию
        if (typeof supabase !== 'undefined') {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id || (typeof window !== 'undefined' ? window.currentUserId : null);
            
            if (!currentUserId) {
                console.log('ℹ️ Пользователь не авторизован');
                if (typeof showAuthRequiredMessage === 'function') {
                    showAuthRequiredMessage();
                }
                if (typeof openModal === 'function') {
                    openModal('loginModal');
                }
                return;
            }
            
            // Обновляем currentUserId
            if (typeof window !== 'undefined') {
                window.currentUserId = currentUserId;
            }
            
            // Переключаем статус готовности
            if (typeof toggleReadyStatus === 'function') {
                await toggleReadyStatus();
            }
        }
    });
    
    console.log('✅ Кнопка Ready инициализирована');
}

// Инициализация кнопки START GAME
function initStartGameButton() {
    const startBtn = getElement('startGameBtn');
    if (!startBtn) {
        console.warn('⚠️ Кнопка startGameBtn не найдена');
        return;
    }
    
    // Активируем кнопку
    startBtn.disabled = false;
    startBtn.removeAttribute('disabled');
    startBtn.style.opacity = '1';
    startBtn.style.cursor = 'pointer';
    startBtn.style.pointerEvents = 'auto';
    
    // Добавляем обработчик
    safeAddEventListener(startBtn, 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Кнопка START GAME нажата');
        
        if (typeof window !== 'undefined' && typeof window.startGame === 'function') {
            await window.startGame(false, true);
        } else if (typeof startGame === 'function') {
            await startGame(false, true);
        } else {
            console.error('❌ Функция startGame не найдена');
        }
    });
    
    console.log('✅ Кнопка START GAME инициализирована');
}

// Инициализация кнопок авторизации
function initAuthButtons() {
    const loginBtn = getElement('loginBtn');
    const registerBtn = getElement('registerBtn');
    
    if (loginBtn) {
        safeAddEventListener(loginBtn, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Кнопка Войти нажата');
            if (typeof openModal === 'function') {
                openModal('loginModal');
            }
        });
        console.log('✅ Кнопка Войти инициализирована');
    }
    
    if (registerBtn) {
        safeAddEventListener(registerBtn, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Кнопка Регистрация нажата');
            if (typeof openModal === 'function') {
                openModal('registerModal');
            }
        });
        console.log('✅ Кнопка Регистрация инициализирована');
    }
}

// Инициализация кнопки ЛОББИ
function initLobbiesButton() {
    const lobbiesBtn = getElement('lobbiesBtn');
    if (!lobbiesBtn) {
        console.warn('⚠️ Кнопка lobbiesBtn не найдена');
        return;
    }
    
    safeAddEventListener(lobbiesBtn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Кнопка ЛОББИ нажата');
        const lobbiesModal = getElement('lobbiesModal');
        if (lobbiesModal) {
            lobbiesModal.style.display = 'flex';
            if (typeof updateLobbiesList === 'function') {
                updateLobbiesList();
            }
        }
    });
    
    console.log('✅ Кнопка ЛОББИ инициализирована');
}

// Инициализация кнопки правил
function initRulesButton() {
    const rulesBtn = getElement('rulesBtn');
    if (!rulesBtn) {
        return;
    }
    
    safeAddEventListener(rulesBtn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Кнопка Правила нажата');
        const rulesModal = getElement('rulesModal');
        if (rulesModal) {
            rulesModal.style.display = 'flex';
        }
    });
    
    console.log('✅ Кнопка Правила инициализирована');
}

// Инициализация кнопки выхода
function initLogoutButton() {
    const logoutBtn = getElement('logoutBtn');
    if (!logoutBtn) {
        return;
    }
    
    safeAddEventListener(logoutBtn, 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Кнопка Выйти нажата');
        
        if (typeof removeReadyStatus === 'function') {
            await removeReadyStatus();
        }
        
        if (typeof supabase !== 'undefined') {
            await supabase.auth.signOut();
        }
        
        if (typeof window !== 'undefined') {
            window.currentUserId = null;
        }
        
        location.reload();
    });
    
    console.log('✅ Кнопка Выйти инициализирована');
}

// Главная функция инициализации всех кнопок
function initAllButtons() {
    if (buttonsInitialized) {
        console.log('ℹ️ Кнопки уже инициализированы');
        return;
    }
    
    console.log('🔧 Начинаем инициализацию всех кнопок...');
    
    // Инициализируем все кнопки
    initReadyButton();
    initStartGameButton();
    initAuthButtons();
    initLobbiesButton();
    initRulesButton();
    initLogoutButton();
    
    buttonsInitialized = true;
    console.log('✅ Все кнопки инициализированы');
}

// Функция для повторной инициализации (когда кнопки пересоздаются динамически)
function reinitButtons() {
    buttonsInitialized = false;
    initAllButtons();
}

// Экспортируем функции
if (typeof window !== 'undefined') {
    window.initAllButtons = initAllButtons;
    window.reinitButtons = reinitButtons;
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAllButtons, 100);
    });
} else {
    setTimeout(initAllButtons, 100);
}

// Также инициализируем при полной загрузке страницы
window.addEventListener('load', () => {
    setTimeout(initAllButtons, 200);
});

// Повторная инициализация через 1 секунду (на случай, если кнопки создаются динамически)
setTimeout(initAllButtons, 1000);

// Повторная инициализация через 2 секунды
setTimeout(initAllButtons, 2000);

console.log('✅ Система инициализации кнопок загружена');

