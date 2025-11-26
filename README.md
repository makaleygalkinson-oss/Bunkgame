# Бункер - Онлайн игра

Веб-приложение для игры "Бункер" на Next.js 14+ с TypeScript и TailwindCSS.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Настройка переменных окружения

**Для локальной разработки:** Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Для деплоя на Vercel:** Добавьте те же переменные в настройках проекта Vercel:
- Settings → Environment Variables
- Добавьте все переменные для Production, Preview и Development
- После добавления передеплойте проект

📖 **Подробная инструкция:** См. [SETUP.md](./SETUP.md)

### Настройка базы данных Supabase

Выполните SQL скрипт из файла `supabase/schema.sql` в Supabase SQL Editor:

```sql
-- Таблица игр
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  mode TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 5,
  current_phase TEXT NOT NULL,
  active_player_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- Таблица игроков
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  cards JSONB DEFAULT '[]',
  votes JSONB DEFAULT '[]',
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE
);

-- Таблица карт (библиотека)
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  image TEXT
);

-- Таблица состояний игры (для восстановления)
CREATE TABLE game_states (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  snapshot JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
├── app/
│   ├── api/              # API routes
│   ├── game/             # Страницы игры
│   ├── globals.css       # Глобальные стили
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Главная страница
├── components/           # React компоненты
├── lib/                  # Утилиты и типы
│   ├── db.ts            # Работа с БД
│   ├── types.ts         # TypeScript типы
│   └── utils.ts         # Вспомогательные функции
└── public/              # Статические файлы
```

## 🎮 Функциональность

### MVP (Phase 1)
- ✅ Создание и присоединение к лобби
- ✅ Базовая механика игры (5 раундов)
- ✅ Голосование и исключение игроков
- ✅ Таймер для защиты
- ✅ Отображение карт игроков

### Phase 2 (В разработке)
- ⏳ WebSocket для реалтайм синхронизации
- ⏳ История игр
- ⏳ Расширенный режим
- ⏳ Статистика игроков

### Phase 3 (Планируется)
- ⏳ Кастомизация карт
- ⏳ Чат в игровой комнате
- ⏳ Сценарии
- ⏳ Mobile app версия

## 🛠 Технологии

- **Next.js 14+** - React фреймворк
- **TypeScript** - Типизация
- **TailwindCSS** - Стилизация
- **Supabase** - База данных
- **Socket.IO** - WebSocket (планируется)

## 📝 API Endpoints

- `POST /api/game/create` - Создание игры
- `GET /api/game/[gameId]` - Получение игры
- `POST /api/game/[gameId]/join` - Присоединение к игре
- `POST /api/game/[gameId]/start` - Запуск игры
- `POST /api/game/[gameId]/vote` - Голосование

## 🚀 Деплой на Vercel

Проект готов к деплою на Vercel. После подключения репозитория:

1. **Настройте переменные окружения:**
   - Settings → Environment Variables
   - Добавьте:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_URL` (URL вашего Vercel проекта)
   - Выберите все окружения: Production, Preview, Development

2. **Выполните SQL скрипт в Supabase:**
   - Скопируйте содержимое `supabase/schema.sql`
   - Вставьте в Supabase SQL Editor и выполните

3. **Передеплойте проект:**
   - После настройки переменных нажмите "Redeploy" в последнем деплое
   - Или сделайте новый коммит - Vercel автоматически задеплоит

📖 **Детальная инструкция:** См. [SETUP.md](./SETUP.md) раздел "Деплой на Vercel"

## 📄 Лицензия

MIT

