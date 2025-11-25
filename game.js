// Логика страницы игры

let currentLobbyId = null;
let currentUserId = null;
let blurRealtimeChannel = null;
let playersRealtimeChannel = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Страница игры загружена');
    
    // Проверяем наличие Supabase
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase не загружен');
        return;
    }
    
    // Получаем информацию о пользователе и лобби
    // Проверяем пользователя сначала в localStorage, потом в sessionStorage
    let userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        userStr = sessionStorage.getItem('currentUser');
    }
    const lobbyIdStr = sessionStorage.getItem('currentLobbyId');
    
    if (!userStr) {
        console.log('❌ Пользователь не авторизован, возвращаем на главную');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        currentUserId = user.id;
        
        if (!lobbyIdStr) {
            // Если нет lobby_id в sessionStorage, проверяем БД
            const { data: userData, error } = await supabase
                .from('users')
                .select('lobby_id')
                .eq('id', currentUserId)
                .maybeSingle();
            
            if (error) {
                console.error('Ошибка проверки lobby_id:', error);
                window.location.href = 'index.html';
                return;
            }
            
            if (!userData || !userData.lobby_id || userData.lobby_id === 0) {
                console.log('ℹ️ Пользователь не в лобби, возвращаем на главную');
                window.location.href = 'index.html';
                return;
            }
            
            currentLobbyId = userData.lobby_id.toString();
            sessionStorage.setItem('currentLobbyId', currentLobbyId);
        } else {
            currentLobbyId = lobbyIdStr;
        }
        
        // Инициализируем случайное распределение цветов для игроков
        await initializePlayerColors();
        
        // Загружаем информацию о лобби
        await loadLobbyInfo();
        
        // Загружаем информацию о игроках
        await loadPlayersInfo();
        
        // Загружаем состояние blur из БД
        await loadBlurStatesFromDB();
        
        // Загружаем карточку бункера
        loadBunkerCard();
        
        // Загружаем голосование
        await loadVoting();
        
        // Восстанавливаем данные для элементов, у которых blur уже снят
        // Используем задержку, чтобы DOM успел обновиться
        setTimeout(() => {
            restoreUnblurredData();
        }, 200);
        
        // Настраиваем кнопку выхода
        setupExitButton();
        
        // Настраиваем переворот карточек
        setupFlipCards();
        
        // Подписываемся на realtime обновления blur
        subscribeToBlurUpdates();
        
        // Подписываемся на realtime обновления игроков
        subscribeToPlayersUpdates();
        
    } catch (err) {
        console.error('Ошибка инициализации игры:', err);
        window.location.href = 'index.html';
    }
});

