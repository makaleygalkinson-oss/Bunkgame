-- Схема базы данных для игры "Бункер"

-- Таблица игр
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
  mode TEXT NOT NULL CHECK (mode IN ('basic', 'extended')),
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 5,
  current_phase TEXT NOT NULL CHECK (current_phase IN ('bunker-reveal', 'presentation', 'voting', 'results')),
  active_player_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  timer INTEGER
);

-- Таблица игроков
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'excluded', 'spectator')),
  cards JSONB DEFAULT '[]'::jsonb,
  votes JSONB DEFAULT '[]'::jsonb,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE
);

-- Таблица карт (библиотека карт)
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('profession', 'biology', 'health', 'hobby', 'baggage', 'fact', 'bunker')),
  text TEXT NOT NULL,
  image TEXT
);

-- Таблица состояний игры (для восстановления)
CREATE TABLE IF NOT EXISTS game_states (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_states_game_id ON game_states(game_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- RLS (Row Level Security) политики (опционально)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все могут читать)
CREATE POLICY "Games are viewable by everyone" ON games
  FOR SELECT USING (true);

CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

-- Политики для записи (только через сервисный ключ)
-- В продакшене используйте более строгие политики

-- Вставка базовых карт (seed data)
INSERT INTO cards (id, type, text) VALUES
  ('prof-1', 'profession', 'Врач'),
  ('prof-2', 'profession', 'Строитель'),
  ('prof-3', 'profession', 'Учёный'),
  ('prof-4', 'profession', 'Военный'),
  ('prof-5', 'profession', 'Инженер'),
  ('prof-6', 'profession', 'Повар'),
  ('prof-7', 'profession', 'Учитель'),
  ('prof-8', 'profession', 'Фермер'),
  ('prof-9', 'profession', 'Программист'),
  ('prof-10', 'profession', 'Психолог'),
  ('bio-1', 'biology', '25 лет, мужчина, среднее телосложение'),
  ('bio-2', 'biology', '30 лет, женщина, худощавая'),
  ('bio-3', 'biology', '45 лет, мужчина, полный'),
  ('bio-4', 'biology', '22 года, женщина, спортивная'),
  ('bio-5', 'biology', '35 лет, мужчина, высокий'),
  ('bio-6', 'biology', '28 лет, женщина, среднее телосложение'),
  ('health-1', 'health', 'Здоров'),
  ('health-2', 'health', 'Болен хроническим заболеванием'),
  ('health-3', 'health', 'Инвалид (нет ноги)'),
  ('health-4', 'health', 'Имеет фобию (боязнь темноты)'),
  ('health-5', 'health', 'Здоров, но аллергия на пыль'),
  ('health-6', 'health', 'Здоров, но близорукость'),
  ('hobby-1', 'hobby', 'Музыка'),
  ('hobby-2', 'hobby', 'Спорт'),
  ('hobby-3', 'hobby', 'Искусство'),
  ('hobby-4', 'hobby', 'Технологии'),
  ('hobby-5', 'hobby', 'Чтение'),
  ('hobby-6', 'hobby', 'Садоводство'),
  ('bag-1', 'baggage', 'Аптечка'),
  ('bag-2', 'baggage', 'Инструменты'),
  ('bag-3', 'baggage', 'Книги'),
  ('bag-4', 'baggage', 'Еда на неделю'),
  ('bag-5', 'baggage', 'Оружие'),
  ('bag-6', 'baggage', 'Семена растений'),
  ('fact-1', 'fact', 'У меня есть ребёнок'),
  ('fact-2', 'fact', 'Я знаю секрет выживания'),
  ('fact-3', 'fact', 'Я бывший военный'),
  ('fact-4', 'fact', 'Я умею готовить'),
  ('fact-5', 'fact', 'Я знаю медицину'),
  ('fact-6', 'fact', 'У меня есть связи'),
  ('bunk-1', 'bunker', 'Нужно минимум 2 врача'),
  ('bunk-2', 'bunker', 'Нужны люди молодого возраста'),
  ('bunk-3', 'bunker', 'Нужен инженер'),
  ('bunk-4', 'bunker', 'Нужны люди без хронических заболеваний'),
  ('bunk-5', 'bunker', 'Нужны люди с навыками выживания'),
  ('bunk-6', 'bunker', 'Нужны люди с инструментами')
ON CONFLICT (id) DO NOTHING;

