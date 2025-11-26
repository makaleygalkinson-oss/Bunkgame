import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Типы для базы данных
export interface Room {
  id: string
  room_code: string
  host_id: string
  max_players: number
  current_players: number
  status: 'waiting' | 'playing' | 'finished'
  settings: {
    round_time?: number
    rules?: string
  }
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  username: string
  is_host: boolean
  is_alive: boolean
  position: number
  created_at: string
}

export interface Game {
  id: string
  room_id: string
  round_number: number
  current_phase: 'discussion' | 'voting' | 'results'
  started_at: string
  finished_at?: string
}

export interface Card {
  id: string
  profession: string
  age: number
  gender: string
  health: string
  hobby: string
  baggage: string
  phobia: string
  fact: string
}

export interface PlayerCard {
  id: string
  game_id: string
  player_id: string
  card_id: string
  revealed: {
    profession?: boolean
    age?: boolean
    gender?: boolean
    health?: boolean
    hobby?: boolean
    baggage?: boolean
    phobia?: boolean
    fact?: boolean
  }
}

export interface Vote {
  id: string
  game_id: string
  round_number: number
  voter_id: string
  target_id: string
  timestamp: string
}