// Загрузка информации о лобби
async function loadLobbyInfo() {
    const gameInfo = document.getElementById('gameInfo');
    if (!gameInfo) return;
    
    try {
        // Получаем информацию о лобби
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('lobby_id, creator_name, active_role')
            .eq('lobby_id', parseInt(currentLobbyId))
            .maybeSingle();
        
        if (lobbyError) {
            console.error('Ошибка загрузки лобби:', lobbyError);
            gameInfo.innerHTML = '<p class="game-error">Ошибка загрузки информации о лобби</p>';
            return;
        }
        
        if (!lobby) {
            gameInfo.innerHTML = '<p class="game-error">Лобби не найдено</p>';
            return;
        }
        
        // Получаем список игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков:', playersError);
        }
        
        const roleNames = {
            'maniac': 'Маньяк',
            'killer': 'Убийца',
            'both': 'Маньяк и убийца',
            'none': 'Без активных ролей'
        };
        
        const roleName = roleNames[lobby.active_role] || lobby.active_role;
        const playersList = players && players.length > 0 
            ? players.map(p => p.name || p.email).join(', ')
            : 'Нет игроков';
        
        gameInfo.innerHTML = `
            <div class="game-lobby-info">
                <p><strong>ID Лобби:</strong> ${lobby.lobby_id}</p>
                <p><strong>Создатель:</strong> ${lobby.creator_name}</p>
                <p><strong>Активная роль:</strong> ${roleName}</p>
                <p><strong>Игроки в лобби:</strong> ${playersList}</p>
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка загрузки информации о лобби:', err);
        gameInfo.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Настройка кнопки выхода
function setupExitButton() {
    const exitBtn = document.getElementById('exitLobbyBtn');
    if (!exitBtn) {
        console.error('❌ Кнопка выхода не найдена');
        return;
    }
    
    exitBtn.addEventListener('click', async () => {
        const confirmExit = confirm('Вы уверены, что хотите выйти из лобби?');
        if (!confirmExit) return;
        
        await exitFromLobby();
    });
}

// Загрузка карточки бункера
function loadBunkerCard() {
    const bunkerCardContent = document.getElementById('bunkerCardContent');
    if (!bunkerCardContent) return;
    
    // Генерируем рандомные значения для карточки бункера
    const catastrophe = Math.floor(Math.random() * 100) + 1;
    const catastropheDesc = Math.floor(Math.random() * 100) + 1;
    const lifetime = Math.floor(Math.random() * 100) + 1;
    const capacity = Math.floor(Math.random() * 100) + 1;
    const medpoint = Math.floor(Math.random() * 100) + 1;
    const mechanicRoom = Math.floor(Math.random() * 100) + 1;
    const growingRoom = Math.floor(Math.random() * 100) + 1;
    const specialSupply = Math.floor(Math.random() * 100) + 1;
    
    bunkerCardContent.innerHTML = `
        <div class="bunker-card-info">
            <div class="bunker-info-item"><strong>Катастрофа:</strong> ${catastrophe}</div>
            <div class="bunker-info-item"><strong>Описание катастрофы:</strong> ${catastropheDesc}</div>
            <div class="bunker-info-item"><strong>Срок жизни в бункере:</strong> ${lifetime}</div>
            <div class="bunker-info-item"><strong>Условия Бункера:</strong> (вместимость: ${capacity} человек)</div>
            <div class="bunker-info-item"><strong>Оснащение бункера:</strong></div>
            <div class="bunker-info-subitem">Медпункт: ${medpoint}</div>
            <div class="bunker-info-subitem">Комната механика: ${mechanicRoom}</div>
            <div class="bunker-info-subitem">Комната выращивания: ${growingRoom}</div>
            <div class="bunker-info-item"><strong>Спец.Снабжение:</strong> ${specialSupply}</div>
        </div>
    `;
}

// Инициализация состояния blur для всех пунктов игрока (если еще не установлено)
function initializeBlurStates(playerId) {
    const itemTypes = ['genderAge', 'profession', 'health', 'hobby', 'phobia', 'fact1', 'fact2', 'action1', 'action2'];
    
    itemTypes.forEach(itemType => {
        const blurKey = `blur_${playerId}_${itemType}`;
        // Если состояние не установлено, устанавливаем по умолчанию 1 (заблюрено)
        if (sessionStorage.getItem(blurKey) === null) {
            sessionStorage.setItem(blurKey, '1');
        }
    });
}

// Инициализация состояния blur для всех пунктов игрока (если еще не установлено)
function initializeBlurStates(playerId) {
    const itemTypes = ['genderAge', 'profession', 'health', 'hobby', 'phobia', 'fact1', 'fact2', 'action1', 'action2'];
    
    itemTypes.forEach(itemType => {
        const blurKey = `blur_${playerId}_${itemType}`;
        // Если состояние не установлено, устанавливаем по умолчанию 1 (заблюрено)
        if (sessionStorage.getItem(blurKey) === null) {
            sessionStorage.setItem(blurKey, '1');
        }
    });
}

// Генерация HTML для пункта информации игрока с учетом состояния blur
// Теперь в DOM хранятся только placeholder'ы, реальные данные генерируются при снятии blur
function generatePlayerInfoItem(itemType, label, value, playerId) {
    // Получаем состояние blur для этого пункта (по умолчанию 1 - заблюрено)
    const blurKey = `blur_${playerId}_${itemType}`;
    const blurState = sessionStorage.getItem(blurKey);
    const isBlurred = blurState === null || blurState === '1' || blurState === 'true';
    
    // Если состояние не установлено, устанавливаем по умолчанию 1 (заблюрено)
    if (blurState === null) {
        sessionStorage.setItem(blurKey, '1');
    }
    
    // Если заблюрено - показываем placeholder вместо реальных данных
    // playerId уже хранится в data-player-id, это и есть seed для генерации
    const displayValue = isBlurred ? '***' : value;
    const blurClass = isBlurred ? 'blurred-text' : '';
    
    return `<div class="player-info-item" data-item="${itemType}" data-player-id="${playerId}"><strong>${label}:</strong> <span class="${blurClass}" data-seed="${playerId}">${displayValue}</span></div>`;
}

// Массив цветов для игроков (16 цветов)
const PLAYER_COLORS = [
    '#E0BBE4', // Нежный Лавандовый
    '#957DAD', // Глубокий Пурпурный
    '#D291BC', // Розовато-Лиловый
    '#FFC72C', // Яркий Медовый
    '#8D8D8D', // Средний Серый
    '#B5B5B5', // Светло-Серый
    '#C4F9B3', // Мятно-Зеленый
    '#7DF9FF', // Электрический Голубой
    '#FF9F45', // Яркий Оранжевый
    '#A6D96A', // Травяной Зеленый
    '#4ECDC4', // Бирюзовый
    '#F7CAC9', // Бледно-Розовый
    '#F0EAD6', // Светлый Кремовый
    '#C7C7C7', // Чуть более темный Светло-Серый
    '#FF6B6B', // Кораллово-Красный
    '#DAA520'  // Золотистый
];

// Распределение цветов между игроками (хранится в sessionStorage)
let playerColorsMap = null;

// Инициализация случайного распределения цветов для игроков в лобби
async function initializePlayerColors() {
    try {
        if (!currentLobbyId) {
            console.log('Нет currentLobbyId для инициализации цветов');
            return;
        }
        
        // Пытаемся загрузить распределение цветов из БД
        const { data: lobbyData, error: lobbyError } = await supabase
            .from('lobbies')
            .select('player_colors')
            .eq('lobby_id', parseInt(currentLobbyId))
            .maybeSingle();
        
        if (lobbyError) {
            console.error('Ошибка загрузки распределения цветов из БД:', lobbyError);
            // Продолжаем создавать новое распределение
        } else if (lobbyData && lobbyData.player_colors) {
            // Используем распределение из БД
            playerColorsMap = lobbyData.player_colors;
            // Также сохраняем в sessionStorage для быстрого доступа
            const savedColorsKey = `playerColors_${currentLobbyId}`;
            sessionStorage.setItem(savedColorsKey, JSON.stringify(playerColorsMap));
            console.log('✅ Загружено распределение цветов из БД:', playerColorsMap);
            return;
        }
        
        // Если распределения нет в БД, создаём новое
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков для распределения цветов:', playersError);
            return;
        }
        
        if (!players || players.length === 0) {
            console.log('Нет игроков для распределения цветов');
            return;
        }
        
        // Создаём копию массива цветов и перемешиваем её
        const shuffledColors = [...PLAYER_COLORS];
        for (let i = shuffledColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j], shuffledColors[i]];
        }
        
        // Распределяем цвета между игроками
        playerColorsMap = {};
        players.forEach((player, index) => {
            playerColorsMap[player.id] = shuffledColors[index % shuffledColors.length];
        });
        
        // Сохраняем распределение в БД
        const { error: updateError } = await supabase
            .from('lobbies')
            .update({ player_colors: playerColorsMap })
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (updateError) {
            console.error('Ошибка сохранения распределения цветов в БД:', updateError);
            // Если колонка не существует, просто используем sessionStorage
            if (updateError.code === '42703' || updateError.message?.includes('does not exist') || updateError.message?.includes('column')) {
                console.log('ℹ️ Колонка player_colors не существует в БД, используем только sessionStorage');
            }
        } else {
            console.log('✅ Распределение цветов сохранено в БД');
        }
        
        // Также сохраняем в sessionStorage для быстрого доступа
        const savedColorsKey = `playerColors_${currentLobbyId}`;
        sessionStorage.setItem(savedColorsKey, JSON.stringify(playerColorsMap));
        console.log('✅ Создано новое случайное распределение цветов:', playerColorsMap);
    } catch (err) {
        console.error('Ошибка инициализации цветов игроков:', err);
    }
}

// Обновление распределения цветов при присоединении нового игрока
async function updatePlayerColorsForNewPlayer(newPlayerId) {
    try {
        if (!currentLobbyId) {
            return;
        }
        
        // Загружаем текущее распределение из БД
        const { data: lobbyData, error: lobbyError } = await supabase
            .from('lobbies')
            .select('player_colors')
            .eq('lobby_id', parseInt(currentLobbyId))
            .maybeSingle();
        
        if (lobbyError) {
            console.error('Ошибка загрузки распределения цветов из БД:', lobbyError);
            return;
        }
        
        // Если распределения нет в БД, инициализируем заново
        if (!lobbyData || !lobbyData.player_colors) {
            await initializePlayerColors();
            return;
        }
        
        playerColorsMap = lobbyData.player_colors;
        
        // Если у нового игрока уже есть цвет, ничего не делаем
        if (playerColorsMap[newPlayerId]) {
            return;
        }
        
        // Находим использованные цвета
        const usedColors = new Set(Object.values(playerColorsMap));
        
        // Находим свободный цвет
        let availableColor = null;
        for (const color of PLAYER_COLORS) {
            if (!usedColors.has(color)) {
                availableColor = color;
                break;
            }
        }
        
        // Если все цвета использованы, используем первый цвет (циклически)
        if (!availableColor) {
            availableColor = PLAYER_COLORS[0];
        }
        
        // Присваиваем цвет новому игроку
        playerColorsMap[newPlayerId] = availableColor;
        
        // Сохраняем обновлённое распределение в БД
        const { error: updateError } = await supabase
            .from('lobbies')
            .update({ player_colors: playerColorsMap })
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (updateError) {
            console.error('Ошибка сохранения распределения цветов в БД:', updateError);
            // Если колонка не существует, просто используем sessionStorage
            if (updateError.code === '42703' || updateError.message?.includes('does not exist') || updateError.message?.includes('column')) {
                console.log('ℹ️ Колонка player_colors не существует в БД, используем только sessionStorage');
            }
        } else {
            console.log('✅ Распределение цветов обновлено в БД');
        }
        
        // Также сохраняем в sessionStorage для быстрого доступа
        const savedColorsKey = `playerColors_${currentLobbyId}`;
        sessionStorage.setItem(savedColorsKey, JSON.stringify(playerColorsMap));
        console.log('✅ Цвет присвоен новому игроку:', newPlayerId, availableColor);
    } catch (err) {
        console.error('Ошибка обновления цветов для нового игрока:', err);
    }
}

// Получение цвета для игрока из сохранённого распределения
function getPlayerColor(playerId) {
    if (!playerId) return '#d0d0d0'; // Цвет по умолчанию
    
    if (!playerColorsMap) {
        // Если распределение ещё не инициализировано, возвращаем цвет по умолчанию
        return '#d0d0d0';
    }
    
    return playerColorsMap[playerId] || '#d0d0d0';
}

// Список профессий
const PROFESSIONS = [
    'Врач', 'Учитель', 'Инженер', 'Программист', 'Повар', 'Строитель', 'Водитель',
    'Полицейский', 'Пожарный', 'Юрист', 'Бухгалтер', 'Менеджер', 'Продавец',
    'Парикмахер', 'Электрик', 'Сантехник', 'Художник', 'Музыкант', 'Журналист',
    'Фотограф', 'Дизайнер', 'Архитектор', 'Пилот', 'Стюардесса', 'Моряк',
    'Фермер', 'Ветеринар', 'Стоматолог', 'Фармацевт', 'Медсестра', 'Психолог',
    'Социальный работник', 'Библиотекарь', 'Архивариус', 'Переводчик', 'Экономист',
    'Маркетолог', 'HR-менеджер', 'Логист', 'Охранник', 'Курьер', 'Уборщик',
    'Сварщик', 'Токарь', 'Слесарь', 'Маляр', 'Плотник', 'Столяр'
];

// Список состояний здоровья
const HEALTH_CONDITIONS = [
    'ИДЕАЛЬНО ЗДОРОВ',
    'Хроническое заболевание',
    'Аллергия',
    'Слабое зрение',
    'Проблемы с сердцем',
    'Диабет',
    'Астма',
    'Артрит',
    'Гипертония',
    'Мигрень',
    'Бессонница',
    'Проблемы с пищеварением',
    'Остеохондроз',
    'Варикоз',
    'Проблемы с почками',
    'Проблемы с печенью',
    'Сколиоз',
    'Плоскостопие',
    'Проблемы со слухом',
    'Частые простуды'
];

// Список хобби
const HOBBIES = [
    'Стрельба из лука',
    'Психология',
    'Грибы и гомеопатия',
    'Йога',
    'Кулинария',
    'Радиолюбительство',
    'Пчеловодство',
    'Вышивание',
    'Резьба по дереву',
    'Массаж',
    'Скорочтение',
    'Жонглирование',
    'Ветеринария',
    'Мыловарение',
    'Гипноз',
    'Дайвинг',
    'Самогоноварение',
    'Альпинизм',
    'Фитнес',
    'Картография',
    'Кузнечное дело',
    'Астрономия',
    'Оригами',
    'Гончарство',
    'Дыхательная гимнастика',
    'Сбор грибов',
    'Моржевание',
    'Татуировщик',
    'Свечийное дело',
    'Бокс',
    'Пение',
    'Паркур',
    'Травничество',
    'Звёздные карты',
    'Католичество',
    'Шахматы',
    'Танцы',
    'Каллиграфия',
    'Фотография',
    'Гитара',
    'Тайский бокс',
    'Гороскопы',
    'Пейнтбол',
    'Киберспортсмен',
    'Был инструктором по выживанию'
];

// Список фобий
const PHOBIAS = [
    'Клаустрофобия',
    'Ноктофобия',
    'Арахнофобия',
    'Гидрофобия',
    'Аэрофобия',
    'Гемофобия',
    'Эмметрофобия',
    'Трипанофобия',
    'Микофобия',
    'Акуфобия',
    'Патфобия',
    'Апофобия',
    'Гипсофобия',
    'Некрофобия',
    'Зоофобия',
    'Пиррофобия',
    'Тафефобия',
    'Алиурфобия',
    'Гермофобия',
    'Фобофобия',
    'Антропофобия',
    'Демофобия',
    'Киберфобия',
    'Радиофобия',
    'Токсифобия',
    'Океанофобия',
    'Сциомофобия',
    'Батрахофобия',
    'Сомнифобия',
    'Эргофобия',
    'Фонофобия',
    'Технофобия',
    'Криофобия',
    'Номофобия',
    'Аутофобия',
    'Гаптофобия',
    'Нозокомефобия',
    'Аквафобия',
    'Гленофобия',
    'Лилофобия',
    'Копофобия',
    'Аблютофобия',
    'Катагельофобия',
    'Педофобия',
    'Гипенгиофобия',
    'Коулрофобия',
    'Трискайдекафобия',
    'Ксенофобия',
    'Нет фобий'
];

// Список фактов
const FACTS = [
    'Проходил курсы самообороны',
    'Работал поваром в ресторане',
    'Проходил курсы первой помощи',
    'Работал охранником в банке',
    'Пережил кораблекрушение',
    'Проходил курсы выживания в лесу',
    'Работал механиком на заводе',
    'Проходил курсы программирования',
    'Работал спасателем на воде',
    'Пережил ограбление',
    'Работал барменом в клубе',
    'Проходил курсы электрика',
    'Работал гидом в горах',
    'Пережил автокатастрофу',
    'Проходил курсы агронома',
    'Работал журналистом',
    'Проходил курсы фитнес-тренера',
    'Работал водителем грузовика',
    'Пережил ураган',
    'Проходил курсы сантехника',
    'Работал актёром в театре',
    'Работал фермером',
    'Пережил лесной пожар',
    'Проходил курсы медбрата',
    'Работал строителем',
    'Проходил курсы пилота',
    'Работал учителем',
    'Пережил эпидемию',
    'Работал музыкантом',
    'Проходил курсы дайвера',
    'Работал продавцом',
    'Пережил землетрясение',
    'Работал ветеринаром',
    'Пережил взрыв',
    'Работал дизайнером',
    'Пережил наводнение',
    'Проходил курсы самогонщика',
    'Работал геологом',
    'Проходил курсы альпиниста',
    'Работал фармацевтом',
    'Проходил обучение в Counter Strike'
];

// Список карточек действий
const ACTION_CARDS = [
    'Иммунитет к голосованию: Пропустите раунд голосования против себя.',
    'Смена профессии: Выбросьте свою профессию и возьмите новую из колоды.',
    'Перераспределение багажа: Поменяйтесь багажом с любым игроком.',
    'Принуждение к раскрытию: Заставьте цель открыть факт досрочно.',
    'Удвоение голосов: В этом раунде ваши голоса считаются за два.',
    'Добавление места в бункере: +1 слот для всех (на раунд).',
    'Заставьте игрока проголосовать за вас или открыть фобию.',
    'Улучшите здоровье любого (включая себя).',
    'Все голосуют заново, но нельзя голосовать в тех, в кого голосовали ранее.',
    'Можете сбросить карту фобий, на новую из колоды(только себе).',
    '+1 голос на голосовании(в любого).',
    'Верните изгнанного в игру на раунд.',
    'Поменяйте карту катастрофы, на новую(включая все комнаты/характеристики бункера).',
    'Поменяйте свою карту состояния здоровья на новую из колоды',
    'Поменяйте любому карту здоровья на новую из колоды(кроме себя)',
    'Поменяйте карту фобий любому(кроме себя)',
    'Поменяйте карту хобби игрокам на чётных местах',
    'Украдите багаж у любого игрока',
    'Угроза, рядом с бункером враждебный отряд выживших',
    'Угроза, через 10 лет в место где бункер, ударит метеорит',
    'Поменяйте карту пол и возраст, но при этом меняется и здоровье',
    'Если во время голосования вы громко рыгнёте, ведущий поменяет карту профессий(только вам)',
    '-2 голоса на голосовании(только для других)',
    'Если вас кикают из бункера используйте, немедленно начинается событие',
    'Водитель такси посетил вас в бункере, и отдал вам свой багаж(+1 предмет)',
    'Поменяйтесь здоровьем с игроком справа/слева от вас',
    'Отнимает маму у ведущего, и добавляет вам в багаж(Людмила 46 лет(Женщина))'
];

// Генерация стабильных рандомных значений для игрока на основе его ID
function generatePlayerCardData(playerId) {
    // Используем ID игрока как seed для генерации стабильных значений
    const seed = playerId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Простая функция для генерации псевдослучайных чисел на основе seed
    function seededRandom(seed, index) {
        const x = Math.sin((seed + index) * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }
    
    // Генерация пола и возраста: "Мужчина: X лет" или "Женщина: X лет", где X от 18 до 87
    // Используем счетчик выходов из лобби для изменения seed при каждом выходе
    const exitCount = parseInt(sessionStorage.getItem(`exitCount_${playerId}`) || '0');
    const seedWithExit = seed + exitCount * 1000; // Добавляем счетчик выходов к seed
    
    const genderRandom = seededRandom(seedWithExit, 1);
    const gender = genderRandom < 0.5 ? 'Мужчина' : 'Женщина';
    const age = Math.floor(seededRandom(seedWithExit, 1.5) * (87 - 18 + 1)) + 18; // От 18 до 87 включительно
    const genderAge = `${gender}: ${age} лет`;
    
    // Генерация профессии: "Профессия: X(Z лет)", где X - случайная профессия, Z - стаж
    const professionIndex = Math.floor(seededRandom(seedWithExit, 2) * PROFESSIONS.length);
    const professionName = PROFESSIONS[professionIndex];
    
    // Вычисление стажа на основе возраста
    // Минимальный возраст начала работы: 18 лет
    // Максимальный возможный стаж: возраст - 18
    // Но делаем реалистичным: для молодых (18-25) стаж от 1 до (возраст - 18)
    // Для средних (26-40) стаж от 1 до min(возраст - 18, 20)
    // Для старших (41+) стаж от 3 до min(возраст - 18, 35)
    const maxPossibleExperience = age - 18;
    let minExperience, maxExperience;
    
    if (age <= 25) {
        // Молодые: стаж от 1 до (возраст - 18)
        minExperience = 1;
        maxExperience = Math.max(1, maxPossibleExperience);
    } else if (age <= 40) {
        // Средние: стаж от 1 до min(возраст - 18, 20)
        minExperience = 1;
        maxExperience = Math.min(maxPossibleExperience, 20);
    } else {
        // Старшие: стаж от 3 до min(возраст - 18, 35)
        minExperience = 3;
        maxExperience = Math.min(maxPossibleExperience, 35);
    }
    
    const experience = Math.floor(seededRandom(seedWithExit, 2.5) * (maxExperience - minExperience + 1)) + minExperience;
    const profession = `${professionName} (${experience} лет)`;
    
    // Генерация состояния здоровья: "Состояние здоровья: X(Z%)"
    // Вероятность выпадения "ИДЕАЛЬНО ЗДОРОВ" - 50%
    const healthRandom = seededRandom(seedWithExit, 3);
    let healthCondition;
    if (healthRandom < 0.5) {
        // 50% вероятность - "ИДЕАЛЬНО ЗДОРОВ"
        healthCondition = 'ИДЕАЛЬНО ЗДОРОВ';
    } else {
        // 50% вероятность - случайное состояние из списка (кроме "ИДЕАЛЬНО ЗДОРОВ")
        const otherConditions = HEALTH_CONDITIONS.filter(c => c !== 'ИДЕАЛЬНО ЗДОРОВ');
        const conditionIndex = Math.floor(seededRandom(seedWithExit, 3.1) * otherConditions.length);
        healthCondition = otherConditions[conditionIndex];
    }
    
    // Генерация процента: от 10% до 100% с шагом 10 (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)
    const healthPercent = Math.floor(seededRandom(seedWithExit, 3.2) * 10) * 10 + 10; // От 10 до 100 с шагом 10
    const health = `${healthCondition} (${healthPercent}%)`;
    
    // Генерация хобби: "Хобби: X(Y лет)", где X - случайное хобби из списка, Y - стаж от 1 до 20 лет
    const hobbyIndex = Math.floor(seededRandom(seedWithExit, 4) * HOBBIES.length);
    const hobbyName = HOBBIES[hobbyIndex];
    
    // Вычисление стажа хобби на основе возраста
    // Стаж от 1 до 20 лет, но зависит от возраста
    // Для молодых (18-25) стаж от 1 до 5 лет
    // Для средних (26-40) стаж от 1 до 10 лет
    // Для старших (41+) стаж от 1 до 20 лет
    let maxHobbyExperience;
    if (age <= 25) {
        maxHobbyExperience = 5;
    } else if (age <= 40) {
        maxHobbyExperience = 10;
    } else {
        maxHobbyExperience = 20;
    }
    
    const minHobbyExperience = 1;
    const hobbyExperience = Math.floor(seededRandom(seedWithExit, 4.5) * (maxHobbyExperience - minHobbyExperience + 1)) + minHobbyExperience;
    const hobby = `${hobbyName} (${hobbyExperience} лет)`;
    
    // Генерация фобии: "Фобия: X", где X - случайная фобия из списка
    // Вероятность выпадения "Нет фобий" - 50%
    const phobiaRandom = seededRandom(seedWithExit, 5);
    let phobia;
    if (phobiaRandom < 0.5) {
        // 50% вероятность - "Нет фобий"
        phobia = 'Нет фобий';
    } else {
        // 50% вероятность - случайная фобия из списка (кроме "Нет фобий")
        const otherPhobias = PHOBIAS.filter(p => p !== 'Нет фобий');
        const phobiaIndex = Math.floor(seededRandom(seedWithExit, 5.1) * otherPhobias.length);
        phobia = otherPhobias[phobiaIndex];
    }
    
    // Генерация фактов: "Факт №1: X" и "Факт №2: Y", где X и Y - разные факты из списка
    const fact1Index = Math.floor(seededRandom(seedWithExit, 6) * FACTS.length);
    const fact1 = FACTS[fact1Index];
    
    // Для fact2 выбираем факт, который не совпадает с fact1
    const remainingFacts = FACTS.filter((_, index) => index !== fact1Index);
    const fact2Index = Math.floor(seededRandom(seedWithExit, 7) * remainingFacts.length);
    const fact2 = remainingFacts[fact2Index];
    
    // Генерация карточек действий: "Карточка действия №1: X" и "Карточка действия №2: Y", где X и Y - разные действия из списка
    const action1Index = Math.floor(seededRandom(seedWithExit, 8) * ACTION_CARDS.length);
    const action1 = ACTION_CARDS[action1Index];
    
    // Для action2 выбираем действие, которое не совпадает с action1
    const remainingActions = ACTION_CARDS.filter((_, index) => index !== action1Index);
    const action2Index = Math.floor(seededRandom(seedWithExit, 9) * remainingActions.length);
    const action2 = remainingActions[action2Index];
    
    return {
        genderAge: genderAge,
        profession: profession,
        health: health,
        hobby: hobby,
        phobia: phobia,
        fact1: fact1,
        fact2: fact2,
        action1: action1,
        action2: action2
    };
}

// Загрузка информации о игроках
async function loadPlayersInfo() {
    const currentPlayerNameEl = document.getElementById('currentPlayerName');
    const currentPlayerCardEl = document.getElementById('currentPlayerCard');
    const playersContent = document.getElementById('playersContent');
    
    if (!currentPlayerNameEl || !currentPlayerCardEl || !playersContent) return;
    
    try {
        // Получаем информацию о текущем пользователе
        // Проверяем пользователя сначала в localStorage, потом в sessionStorage
    let userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        userStr = sessionStorage.getItem('currentUser');
    }
        if (!userStr) return;
        
        const currentUser = JSON.parse(userStr);
        const currentUserName = currentUser.name || currentUser.email || 'Неизвестный';
        
        // Получаем цвет для текущего игрока
        const currentPlayerColor = getPlayerColor(currentUserId);
        
        // Отображаем ник текущего пользователя в шапке с цветом
        currentPlayerNameEl.textContent = currentUserName;
        currentPlayerNameEl.style.color = currentPlayerColor;
        
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков:', playersError);
            currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки игроков</p>';
            return;
        }
        
        if (!players || players.length === 0) {
            currentPlayerCardEl.innerHTML = '<p>Нет игроков в лобби</p>';
            return;
        }
        
        // Находим текущего игрока и остальных
        const currentPlayer = players.find(p => p.id === currentUserId);
        const otherPlayers = players.filter(p => p.id !== currentUserId);
        
        
        // Генерируем данные для карточки текущего игрока
        if (currentPlayer) {
            const currentPlayerData = generatePlayerCardData(currentPlayer.id);
            // В карточке текущего игрока НЕ должно быть blur вообще
            currentPlayerCardEl.innerHTML = `
                <div class="player-card-info">
                    <div class="player-info-item" data-item="genderAge" data-player-id="${currentPlayer.id}">
                        <strong>Пол и возраст:</strong><span>${currentPlayerData.genderAge}</span>
                        <button class="blur-toggle-btn" data-item="genderAge" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="profession" data-player-id="${currentPlayer.id}">
                        <strong>Профессия:</strong><span>${currentPlayerData.profession}</span>
                        <button class="blur-toggle-btn" data-item="profession" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="health" data-player-id="${currentPlayer.id}">
                        <strong>Состояние здоровья:</strong><span>${currentPlayerData.health}</span>
                        <button class="blur-toggle-btn" data-item="health" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="hobby" data-player-id="${currentPlayer.id}">
                        <strong>Хобби:</strong><span>${currentPlayerData.hobby}</span>
                        <button class="blur-toggle-btn" data-item="hobby" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="phobia" data-player-id="${currentPlayer.id}">
                        <strong>Фобия:</strong><span>${currentPlayerData.phobia}</span>
                        <button class="blur-toggle-btn" data-item="phobia" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="fact1" data-player-id="${currentPlayer.id}">
                        <strong>Факт №1:</strong><span>${currentPlayerData.fact1}</span>
                        <button class="blur-toggle-btn" data-item="fact1" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="fact2" data-player-id="${currentPlayer.id}">
                        <strong>Факт №2:</strong><span>${currentPlayerData.fact2}</span>
                        <button class="blur-toggle-btn" data-item="fact2" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="action1" data-player-id="${currentPlayer.id}">
                        <strong>Карточка действия №1:</strong><span>${currentPlayerData.action1}</span>
                        <button class="blur-toggle-btn" data-item="action1" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                    <div class="player-info-item" data-item="action2" data-player-id="${currentPlayer.id}">
                        <strong>Карточка действия №2:</strong><span>${currentPlayerData.action2}</span>
                        <button class="blur-toggle-btn" data-item="action2" data-player-id="${currentPlayer.id}" title="Переключить blur">👁️</button>
                    </div>
                </div>
                <button class="current-player-bottom-btn" id="currentPlayerBottomBtn">Голосовать</button>
            `;
            
            // Настраиваем обработчики для кнопок переключения blur
            setupBlurToggleButtons();
            // Настраиваем обработчики для кнопок обновления
            setupRefreshButtons();
            // Настраиваем кнопку голосования
            setupVotingButton();
            
            // Применяем цвет текущего игрока к кнопке "Голосовать"
            const votingBtn = document.getElementById('currentPlayerBottomBtn');
            if (votingBtn && currentPlayerColor) {
                votingBtn.style.background = `${currentPlayerColor}20`;
                votingBtn.style.borderColor = currentPlayerColor;
                votingBtn.style.color = currentPlayerColor;
                votingBtn.style.textShadow = `0 0 10px ${currentPlayerColor}80`;
                votingBtn.style.boxShadow = `0 4px 20px ${currentPlayerColor}40`;
                
                // Добавляем hover эффект
                votingBtn.addEventListener('mouseenter', () => {
                    votingBtn.style.background = `${currentPlayerColor}30`;
                    votingBtn.style.borderColor = currentPlayerColor;
                    votingBtn.style.boxShadow = `0 6px 25px ${currentPlayerColor}60`;
                });
                
                votingBtn.addEventListener('mouseleave', () => {
                    votingBtn.style.background = `${currentPlayerColor}20`;
                    votingBtn.style.boxShadow = `0 4px 20px ${currentPlayerColor}40`;
                });
            }
            
            // Генерируем данные для элементов, у которых blur уже снят
            // Используем небольшую задержку, чтобы DOM успел обновиться
            setTimeout(() => {
                restoreUnblurredData();
            }, 100);
        } else {
            currentPlayerCardEl.innerHTML = '';
        }
        
        // Карточки других игроков (ВНЕ карточки текущего игрока)
        if (otherPlayers.length === 0) {
            playersContent.innerHTML = '';
        } else {
            const otherPlayersHTML = otherPlayers.map(player => {
                const playerName = player.name || player.email || 'Неизвестный';
                
                // Инициализируем состояние blur для всех пунктов этого игрока
                initializeBlurStates(player.id);
                
                // Генерируем стабильные значения для карточки игрока на основе его ID
                const playerData = generatePlayerCardData(player.id);
                
                // ВАЖНО: data-player-id в элементах должен быть равен ID игрока, чья карточка отображается
                // Это нужно для того, чтобы при клике на кнопку в карточке текущего игрока
                // можно было найти и обновить элементы в карточках других игроков
                // player.id - это ID игрока, чья карточка отображается в этой карточке
                return `
                    <div class="flip-card" style="min-height: 900px; width: 468px; flex-shrink: 0;" data-player-id="${player.id}">
                        <div class="flip-card-inner flipped">
                            <div class="flip-card-front game-block player-card-block">
                                <div class="game-block-header">
                                    <h2 class="game-block-title">${playerName}</h2>
                                </div>
                                <div class="game-block-content player-card-info">
                                    ${generatePlayerInfoItem('genderAge', 'Пол и возраст', playerData.genderAge, player.id)}
                                    ${generatePlayerInfoItem('profession', 'Профессия', playerData.profession, player.id)}
                                    ${generatePlayerInfoItem('health', 'Состояние здоровья', playerData.health, player.id)}
                                    ${generatePlayerInfoItem('hobby', 'Хобби', playerData.hobby, player.id)}
                                    ${generatePlayerInfoItem('phobia', 'Фобия', playerData.phobia, player.id)}
                                    ${generatePlayerInfoItem('fact1', 'Факт №1', playerData.fact1, player.id)}
                                    ${generatePlayerInfoItem('fact2', 'Факт №2', playerData.fact2, player.id)}
                                    ${generatePlayerInfoItem('action1', 'Карточка действия №1', playerData.action1, player.id)}
                                    ${generatePlayerInfoItem('action2', 'Карточка действия №2', playerData.action2, player.id)}
                                </div>
                            </div>
                            <div class="flip-card-back">
                                <img src="bunker-logo.png" alt="BUNKER THE BOARD GAME" class="bunker-logo">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            playersContent.innerHTML = `<div class="players-list">${otherPlayersHTML}</div>`;
            
            // Генерируем данные для элементов других игроков, у которых blur уже снят
            // Используем небольшую задержку, чтобы DOM успел обновиться
            setTimeout(() => {
                restoreUnblurredData();
            }, 100);
        }
        
    } catch (err) {
        console.error('Ошибка загрузки информации о игроках:', err);
        currentPlayerCardEl.innerHTML = '<p class="game-error">Ошибка загрузки информации</p>';
    }
}

