import { v4 as uuidv4 } from 'uuid';
import { Card, CardType, Game, Player } from './types';

// Генерация ID комнаты
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

// Генерация UUID
export function generateId(): string {
  return uuidv4();
}

// Базовая библиотека карт (можно расширить)
export const CARD_LIBRARY: Record<CardType, string[]> = {
  profession: [
    'Врач',
    'Строитель',
    'Учёный',
    'Военный',
    'Инженер',
    'Повар',
    'Учитель',
    'Фермер',
    'Программист',
    'Психолог',
  ],
  biology: [
    '25 лет, мужчина, среднее телосложение',
    '30 лет, женщина, худощавая',
    '45 лет, мужчина, полный',
    '22 года, женщина, спортивная',
    '35 лет, мужчина, высокий',
    '28 лет, женщина, среднее телосложение',
  ],
  health: [
    'Здоров',
    'Болен хроническим заболеванием',
    'Инвалид (нет ноги)',
    'Имеет фобию (боязнь темноты)',
    'Здоров, но аллергия на пыль',
    'Здоров, но близорукость',
  ],
  hobby: [
    'Музыка',
    'Спорт',
    'Искусство',
    'Технологии',
    'Чтение',
    'Садоводство',
  ],
  baggage: [
    'Аптечка',
    'Инструменты',
    'Книги',
    'Еда на неделю',
    'Оружие',
    'Семена растений',
  ],
  fact: [
    'У меня есть ребёнок',
    'Я знаю секрет выживания',
    'Я бывший военный',
    'Я умею готовить',
    'Я знаю медицину',
    'У меня есть связи',
  ],
  bunker: [
    'Нужно минимум 2 врача',
    'Нужны люди молодого возраста',
    'Нужен инженер',
    'Нужны люди без хронических заболеваний',
    'Нужны люди с навыками выживания',
    'Нужны люди с инструментами',
  ],
};

// Создание карты
export function createCard(type: CardType, text: string): Card {
  return {
    id: generateId(),
    type,
    text,
  };
}

// Раздача карт игрокам
export function dealCards(players: Player[]): Player[] {
  const cardTypes: CardType[] = ['profession', 'biology', 'health', 'hobby', 'baggage', 'fact'];
  
  return players.map(player => {
    const cards: Card[] = cardTypes.map(type => {
      const availableCards = CARD_LIBRARY[type];
      const randomText = availableCards[Math.floor(Math.random() * availableCards.length)];
      return createCard(type, randomText);
    });
    
    return {
      ...player,
      cards,
    };
  });
}

// Подсчёт голосов
export function countVotes(players: Player[]): Record<string, number> {
  const votes: Record<string, number> = {};
  
  players.forEach(player => {
    player.votes.forEach(votedPlayerId => {
      votes[votedPlayerId] = (votes[votedPlayerId] || 0) + 1;
    });
  });
  
  return votes;
}

// Определение исключённого игрока
export function getExcludedPlayer(votes: Record<string, number>): string | null {
  const maxVotes = Math.max(...Object.values(votes));
  const candidates = Object.entries(votes)
    .filter(([_, count]) => count === maxVotes)
    .map(([playerId]) => playerId);
  
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  
  // Если несколько игроков с одинаковым количеством голосов - случайный выбор
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Проверка условий победы
export function checkWinConditions(game: Game): boolean {
  if (game.currentRound < game.maxRounds) return false;
  
  const activePlayers = game.players.filter(p => p.status === 'active');
  const bunkerCapacity = game.mode === 'basic' 
    ? Math.max(4, Math.floor(game.players.length * 0.6))
    : Math.max(6, Math.floor(game.players.length * 0.7));
  
  return activePlayers.length <= bunkerCapacity;
}

// Создание колоды карт бункера
export function createBunkerDeck(): Card[] {
  return CARD_LIBRARY.bunker.map(text => createCard('bunker', text));
}

