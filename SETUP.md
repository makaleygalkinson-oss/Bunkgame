# 🚀 Быстрая настройка

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка Supabase

1. Создайте проект на [Supabase](https://app.supabase.com)
2. Скопируйте `SUPABASE_URL` и `SUPABASE_ANON_KEY` из Settings > API
3. Создайте файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Шаг 3: Создание таблицы profiles

В Supabase Dashboard перейдите в **SQL Editor** и выполните:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Шаг 4: Настройка OAuth (опционально)

### Google OAuth:
1. Authentication > Providers > Google
2. Включите провайдер
3. Добавьте Client ID и Secret из [Google Cloud Console](https://console.cloud.google.com)
4. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### VK OAuth (если доступен):
1. Authentication > Providers > VK
2. Включите и настройте согласно документации

## Шаг 5: Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## ✅ Готово!

Теперь вы можете:
- Регистрироваться по email
- Входить через email, Google или анонимно
- Автоматически создаются профили в БД
- Защищённые маршруты работают автоматически

