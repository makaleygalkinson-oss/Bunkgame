// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger icon
        const spans = menuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        if (spans.length > 0) {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Modal functionality
const createLobbyModal = document.getElementById('createLobbyModal');
const joinLobbyModal = document.getElementById('joinLobbyModal');
const createLobbyForm = document.getElementById('createLobbyForm');
const joinLobbyForm = document.getElementById('joinLobbyForm');
const roomIdDisplay = document.getElementById('roomIdDisplay');

// Генерация ID комнаты
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';
    for (let i = 0; i < 6; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
}

// Открытие модального окна создания лобби
function openCreateLobbyModal() {
    const roomId = generateRoomId();
    roomIdDisplay.textContent = roomId;
    createLobbyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие модального окна создания лобби
function closeCreateLobbyModal() {
    createLobbyModal.classList.remove('active');
    document.body.style.overflow = '';
    createLobbyForm.reset();
    roomIdDisplay.textContent = 'Генерируется...';
}

// Открытие модального окна присоединения к лобби
function openJoinLobbyModal() {
    joinLobbyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие модального окна присоединения к лобби
function closeJoinLobbyModal() {
    joinLobbyModal.classList.remove('active');
    document.body.style.overflow = '';
    joinLobbyForm.reset();
}

// Универсальная функция закрытия любого модального окна
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (modal === createLobbyModal) {
        createLobbyForm.reset();
        roomIdDisplay.textContent = 'Генерируется...';
    } else if (modal === joinLobbyModal) {
        joinLobbyForm.reset();
    }
}

// Обработка отправки формы создания лобби
createLobbyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        playerNick: document.getElementById('playerNick').value,
        roomName: document.getElementById('roomName').value,
        activeRoles: document.getElementById('activeRoles').value,
        roomId: roomIdDisplay.textContent
    };
    
    console.log('Данные создания лобби:', formData);
    
    // Здесь будет логика отправки данных на сервер
    // Пока просто показываем сообщение
    alert(`Лобби "${formData.roomName}" создано!\nID комнаты: ${formData.roomId}\nВаш ник: ${formData.playerNick}\nРоли: ${formData.activeRoles}`);
    
    closeCreateLobbyModal();
});

// Обработка отправки формы присоединения к лобби
joinLobbyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        playerNick: document.getElementById('joinPlayerNick').value,
        roomId: document.getElementById('joinRoomId').value.toUpperCase()
    };
    
    console.log('Данные присоединения к лобби:', formData);
    
    // Здесь будет логика отправки данных на сервер
    // Пока просто показываем сообщение
    alert(`Попытка присоединения к лобби!\nID комнаты: ${formData.roomId}\nВаш ник: ${formData.playerNick}`);
    
    closeJoinLobbyModal();
});

// Обработка закрытия модальных окон
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal');
        closeModal(modal);
    });
});

document.querySelectorAll('.btn-cancel').forEach(cancelBtn => {
    cancelBtn.addEventListener('click', () => {
        const modal = cancelBtn.closest('.modal');
        closeModal(modal);
    });
});

// Закрытие модального окна при клике вне его области
[createLobbyModal, joinLobbyModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Закрытие модального окна по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (createLobbyModal.classList.contains('active')) {
            closeCreateLobbyModal();
        } else if (joinLobbyModal.classList.contains('active')) {
            closeJoinLobbyModal();
        }
    }
});

// Автоматическое преобразование ID в верхний регистр
const joinRoomIdInput = document.getElementById('joinRoomId');
if (joinRoomIdInput) {
    joinRoomIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
}

// Button actions
const createLobbyBtn = document.getElementById('createLobbyBtn');
const joinLobbyBtn = document.getElementById('joinLobbyBtn');
const headerCreateBtn = document.querySelector('.btn-buy');

// Обработчик кнопки создания лобби в центре экрана
if (createLobbyBtn) {
    createLobbyBtn.addEventListener('click', () => {
        openCreateLobbyModal();
    });
}

// Обработчик кнопки присоединения к лобби
if (joinLobbyBtn) {
    joinLobbyBtn.addEventListener('click', () => {
        openJoinLobbyModal();
    });
}

// Обработчик кнопки создания лобби в шапке
if (headerCreateBtn) {
    headerCreateBtn.addEventListener('click', () => {
        openCreateLobbyModal();
    });
}

// News items hover effects
const newsItems = document.querySelectorAll('.news-item');
newsItems.forEach(item => {
    item.addEventListener('click', () => {
        const newsText = item.querySelector('.news-text').textContent;
        alert(`Открытие новости: ${newsText}`);
    });
});

// Add glitch effect on scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const glitchOverlay = document.querySelector('.glitch-overlay');
    
    if (glitchOverlay && Math.abs(currentScroll - lastScroll) > 50) {
        glitchOverlay.style.animation = 'none';
        setTimeout(() => {
            glitchOverlay.style.animation = 'glitch 0.5s';
        }, 10);
        lastScroll = currentScroll;
    }
});

// Dynamic neon effects
const neonLines = document.querySelectorAll('.line');
setInterval(() => {
    neonLines.forEach((line, index) => {
        const colors = ['#FF00FF', '#00FFFF', '#FF0040', '#FFD700'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        line.style.background = `linear-gradient(90deg, 
            transparent,
            ${randomColor},
            ${randomColor},
            transparent
        )`;
        line.style.boxShadow = `0 0 10px ${randomColor}`;
    });
}, 3000);

// Header background on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.98)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'var(--cyber-black)';
        header.style.backdropFilter = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe news items
document.querySelectorAll('.news-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});


