import { create } from 'zustand'
import { Room, Player, Game, PlayerCard } from './supabase'

interface GameState {
  // Текущая комната
  currentRoom: Room | null
  // Текущий игрок
  currentPlayer: Player | null
  // Все игроки в комнате
  players: Player[]
  // Текущая игра
  currentGame: Game | null
  // Карта текущего игрока
  playerCard: PlayerCard | null
  // Полная информация о карте
  cardData: any | null
  // Установка состояния
  setCurrentRoom: (room: Room | null) => void
  setCurrentPlayer: (player: Player | null) => void
  setPlayers: (players: Player[]) => void
  setCurrentGame: (game: Game | null) => void
  setPlayerCard: (card: PlayerCard | null) => void
  setCardData: (data: any | null) => void
  // Сброс состояния
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  currentRoom: null,
  currentPlayer: null,
  players: [],
  currentGame: null,
  playerCard: null,
  cardData: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setPlayers: (players) => set({ players }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setPlayerCard: (card) => set({ playerCard: card }),
  setCardData: (data) => set({ cardData: data }),
  reset: () => set({
    currentRoom: null,
    currentPlayer: null,
    players: [],
    currentGame: null,
    playerCard: null,
    cardData: null,
  }),
}))