// Загрузка состояния blur из БД
async function loadBlurStatesFromDB() {
    try {
        if (!currentLobbyId) {
            console.log('Нет currentLobbyId, пропускаем загрузку blur_states');
            return;
        }
        
        try {
            // Сначала проверяем доступ к лобби (получаем только lobby_id)
            const { data: lobbyCheck, error: checkError } = await supabase
                .from('lobbies')
                .select('lobby_id')
                .eq('lobby_id', parseInt(currentLobbyId))
                .single();
            
            if (checkError) {
                console.error('❌ Ошибка доступа к лобби:', checkError);
                console.error('   Код ошибки:', checkError.code);
                console.error('   Сообщение:', checkError.message);
                return;
            }
            
            console.log('✅ Доступ к лобби подтвержден, lobby_id:', lobbyCheck.lobby_id);
            
            // Теперь пробуем получить blur_states
            // Используем SELECT * чтобы получить все колонки
            let lobbyData = null;
            let error = null;
            
            const result = await supabase
                .from('lobbies')
                .select('*')
                .eq('lobby_id', parseInt(currentLobbyId))
                .single();
            
            if (result.error) {
                error = result.error;
                console.error('❌ Ошибка загрузки данных лобби:', error);
                console.error('   Код ошибки:', error.code);
                console.error('   Сообщение:', error.message);
                console.error('   Детали:', error.details);
                console.error('   Подсказка:', error.hint);
                
                // Если это ошибка 400 Bad Request, возможно проблема с RLS или форматом
                if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
                    console.error('⚠️ Возможна проблема с правами доступа (RLS). Проверьте политики безопасности в Supabase.');
                }
                
                // Если колонка не существует, это нормально - просто пропускаем
                if (error.code === '42703' || 
                    error.code === 'PGRST116' || 
                    error.message?.includes('column') || 
                    error.message?.includes('does not exist') ||
                    error.message?.includes('lobbies.id') ||
                    error.message?.includes('blur_states')) {
                    console.log('ℹ️ Колонка blur_states не существует в БД или недоступна, используем только sessionStorage');
                    return;
                }
                return;
            } else {
                lobbyData = result.data;
                console.log('✅ Данные лобби получены успешно через SELECT *');
                console.log('   Все колонки:', Object.keys(lobbyData));
                console.log('   blur_states:', lobbyData.blur_states);
                console.log('   Тип blur_states:', typeof lobbyData.blur_states);
            }
        
        if (lobbyData && lobbyData.blur_states) {
            const blurStates = lobbyData.blur_states;
            
            // Загружаем состояния blur в sessionStorage
            Object.keys(blurStates).forEach(playerId => {
                const playerBlurStates = blurStates[playerId] || {};
                Object.keys(playerBlurStates).forEach(itemType => {
                    const blurState = playerBlurStates[itemType];
                    const blurKey = `blur_${playerId}_${itemType}`;
                    sessionStorage.setItem(blurKey, blurState);
                });
            });
            
            console.log('✅ Состояния blur загружены из БД');
            
            // Перезагружаем карточки игроков с обновленными состояниями blur
            await loadPlayersInfo();
            // Восстанавливаем данные для элементов, у которых blur уже снят
            // Используем задержку, чтобы DOM успел обновиться
            setTimeout(() => {
                restoreUnblurredData();
            }, 150);
            }
        } catch (dbError) {
            // Если ошибка БД, просто используем sessionStorage
            console.log('ℹ️ Ошибка работы с БД, используем только sessionStorage:', dbError.message);
        }
    } catch (err) {
        console.error('Ошибка загрузки blur_states:', err);
    }
}

