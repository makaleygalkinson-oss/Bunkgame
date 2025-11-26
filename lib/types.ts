// Типы для игры "Бункер"

export type GameMode = 'basic' | 'extended';
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Phase = 'bunker-reveal' | 'presentation' | 'voting' | 'results';
export type PlayerStatus = 'active' | 'excluded' | 'spectator';
export type CardType = 'profession' | 'biology' | 'health' | 'hobby' | 'baggage' | 'fact' | 'bunker';

export interface Card {
  id: string;
  type: CardType;
  text: string;
  image?: string;
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  status: PlayerStatus;
  cards: Card[];
  votes: string[]; // IDs игроков, за которых голосовал
  joinedAt: Date;
  isActive?: boolean; // Активный игрок в текущем раунде
}

export interface Game {
  id: string;
  status: GameStatus;
  mode: GameMode;
  currentRound: number;
  maxRounds: number;
  currentPhase: Phase;
  activePlayerId?: string;
  players: Player[];
  bunkerCards: Card[];
  revealedBunkerCards: Card[];
  timer?: number; // Оставшееся время в секундах
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface GameState {
  game: Game;
  timestamp: Date;
}

export interface CreateGameRequest {
  playerName: string;
  roomName: string;
  mode: GameMode;
  activeRoles?: string[];
}

export interface JoinGameRequest {
  playerName: string;
  gameId: string;
}

export interface VoteRequest {
  playerId: string;
  targetPlayerId: string;
}

export interface RevealCardRequest {
  playerId: string;
  cardType: CardType;
  cardIndex?: number;
}

