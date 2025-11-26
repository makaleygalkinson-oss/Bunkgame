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

// Button actions
const buyButtons = document.querySelectorAll('.btn-buy, .btn-yellow');
buyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.textContent.includes('Создать Лобби')) {
            alert('Функция создания лобби будет реализована позже');
        } else if (btn.textContent.includes('Присоединиться к лобби')) {
            alert('Функция присоединения к лобби будет реализована позже');
        }
    });
});

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