// Загрузка голосования
async function loadVoting() {
    const votingContent = document.getElementById('votingContent');
    if (!votingContent) return;
    
    try {
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков для голосования:', playersError);
            votingContent.innerHTML = '<p class="game-error">Ошибка загрузки игроков</p>';
            return;
        }
        
        if (!players || players.length === 0) {
            votingContent.innerHTML = '<p>Нет игроков в лобби</p>';
            return;
        }
        
        // Загружаем все голоса из БД
        const { data: lobbyData, error: votesError } = await supabase
            .from('lobbies')
            .select('votes')
            .eq('lobby_id', parseInt(currentLobbyId))
            .maybeSingle();
        
        let allVotes = {};
        if (!votesError && lobbyData && lobbyData.votes) {
            allVotes = lobbyData.votes;
        }
        
        // Создаем список игроков с кружочками для всех голосующих
        const votingHTML = players.map(player => {
            const playerName = player.name || player.email || 'Неизвестный';
            const playerColor = getPlayerColor(player.id);
            
            // Находим всех, кто проголосовал за этого игрока
            const votesForPlayer = Object.entries(allVotes)
                .filter(([voterId, voteData]) => voteData && voteData.targetId === player.id)
                .map(([voterId, voteData]) => ({
                    voterId: voterId,
                    voterName: voteData.voterName || 'Неизвестный',
                    firstLetter: voteData.firstLetter || '●',
                    voterColor: getPlayerColor(voterId)
                }));
            
            // Создаем HTML для кружочков
            const circlesHTML = votesForPlayer.map(vote => {
                return `<span class="voting-circle" style="color: ${vote.voterColor}; background-color: ${vote.voterColor}20; border: 2px solid ${vote.voterColor};" title="${vote.voterName}">${vote.firstLetter}</span>`;
            }).join('');
            
            return `
                <div class="voting-item">
                    <span class="voting-player-name" style="color: ${playerColor};">${playerName}</span>
                    ${circlesHTML}
                </div>
            `;
        }).join('');
        
        votingContent.innerHTML = `
            <div class="voting-list">
                ${votingHTML}
            </div>
        `;
        
    } catch (err) {
        console.error('Ошибка загрузки голосования:', err);
        votingContent.innerHTML = '<p class="game-error">Ошибка загрузки голосования</p>';
    }
}



