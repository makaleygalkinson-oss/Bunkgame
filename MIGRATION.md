# Инструкция по миграции

## Шаги для перехода на Next.js

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL скрипт из `supabase/schema.sql` в SQL Editor
3. Скопируйте URL и ключи в `.env.local`

### 4. Запуск проекта

```bash
npm run dev
```

### 5. Что было мигрировано

- ✅ HTML структура → React компоненты
- ✅ CSS стили → TailwindCSS + globals.css
- ✅ JavaScript логика → TypeScript + React hooks
- ✅ Модальные окна → React компоненты
- ✅ Навигация → Next.js routing

### 6. Старые файлы

Старые файлы (`index.html`, `styles.css`, `script.js`) можно удалить после проверки работы нового приложения.

### 7. Деплой

Для деплоя на Vercel:

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения в настройках проекта
3. Деплой запустится автоматически

## Структура нового проекта

```
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── game/               # Страницы игры
│   ├── globals.css         # Глобальные стили
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Главная страница
├── components/             # React компоненты
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── CreateLobbyModal.tsx
│   ├── JoinLobbyModal.tsx
│   ├── GameBoard.tsx
│   ├── CardDisplay.tsx
│   ├── VotingPanel.tsx
│   ├── PlayerList.tsx
│   └── Timer.tsx
├── lib/                    # Утилиты
│   ├── db.ts              # Работа с БД
│   ├── types.ts           # TypeScript типы
│   └── utils.ts           # Вспомогательные функции
└── supabase/              # SQL скрипты
    └── schema.sql
```

## Отличия от старой версии

1. **TypeScript** - полная типизация
2. **Next.js App Router** - современный роутинг
3. **TailwindCSS** - utility-first CSS
4. **Supabase** - база данных вместо localStorage
5. **API Routes** - серверная логика
6. **Компонентная архитектура** - переиспользуемые компоненты

## Следующие шаги

1. Настройте WebSocket для реалтайм синхронизации
2. Добавьте аутентификацию пользователей
3. Реализуйте историю игр
4. Добавьте статистику игроков