// Настройка кнопок переключения blur
function setupBlurToggleButtons() {
    // Используем делегирование событий для кнопок переключения blur
    document.addEventListener('click', async (e) => {
        const button = e.target.closest('.blur-toggle-btn');
        if (!button) return;
        
        // Предотвращаем переворот карточки и другие действия
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const itemType = button.getAttribute('data-item');
        const playerId = button.getAttribute('data-player-id');
        
        if (!itemType || !playerId) {
            console.log('Отсутствуют data-item или data-player-id');
            return;
        }
        
        // Получаем текущее состояние blur
        const blurKey = `blur_${playerId}_${itemType}`;
        const currentState = sessionStorage.getItem(blurKey);
        const newState = (currentState === '1' || currentState === null) ? '0' : '1';
        
        console.log('🔄 Переключение blur:', itemType, 'для игрока:', playerId);
        console.log('  - текущее состояние:', currentState || '1 (по умолчанию)');
        console.log('  - новое состояние:', newState);
        
        // Сохраняем новое состояние в sessionStorage
        sessionStorage.setItem(blurKey, newState);
        
        // Сохраняем в Supabase для синхронизации (если есть колонка)
        await saveBlurState(playerId, itemType, newState);
        
        // Обновляем визуальное отображение blur на карточках других игроков
        updateBlurDisplay(playerId, itemType, newState);
        
        // Если blur снят (newState === '0'), генерируем и показываем реальные данные
        if (newState === '0') {
            generateAndDisplayData(playerId, itemType);
        }
        
        console.log('✅ Состояние blur обновлено:', blurKey, '=', newState);
        
        return false; // Дополнительная защита от всплытия события
    }, true); // Используем capture phase для более раннего перехвата
}

// Восстановление данных для элементов, у которых blur уже снят при загрузке
function restoreUnblurredData() {
    console.log('🔄 Восстановление данных для элементов с снятым blur...');
    
    // Находим все элементы с data-player-id (где должны быть данные)
    const allItems = document.querySelectorAll('.player-info-item[data-player-id]');
    const currentPlayerCardEl = document.getElementById('currentPlayerCard');
    
    console.log(`  - найдено элементов: ${allItems.length}`);
    
    if (allItems.length === 0) {
        console.warn('  ⚠ Элементы не найдены! Возможно, DOM еще не обновлен.');
        return;
    }
    
    // Группируем по playerId и itemType, чтобы не генерировать несколько раз
    const processed = new Set();
    let restoredCount = 0;
    
    allItems.forEach(item => {
        // Пропускаем элементы из карточки текущего игрока (там данные уже реальные)
        if (currentPlayerCardEl && currentPlayerCardEl.contains(item)) {
            return;
        }
        
        const playerId = item.getAttribute('data-player-id');
        const itemType = item.getAttribute('data-item');
        
        if (!playerId || !itemType) {
            return;
        }
        
        const key = `${playerId}_${itemType}`;
        
        // Пропускаем, если уже обработали
        if (processed.has(key)) {
            return;
        }
        
        processed.add(key);
        
        const blurKey = `blur_${playerId}_${itemType}`;
        let blurState = sessionStorage.getItem(blurKey);
        
        // Если состояние не установлено, проверяем, может быть оно в другом формате
        if (blurState === null) {
            // Проверяем все возможные варианты ключей
            const altKey1 = `blur_${playerId}_${itemType}`;
            const altKey2 = `blur_${itemType}_${playerId}`;
            blurState = sessionStorage.getItem(altKey1) || sessionStorage.getItem(altKey2);
        }
        
        console.log(`  - проверка: playerId=${playerId}, itemType=${itemType}, blurState=${blurState || 'null (по умолчанию заблюрено)'}, blurKey=${blurKey}`);
        
        // Если blur снят (состояние '0'), генерируем данные
        if (blurState === '0' || blurState === 0) {
            console.log(`  ✓ Восстанавливаем данные для ${itemType} игрока ${playerId}`);
            // Используем небольшую задержку для каждого элемента, чтобы DOM успел обновиться
            setTimeout(() => {
                generateAndDisplayData(playerId, itemType);
            }, 50 * restoredCount); // Небольшая задержка для каждого элемента
            restoredCount++;
        } else {
            console.log(`  - пропуск: blurState=${blurState} (не равно '0')`);
        }
    });
    
    console.log(`✅ Восстановление данных завершено. Обработано: ${processed.size} элементов, восстановлено: ${restoredCount}`);
}

// Генерация и отображение реальных данных при снятии blur
function generateAndDisplayData(playerId, itemType) {
    // Генерируем данные для игрока
    const playerData = generatePlayerCardData(playerId);
    
    // Получаем значение для данного типа
    let realValue = '';
    switch(itemType) {
        case 'genderAge':
            realValue = playerData.genderAge;
            break;
        case 'profession':
            realValue = playerData.profession;
            break;
        case 'health':
            realValue = playerData.health;
            break;
        case 'hobby':
            realValue = playerData.hobby;
            break;
        case 'phobia':
            realValue = playerData.phobia;
            break;
        case 'fact1':
            realValue = playerData.fact1;
            break;
        case 'fact2':
            realValue = playerData.fact2;
            break;
        case 'action1':
            realValue = playerData.action1;
            break;
        case 'action2':
            realValue = playerData.action2;
            break;
        default:
            return;
    }
    
    // Находим все элементы с данным типом для данного игрока
    // Исключаем карточку текущего игрока
    const currentPlayerCardEl = document.getElementById('currentPlayerCard');
    let allItems = document.querySelectorAll(`.player-info-item[data-item="${itemType}"][data-player-id="${playerId}"]`);
    
    if (currentPlayerCardEl) {
        allItems = Array.from(allItems).filter(item => !currentPlayerCardEl.contains(item));
    }
    
    console.log(`  - найдено элементов для обновления: ${allItems.length}`);
    
    if (allItems.length === 0) {
        console.warn(`  ⚠ Не найдены элементы для обновления данных! playerId=${playerId}, itemType=${itemType}`);
        return;
    }
    
    // Обновляем текст в span для каждого найденного элемента
    allItems.forEach((item, index) => {
        console.log(`  [${index + 1}/${allItems.length}] Обновление элемента:`, item);
        
        // Ищем span с data-seed или просто span с текстом (не кнопку)
        let span = item.querySelector('span[data-seed]');
        if (!span) {
            // Если не нашли с data-seed, ищем любой span, который не является кнопкой
            const allSpans = item.querySelectorAll('span');
            console.log(`    - найдено spans: ${allSpans.length}`);
            for (let s of allSpans) {
                if (!s.classList.contains('blur-toggle-btn') && !s.closest('.blur-toggle-btn')) {
                    span = s;
                    console.log(`    - выбран span:`, span);
                    break;
                }
            }
        }
        
        if (span) {
            const oldText = span.textContent;
            console.log(`    ✓ Обновляем данные для ${itemType}: "${oldText}" -> "${realValue}"`);
            span.textContent = realValue;
            span.classList.remove('blurred-text');
            // Убираем blur через inline стиль для надежности
            span.style.setProperty('filter', 'none', 'important');
            // Убираем placeholder, если он был
            if (span.textContent === '***') {
                span.textContent = realValue;
            }
            console.log(`    ✓ Данные обновлены. Новый текст: "${span.textContent}"`);
        } else {
            console.warn(`    ⚠ Не найден span для обновления в элементе:`, item);
            console.warn(`    - HTML элемента:`, item.outerHTML.substring(0, 200));
        }
    });
    
    console.log(`✅ Данные для ${itemType} игрока ${playerId} обновлены`);
}

// Настройка кнопок обновления
function setupRefreshButtons() {
    // Используем делегирование событий для кнопок обновления
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.refresh-btn');
        if (!button) return;
        
        // Предотвращаем переворот карточки и другие действия
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const itemType = button.getAttribute('data-item');
        const playerId = button.getAttribute('data-player-id');
        
        if (!itemType || !playerId) {
            console.log('Отсутствуют data-item или data-player-id');
            return;
        }
        
        // Пока кнопка ничего не делает
        console.log('🔄 Кнопка обновления нажата:', itemType, 'для игрока:', playerId);
    }, true); // Используем capture phase для более раннего перехвата
}

// Настройка кнопки голосования
function setupVotingButton() {
    const votingBtn = document.getElementById('currentPlayerBottomBtn');
    if (!votingBtn) {
        console.error('❌ Кнопка голосования не найдена');
        return;
    }
    
    votingBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await showVotingModal();
    });
}

// Показ модального окна для голосования
async function showVotingModal() {
    try {
        // Получаем список всех игроков в лобби
        const { data: players, error: playersError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('lobby_id', parseInt(currentLobbyId));
        
        if (playersError) {
            console.error('Ошибка загрузки игроков для голосования:', playersError);
            alert('Ошибка загрузки игроков');
            return;
        }
        
        if (!players || players.length === 0) {
            alert('Нет игроков в лобби');
            return;
        }
        
        // Исключаем текущего игрока из списка (нельзя голосовать против себя)
        const otherPlayers = players.filter(player => player.id !== currentUserId);
        
        if (otherPlayers.length === 0) {
            alert('Нет других игроков для голосования');
            return;
        }
        
        // Получаем текущий голос игрока
        const currentVoteStr = sessionStorage.getItem(`vote_${currentUserId}`);
        let currentVote = null;
        if (currentVoteStr) {
            try {
                currentVote = JSON.parse(currentVoteStr);
            } catch (e) {
                // Если не JSON, значит старый формат (просто ID)
                currentVote = { targetId: currentVoteStr };
            }
        }
        
        // Создаем HTML для списка игроков с кнопками
        const playersHTML = otherPlayers.map(player => {
            const playerName = player.name || player.email || 'Неизвестный';
            const isVoted = currentVote && currentVote.targetId === player.id;
            const playerColor = getPlayerColor(player.id);
            
            return `
                <div class="voting-modal-item">
                    <span class="voting-modal-player-name" style="color: ${playerColor};">${playerName}</span>
                    <div class="voting-modal-buttons">
                        <button class="vote-add-btn" data-player-id="${player.id}" ${isVoted ? 'disabled' : ''}>+ голос</button>
                        <button class="vote-remove-btn" data-player-id="${player.id}" ${!isVoted ? 'disabled' : ''}>- голос</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'voting-modal-overlay';
        modal.innerHTML = `
            <div class="voting-modal">
                <div class="voting-modal-header">
                    <h3>Голосование</h3>
                    <button class="voting-modal-close">&times;</button>
                </div>
                <div class="voting-modal-content">
                    ${playersHTML}
                </div>
            </div>
        `;
        
        // Добавляем обработчики для кнопок
        modal.querySelectorAll('.vote-add-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const targetPlayerId = btn.getAttribute('data-player-id');
                await addVote(targetPlayerId);
                // Закрываем модальное окно и обновляем его
                modal.remove();
                await showVotingModal();
            });
        });
        
        modal.querySelectorAll('.vote-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const targetPlayerId = btn.getAttribute('data-player-id');
                await removeVote();
                // Закрываем модальное окно и обновляем его
                modal.remove();
                await showVotingModal();
            });
        });
        
        // Обработчик закрытия модального окна
        modal.querySelector('.voting-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Добавляем модальное окно на страницу
        document.body.appendChild(modal);
        
    } catch (err) {
        console.error('Ошибка показа модального окна голосования:', err);
        alert('Ошибка загрузки данных');
    }
}

// Добавление голоса
async function addVote(targetPlayerId) {
    // Показываем подтверждение
    const confirmed = confirm('Вы уверены что голосуете в этого игрока?');
    if (!confirmed) {
        return;
    }
    
    // Получаем информацию о текущем игроке
    let userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        userStr = sessionStorage.getItem('currentUser');
    }
    const currentUser = JSON.parse(userStr);
    const currentUserName = currentUser.name || currentUser.email || 'Неизвестный';
    const firstLetter = currentUserName.charAt(0).toUpperCase();
    
    // Загружаем текущие голоса из БД
    const { data: lobbyData, error: fetchError } = await supabase
        .from('lobbies')
        .select('votes')
        .eq('lobby_id', parseInt(currentLobbyId))
        .maybeSingle();
    
    let allVotes = {};
    if (!fetchError && lobbyData && lobbyData.votes) {
        allVotes = lobbyData.votes;
    }
    
    // Добавляем новый голос
    allVotes[currentUserId] = {
        targetId: targetPlayerId,
        voterId: currentUserId,
        voterName: currentUserName,
        firstLetter: firstLetter
    };
    
    // Сохраняем в БД
    const { error: updateError } = await supabase
        .from('lobbies')
        .update({ votes: allVotes })
        .eq('lobby_id', parseInt(currentLobbyId));
    
    if (updateError) {
        console.error('Ошибка сохранения голоса в БД:', updateError);
        // Если колонка не существует, используем только sessionStorage
        if (updateError.code === '42703' || updateError.message?.includes('does not exist') || updateError.message?.includes('column')) {
            console.log('ℹ️ Колонка votes не существует в БД, используем только sessionStorage');
            const voteData = {
                targetId: targetPlayerId,
                voterId: currentUserId,
                voterName: currentUserName,
                firstLetter: firstLetter
            };
            sessionStorage.setItem(`vote_${currentUserId}`, JSON.stringify(voteData));
        }
    } else {
        console.log('✅ Голос сохранен в БД');
    }
    
    // Также сохраняем в sessionStorage для быстрого доступа
    const voteData = {
        targetId: targetPlayerId,
        voterId: currentUserId,
        voterName: currentUserName,
        firstLetter: firstLetter
    };
    sessionStorage.setItem(`vote_${currentUserId}`, JSON.stringify(voteData));
    
    // Обновляем отображение голосования
    await loadVoting();
    
    console.log('✅ Голос добавлен за игрока:', targetPlayerId);
}

// Удаление голоса
async function removeVote() {
    // Загружаем текущие голоса из БД
    const { data: lobbyData, error: fetchError } = await supabase
        .from('lobbies')
        .select('votes')
        .eq('lobby_id', parseInt(currentLobbyId))
        .maybeSingle();
    
    let allVotes = {};
    if (!fetchError && lobbyData && lobbyData.votes) {
        allVotes = lobbyData.votes;
    }
    
    // Удаляем голос текущего игрока
    delete allVotes[currentUserId];
    
    // Сохраняем в БД
    const { error: updateError } = await supabase
        .from('lobbies')
        .update({ votes: allVotes })
        .eq('lobby_id', parseInt(currentLobbyId));
    
    if (updateError) {
        console.error('Ошибка удаления голоса из БД:', updateError);
        // Если колонка не существует, используем только sessionStorage
        if (updateError.code === '42703' || updateError.message?.includes('does not exist') || updateError.message?.includes('column')) {
            console.log('ℹ️ Колонка votes не существует в БД, используем только sessionStorage');
        }
    } else {
        console.log('✅ Голос удален из БД');
    }
    
    // Удаляем голос из sessionStorage
    sessionStorage.removeItem(`vote_${currentUserId}`);
    
    // Обновляем отображение голосования
    await loadVoting();
    
    console.log('✅ Голос удален');
}

// Сохранение состояния blur в Supabase
async function saveBlurState(playerId, itemType, blurState) {
    try {
        if (!currentLobbyId) {
            console.log('Нет currentLobbyId, сохраняем только в sessionStorage');
            return;
        }
        
        // Сохраняем в sessionStorage
        const blurKey = `blur_${playerId}_${itemType}`;
        sessionStorage.setItem(blurKey, blurState);
        console.log('💾 Состояние blur сохранено в sessionStorage:', blurKey, '=', blurState);
        
        // Пытаемся сохранить в БД
        try {
            console.log('🔄 Попытка сохранить в БД...');
            console.log('   currentLobbyId:', currentLobbyId);
            console.log('   playerId:', playerId);
            console.log('   itemType:', itemType);
            console.log('   blurState:', blurState);
            
            // Сначала проверяем доступ к лобби
            const { data: lobbyCheck, error: checkError } = await supabase
                .from('lobbies')
                .select('lobby_id')
                .eq('lobby_id', parseInt(currentLobbyId))
                .single();
            
            if (checkError) {
                console.error('❌ Ошибка доступа к лобби:', checkError);
                console.error('   Код ошибки:', checkError.code);
                console.error('   Сообщение:', checkError.message);
                return;
            }
            
            console.log('✅ Доступ к лобби подтвержден, lobby_id:', lobbyCheck.lobby_id);
            
            // Получаем текущее состояние blur_states из лобби
            // Используем SELECT * чтобы получить все колонки
            let lobbyData = null;
            let fetchError = null;
            
            const result = await supabase
                .from('lobbies')
                .select('*')
                .eq('lobby_id', parseInt(currentLobbyId))
                .single();
            
            if (result.error) {
                fetchError = result.error;
                console.error('❌ Ошибка получения данных лобби:', fetchError);
                console.error('   Код ошибки:', fetchError.code);
                console.error('   Сообщение:', fetchError.message);
                console.error('   Детали:', fetchError.details);
                console.error('   Подсказка:', fetchError.hint);
                
                // Если это ошибка 400 Bad Request, возможно проблема с RLS или форматом
                if (fetchError.code === 'PGRST301' || fetchError.message?.includes('permission denied') || fetchError.message?.includes('RLS')) {
                    console.error('⚠️ Возможна проблема с правами доступа (RLS). Проверьте политики безопасности в Supabase.');
                }
                
                // Если колонка не существует, просто используем sessionStorage
                if (fetchError.code === '42703' || 
                    fetchError.code === 'PGRST116' ||
                    fetchError.message?.includes('does not exist') || 
                    fetchError.message?.includes('column') ||
                    fetchError.message?.includes('lobbies.id') ||
                    fetchError.message?.includes('blur_states')) {
                    console.log('ℹ️ Колонка blur_states не существует в БД или недоступна, используем только sessionStorage');
                    return;
                }
                return;
            } else {
                lobbyData = result.data;
                console.log('✅ Данные лобби получены через SELECT *');
                console.log('   Все колонки:', Object.keys(lobbyData));
                console.log('   Текущий blur_states:', lobbyData.blur_states);
                console.log('   Тип blur_states:', typeof lobbyData.blur_states);
            }
            
            // Обновляем состояние blur для конкретного игрока и пункта
            const blurStates = lobbyData.blur_states || {};
            if (!blurStates[playerId]) {
                blurStates[playerId] = {};
            }
            blurStates[playerId][itemType] = blurState;
            
            console.log('📝 Обновленное состояние blur_states:', JSON.stringify(blurStates, null, 2));
            
            // Сохраняем обновленное состояние в БД
            const { data: updateData, error: updateError } = await supabase
                .from('lobbies')
                .update({ blur_states: blurStates })
                .eq('lobby_id', parseInt(currentLobbyId))
                .select();
            
            if (updateError) {
                // Если колонка не существует, просто используем sessionStorage
                if (updateError.code === '42703' || 
                    updateError.code === 'PGRST116' ||
                    updateError.message?.includes('does not exist') || 
                    updateError.message?.includes('column')) {
                    console.log('ℹ️ Колонка blur_states не существует в БД, используем только sessionStorage');
                    console.log('   Код ошибки:', updateError.code);
                    console.log('   Сообщение:', updateError.message);
                    return;
                }
                console.error('❌ Ошибка сохранения blur_states:', updateError);
                console.error('   Код ошибки:', updateError.code);
                console.error('   Сообщение:', updateError.message);
            } else {
                console.log('✅ Состояние blur успешно сохранено в Supabase!');
                console.log('   Обновленные данные:', updateData);
            }
        } catch (dbError) {
            // Если ошибка БД, просто используем sessionStorage
            console.error('❌ Ошибка работы с БД:', dbError);
            console.error('   Сообщение:', dbError.message);
            console.error('   Стек:', dbError.stack);
        }
    } catch (err) {
        console.error('❌ Общая ошибка сохранения состояния blur:', err);
    }
}

// Обновление визуального отображения blur на карточках других игроков
function updateBlurDisplay(playerId, itemType, blurState) {
    const isBlurred = blurState === '1' || blurState === 'true';
    
    // Получаем элемент карточки текущего игрока, чтобы исключить его из обновления
    const currentPlayerCardEl = document.getElementById('currentPlayerCard');
    
    // Находим все элементы с данным типом для данного игрока
    // playerId - это ID текущего игрока, чья карточка отображается другим игрокам
    // Ищем элементы ТОЛЬКО в карточках других игроков (НЕ в карточке текущего игрока)
    let allItems = document.querySelectorAll(`.player-info-item[data-item="${itemType}"][data-player-id="${playerId}"]`);
    
    console.log('🔍 Обновление blur для элементов:', allItems.length);
    console.log('  - playerId (ID текущего игрока):', playerId);
    console.log('  - itemType:', itemType);
    console.log('  - blurState:', blurState);
    console.log('  - isBlurred:', isBlurred);
    console.log('  - ищем элементы с data-player-id="' + playerId + '"');
    
    // ИСКЛЮЧАЕМ элементы из карточки текущего игрока
    if (currentPlayerCardEl) {
        allItems = Array.from(allItems).filter(item => {
            const isInCurrentPlayerCard = currentPlayerCardEl.contains(item);
            if (isInCurrentPlayerCard) {
                console.log('  - исключен элемент (из карточки текущего игрока):', item);
            }
            return !isInCurrentPlayerCard;
        });
        console.log('  - после исключения карточки текущего игрока: найдено элементов:', allItems.length);
    }
    
    // Если основной поиск не нашел элементы, используем альтернативный
    if (allItems.length === 0) {
        console.log('⚠ Элементы не найдены основным поиском, пробуем альтернативный...');
        // Альтернативный поиск: ищем все элементы с нужным itemType и playerId, ИСКЛЮЧАЯ кнопки
        let altItems = document.querySelectorAll(`.player-info-item[data-item="${itemType}"][data-player-id="${playerId}"]`);
        
        // Исключаем элементы из карточки текущего игрока
        if (currentPlayerCardEl) {
            altItems = Array.from(altItems).filter(item => !currentPlayerCardEl.contains(item));
        }
        
        allItems = altItems;
        console.log('  - альтернативный поиск (только .player-info-item): найдено элементов:', allItems.length);
        
        // Если и альтернативный не нашел, пробуем найти по типу и проверить playerId вручную
        if (allItems.length === 0) {
            const allItemsByType = document.querySelectorAll(`.player-info-item[data-item="${itemType}"]`);
            console.log('  - поиск по типу (только .player-info-item): найдено элементов:', allItemsByType.length);
            
            // Выводим все найденные элементы для отладки
            allItemsByType.forEach((item, idx) => {
                const itemPlayerId = item.getAttribute('data-player-id');
                const isInCurrentCard = currentPlayerCardEl && currentPlayerCardEl.contains(item);
                console.log(`  - элемент ${idx + 1}: data-player-id="${itemPlayerId}", ищем="${playerId}", в текущей карточке=${isInCurrentCard}`);
            });
            
            // Фильтруем по playerId вручную и исключаем кнопки и карточку текущего игрока
            allItems = Array.from(allItemsByType).filter(item => {
                // Исключаем кнопки
                if (item.classList.contains('blur-toggle-btn') || item.tagName === 'BUTTON') {
                    return false;
                }
                
                // Исключаем элементы из карточки текущего игрока
                if (currentPlayerCardEl && currentPlayerCardEl.contains(item)) {
                    return false;
                }
                
                const itemPlayerId = item.getAttribute('data-player-id');
                const matches = itemPlayerId === playerId;
                if (!matches) {
                    console.log(`  - элемент не подходит: playerId=${itemPlayerId}, ищем=${playerId}`);
                }
                return matches;
            });
            console.log('  - после фильтрации: найдено элементов:', allItems.length);
        }
    }
    
    // Дополнительная фильтрация: исключаем кнопки из результатов
    allItems = Array.from(allItems).filter(item => {
        const isButton = item.classList.contains('blur-toggle-btn') || 
                        item.tagName === 'BUTTON' || 
                        item.closest('.blur-toggle-btn');
        if (isButton) {
            console.log('  - исключен элемент (это кнопка):', item);
        }
        return !isButton;
    });
    
    console.log('  - после исключения кнопок: найдено элементов:', allItems.length);
    
    if (allItems.length === 0) {
        console.error('❌ Элементы не найдены! Не удалось обновить blur.');
        return;
    }
    
    // Обновляем все найденные элементы
    console.log(`📝 Начинаем обновление ${allItems.length} элементов...`);
    
    allItems.forEach((item, index) => {
        console.log(`  [${index + 1}/${allItems.length}] Обработка элемента:`, item);
        
        // Ищем span с текстом внутри элемента (не кнопку)
        // Ищем span с data-seed атрибутом (где хранятся данные)
        let textSpan = item.querySelector('span[data-seed]');
        
        // Если не нашли, пробуем найти span без класса blur-toggle-btn
        if (!textSpan) {
            textSpan = item.querySelector('span:not(.blur-toggle-btn)');
        }
        
        // Если не нашли, пробуем найти любой span
        if (!textSpan) {
            const allSpans = item.querySelectorAll('span');
            console.log(`    - найдено spans: ${allSpans.length}`);
            allSpans.forEach((span, spanIdx) => {
                if (!span.classList.contains('blur-toggle-btn') && 
                    !span.closest('.blur-toggle-btn')) {
                    if (!textSpan) {
                        textSpan = span;
                        console.log(`    - выбран span ${spanIdx + 1}`);
                    }
                }
            });
        }
        
        if (textSpan) {
            const beforeClasses = textSpan.className;
            const beforeFilter = window.getComputedStyle(textSpan).filter;
            console.log(`    - найден textSpan`);
            console.log(`    - до: классы="${beforeClasses}", filter="${beforeFilter}"`);
            
            if (isBlurred) {
                // Добавляем blur и заменяем реальные данные на placeholder
                textSpan.classList.add('blurred-text');
                textSpan.textContent = '***'; // Заменяем на placeholder для безопасности
                // Убираем inline стили, чтобы применился CSS класс
                textSpan.style.removeProperty('filter');
                console.log(`    ✓ Blur добавлен, данные заменены на placeholder`);
            } else {
                // Убираем blur (данные уже должны быть сгенерированы в generateAndDisplayData)
                textSpan.classList.remove('blurred-text');
                // Принудительно убираем blur через inline стиль
                textSpan.style.setProperty('filter', 'none', 'important');
                console.log(`    ✓ Blur убран`);
            }
            
            // Проверяем результат сразу
            requestAnimationFrame(() => {
                const afterClasses = textSpan.className;
                const afterFilter = window.getComputedStyle(textSpan).filter;
                console.log(`    - после: классы="${afterClasses}", filter="${afterFilter}"`);
                
                // Если blur не применился, пробуем еще раз
                if (isBlurred && afterFilter === 'none') {
                    console.log(`    ⚠ Blur не применился, пробуем еще раз...`);
                    textSpan.classList.add('blurred-text');
                    textSpan.style.removeProperty('filter');
                } else if (!isBlurred && afterFilter !== 'none' && afterFilter.includes('blur')) {
                    console.log(`    ⚠ Blur не убран, пробуем еще раз...`);
                    textSpan.classList.remove('blurred-text');
                    textSpan.style.setProperty('filter', 'none', 'important');
                }
            });
        } else {
            console.log(`    ⚠ textSpan не найден в элементе ${index + 1}`);
            console.log(`    - HTML элемента:`, item.innerHTML.substring(0, 200));
        }
    });
    
    // Дополнительное принудительное обновление через requestAnimationFrame
    requestAnimationFrame(() => {
        console.log(`🔄 Дополнительное обновление через requestAnimationFrame...`);
        allItems.forEach((item, index) => {
            const textSpan = item.querySelector('span:not(.blur-toggle-btn)');
            if (textSpan) {
                if (isBlurred) {
                    textSpan.classList.add('blurred-text');
                    textSpan.style.removeProperty('filter');
                } else {
                    textSpan.classList.remove('blurred-text');
                    textSpan.style.setProperty('filter', 'none', 'important');
                }
                console.log(`  ✓ Элемент ${index + 1} обновлен повторно`);
            }
        });
    });
}

// Подписка на realtime обновления blur
function subscribeToBlurUpdates() {
    if (!currentLobbyId) {
        console.log('Нет currentLobbyId, realtime обновления отключены');
        return;
    }
    
    // Отписываемся от предыдущей подписки
    unsubscribeFromBlurUpdates();
    
    // Подписываемся на обновления blur_states в лобби
    console.log('🔄 Подключение к realtime обновлениям blur...');
    
    blurRealtimeChannel = supabase
        .channel(`blur-updates-${currentLobbyId}`)
        .on('postgres_changes', 
            { 
                event: 'UPDATE',
                schema: 'public',
                table: 'lobbies',
                filter: `lobby_id=eq.${currentLobbyId}`
            },
            (payload) => {
                console.log('🔄 Realtime обновление лобби:', payload);
                
                // Обработка обновлений player_colors
                if (payload.new && payload.new.player_colors) {
                    const newPlayerColors = payload.new.player_colors;
                    console.log('📦 Получены player_colors через realtime:', newPlayerColors);
                    
                    // Обновляем распределение цветов
                    playerColorsMap = newPlayerColors;
                    
                    // Сохраняем в sessionStorage
                    const savedColorsKey = `playerColors_${currentLobbyId}`;
                    sessionStorage.setItem(savedColorsKey, JSON.stringify(playerColorsMap));
                    
                    // Перезагружаем информацию о игроках и голосование для обновления цветов
                    setTimeout(async () => {
                        await loadPlayersInfo();
                        await loadVoting();
                    }, 100);
                    
                    console.log('✅ Распределение цветов обновлено через realtime');
                }
                
                // Обработка обновлений votes (голосования)
                if (payload.new && payload.new.votes) {
                    const newVotes = payload.new.votes;
                    console.log('📦 Получены votes через realtime:', newVotes);
                    
                    // Обновляем голосование
                    setTimeout(async () => {
                        await loadVoting();
                    }, 100);
                    
                    console.log('✅ Голосование обновлено через realtime');
                }
                
                // Обработка обновлений blur_states
                if (!payload.new || !payload.new.blur_states) {
                    // Если нет blur_states, но есть player_colors или votes, уже обработали выше
                    if (!payload.new || (!payload.new.player_colors && !payload.new.blur_states && !payload.new.votes)) {
                        console.log('ℹ️ Обновление не связано с blur_states, player_colors или votes, пропускаем');
                    }
                    return;
                }
                
                const blurStates = payload.new.blur_states || {};
                console.log('📦 Получены blur_states через realtime:', blurStates);
                
                // Обновляем все карточки игроков
                Object.keys(blurStates).forEach(playerId => {
                    const playerBlurStates = blurStates[playerId] || {};
                    Object.keys(playerBlurStates).forEach(itemType => {
                        const blurState = playerBlurStates[itemType];
                        // Обновляем sessionStorage
                        const blurKey = `blur_${playerId}_${itemType}`;
                        sessionStorage.setItem(blurKey, blurState);
                        
                        console.log(`🔄 Realtime обновление blur: playerId=${playerId}, itemType=${itemType}, blurState=${blurState}`);
                        
                        // Если blur снят (blurState === '0'), генерируем и показываем данные
                        if (blurState === '0' || blurState === 0) {
                            console.log(`  ✓ Blur снят, генерируем данные для ${itemType} игрока ${playerId}`);
                            // Используем небольшую задержку, чтобы DOM успел обновиться
                            setTimeout(() => {
                                generateAndDisplayData(playerId, itemType);
                            }, 100);
                        } else {
                            // Если blur установлен, обновляем визуальное отображение
                            updateBlurDisplay(playerId, itemType, blurState);
                        }
                        
                        console.log(`✅ Обновлен blur для playerId=${playerId}, itemType=${itemType}, blurState=${blurState}`);
                    });
                });
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Подписка на realtime обновления blur активна');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Ошибка подписки на realtime обновления blur');
            } else {
                console.log('ℹ️ Статус подписки:', status);
            }
        });
}

// Отписка от обновлений blur
function unsubscribeFromBlurUpdates() {
    if (blurRealtimeChannel) {
        supabase.removeChannel(blurRealtimeChannel);
        blurRealtimeChannel = null;
    }
}

// Подписка на realtime обновления игроков
function subscribeToPlayersUpdates() {
    if (!currentLobbyId) {
        console.log('Нет currentLobbyId, realtime обновления игроков отключены');
        return;
    }
    
    // Отписываемся от предыдущей подписки
    unsubscribeFromPlayersUpdates();
    
    console.log('🔄 Подключение к realtime обновлениям игроков...');
    
    const lobbyIdNum = parseInt(currentLobbyId);
    
    playersRealtimeChannel = supabase
        .channel(`players-updates-${currentLobbyId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT',
                schema: 'public',
                table: 'users',
                filter: `lobby_id=eq.${lobbyIdNum}`
            },
            async (payload) => {
                const playerName = payload.new?.name || payload.new?.email || 'Неизвестный';
                const newPlayerId = payload.new?.id;
                console.log('✅ Игрок добавлен в лобби:', playerName);
                // Обновляем цвета для нового игрока
                if (newPlayerId) {
                    await updatePlayerColorsForNewPlayer(newPlayerId);
                }
                // Перезагружаем список игроков и голосование
                await loadPlayersInfo();
                await loadVoting();
                // Восстанавливаем данные для элементов, у которых blur уже снят
                setTimeout(() => {
                    restoreUnblurredData();
                }, 150);
            }
        )
        .on('postgres_changes', 
            { 
                event: 'UPDATE',
                schema: 'public',
                table: 'users'
            },
            async (payload) => {
                console.log('🔄 Realtime UPDATE users - полный payload:', payload);
                
                const oldLobbyId = payload.old?.lobby_id;
                const newLobbyId = payload.new?.lobby_id;
                const updatedUserId = payload.new?.id;
                
                // Функция для безопасного сравнения lobby_id (учитывает строки, числа, null, 0)
                const compareLobbyId = (val1, val2) => {
                    if (val1 === val2) return true;
                    if (val1 == null || val2 == null) return false;
                    return parseInt(val1) === parseInt(val2);
                };
                
                // Преобразуем в числа для сравнения
                const oldLobbyIdNum = oldLobbyId != null && oldLobbyId !== 0 ? parseInt(oldLobbyId) : (oldLobbyId === 0 ? 0 : null);
                const newLobbyIdNum = newLobbyId != null && newLobbyId !== 0 ? parseInt(newLobbyId) : (newLobbyId === 0 ? 0 : null);
                
                console.log('🔄 Realtime UPDATE users:', {
                    oldLobbyId,
                    newLobbyId,
                    oldLobbyIdNum,
                    newLobbyIdNum,
                    currentLobbyId: lobbyIdNum,
                    updatedUserId
                });
                
                // Если пользователь присоединился к нашему лобби
                if (!compareLobbyId(oldLobbyId, lobbyIdNum) && compareLobbyId(newLobbyId, lobbyIdNum)) {
                    const playerName = payload.new?.name || payload.new?.email || 'Неизвестный';
                    const newPlayerId = payload.new?.id;
                    console.log('✅ Игрок присоединился к лобби:', playerName);
                    // Обновляем цвета для нового игрока
                    if (newPlayerId) {
                        await updatePlayerColorsForNewPlayer(newPlayerId);
                    }
                    await loadPlayersInfo();
                    await loadVoting();
                    // Восстанавливаем данные для элементов, у которых blur уже снят
                    restoreUnblurredData();
                    return;
                }
                
                // Если новый lobby_id не равен текущему (0, null, undefined или другой номер)
                // Это означает, что пользователь либо вышел из лобби, либо перешел в другое
                // Проверяем, был ли этот пользователь в нашем лобби
                const isNotInOurLobby = !compareLobbyId(newLobbyId, lobbyIdNum) || 
                                        newLobbyId === 0 || 
                                        newLobbyId === null || 
                                        newLobbyId === undefined;
                
                // Если новый lobby_id не равен текущему - обновляем список
                // loadPlayersInfo() и loadVoting() загружают только игроков с текущим lobby_id,
                // поэтому игрок с newLobbyId !== lobbyIdNum автоматически исчезнет из списка
                // НЕ проверяем oldLobbyId, так как он может быть undefined
                if (isNotInOurLobby) {
                    const playerName = payload.old?.name || payload.new?.name || payload.old?.email || payload.new?.email || 'Неизвестный';
                    console.log('👋 Игрок покинул/покидает лобби - ОБНОВЛЯЕМ!', playerName, {
                        oldLobbyId,
                        newLobbyId,
                        lobbyIdNum,
                        updatedUserId
                    });
                    
                    try {
                        await loadPlayersInfo();
                        await loadVoting();
                        // Восстанавливаем данные для элементов, у которых blur уже снят
                        restoreUnblurredData();
                        console.log('✅ Список игроков и голосование обновлены');
                    } catch (error) {
                        console.error('❌ Ошибка при обновлении:', error);
                    }
                }
            }
        )
        .on('postgres_changes', 
            { 
                event: 'DELETE',
                schema: 'public',
                table: 'users'
            },
            async (payload) => {
                const deletedLobbyId = payload.old?.lobby_id;
                
                // Если удаленный пользователь был в нашем лобби
                if (deletedLobbyId === lobbyIdNum) {
                    const playerName = payload.old?.name || payload.old?.email || 'Неизвестный';
                    console.log('👋 Игрок удален из лобби:', playerName);
                    // Перезагружаем список игроков и голосование
                    await loadPlayersInfo();
                    await loadVoting();
                    // Восстанавливаем данные для элементов, у которых blur уже снят
                    restoreUnblurredData();
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Подписка на realtime обновления игроков активна для лобби:', lobbyIdNum);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Ошибка подписки на realtime обновления игроков');
            } else {
                console.log('ℹ️ Статус подписки на игроков:', status);
            }
        });
}

// Отписка от обновлений игроков
function unsubscribeFromPlayersUpdates() {
    if (playersRealtimeChannel) {
        supabase.removeChannel(playersRealtimeChannel);
        playersRealtimeChannel = null;
    }
}

// Настройка переворота карточек
function setupFlipCards() {
    // Используем делегирование событий для всех карточек
    document.addEventListener('click', (e) => {
        // Пропускаем клики на кнопки переключения blur
        if (e.target.closest('.blur-toggle-btn')) {
            return;
        }
        
        // Пропускаем клики на кнопки обновления
        if (e.target.closest('.refresh-btn')) {
            return;
        }
        
        const flipCard = e.target.closest('.flip-card');
        if (flipCard) {
            const flipCardInner = flipCard.querySelector('.flip-card-inner');
            if (flipCardInner) {
                flipCardInner.classList.toggle('flipped');
            }
        }
    });
}

// Выход из лобби
async function exitFromLobby() {
    try {
        if (!currentUserId) {
            window.location.href = 'index.html';
            return;
        }
        
        // Отключаем кнопку выхода
        const exitBtn = document.getElementById('exitLobbyBtn');
        if (exitBtn) {
            exitBtn.disabled = true;
            exitBtn.textContent = 'Выход...';
        }
        
        // Сбрасываем lobby_id в БД (устанавливаем в 0)
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                lobby_id: 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);
        
        if (updateError) {
            console.error('Ошибка выхода из лобби:', updateError);
        } else {
            console.log('✅ lobby_id успешно установлен в 0 для пользователя:', currentUserId);
        }
        
        // Небольшая задержка, чтобы событие успело отправиться через realtime
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Увеличиваем счетчик выходов для сброса параметра "Пол и возраст"
        const currentExitCount = parseInt(sessionStorage.getItem(`exitCount_${currentUserId}`) || '0');
        sessionStorage.setItem(`exitCount_${currentUserId}`, (currentExitCount + 1).toString());
        console.log('🔄 Счетчик выходов увеличен, параметр "Пол и возраст" будет сброшен при следующем входе');
        
        // Отписываемся от realtime обновлений
        unsubscribeFromBlurUpdates();
        unsubscribeFromPlayersUpdates();
        
        // Удаляем информацию о лобби из sessionStorage
        sessionStorage.removeItem('currentLobbyId');
        
        // Возвращаемся на главную страницу
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Ошибка выхода из лобби:', err);
        // В случае ошибки всё равно возвращаемся на главную
        window.location.href = 'index.html';
    }
}

// Отписка от всех realtime обновлений при закрытии страницы
window.addEventListener('beforeunload', () => {
    unsubscribeFromBlurUpdates();
    unsubscribeFromPlayersUpdates();
});

