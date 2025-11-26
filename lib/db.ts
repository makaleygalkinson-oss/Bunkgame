import { createClient } from '@supabase/supabase-js';
import { Game, Player, GameState } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Таблицы в Supabase
export const TABLES = {
  GAMES: 'games',
  PLAYERS: 'players',
  CARDS: 'cards',
  GAME_STATES: 'game_states',
} as const;

// Функции для работы с играми
export async function createGame(game: Game): Promise<Game> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.GAMES)
    .insert({
      id: game.id,
      status: game.status,
      mode: game.mode,
      current_round: game.currentRound,
      max_rounds: game.maxRounds,
      current_phase: game.currentPhase,
      active_player_id: game.activePlayerId,
      created_at: game.createdAt.toISOString(),
      started_at: game.startedAt?.toISOString(),
      finished_at: game.finishedAt?.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapGameFromDb(data);
}

export async function getGame(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from(TABLES.GAMES)
    .select('*')
    .eq('id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const game = mapGameFromDb(data);
  
  // Загружаем игроков
  const players = await getPlayers(gameId);
  game.players = players;

  return game;
}

export async function updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
  const updateData: any = {};
  
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.currentRound !== undefined) updateData.current_round = updates.currentRound;
  if (updates.currentPhase !== undefined) updateData.current_phase = updates.currentPhase;
  if (updates.activePlayerId !== undefined) updateData.active_player_id = updates.activePlayerId;
  if (updates.startedAt !== undefined) updateData.started_at = updates.startedAt.toISOString();
  if (updates.finishedAt !== undefined) updateData.finished_at = updates.finishedAt.toISOString();

  const { data, error } = await supabaseAdmin
    .from(TABLES.GAMES)
    .update(updateData)
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return mapGameFromDb(data);
}

// Функции для работы с игроками
export async function addPlayer(player: Player): Promise<Player> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.PLAYERS)
    .insert({
      id: player.id,
      game_id: player.gameId,
      name: player.name,
      status: player.status,
      cards: JSON.stringify(player.cards),
      votes: JSON.stringify(player.votes),
      joined_at: player.joinedAt.toISOString(),
      is_active: player.isActive || false,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPlayerFromDb(data);
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .select('*')
    .eq('game_id', gameId);

  if (error) throw error;
  return data.map(mapPlayerFromDb);
}

export async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
  const updateData: any = {};
  
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.cards !== undefined) updateData.cards = JSON.stringify(updates.cards);
  if (updates.votes !== undefined) updateData.votes = JSON.stringify(updates.votes);
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabaseAdmin
    .from(TABLES.PLAYERS)
    .update(updateData)
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return mapPlayerFromDb(data);
}

// Сохранение состояния игры
export async function saveGameState(gameState: GameState): Promise<void> {
  const { error } = await supabaseAdmin
    .from(TABLES.GAME_STATES)
    .insert({
      game_id: gameState.game.id,
      snapshot: JSON.stringify(gameState.game),
      timestamp: gameState.timestamp.toISOString(),
    });

  if (error) throw error;
}

// Вспомогательные функции для маппинга
function mapGameFromDb(data: any): Game {
  return {
    id: data.id,
    status: data.status,
    mode: data.mode,
    currentRound: data.current_round,
    maxRounds: data.max_rounds,
    currentPhase: data.current_phase,
    activePlayerId: data.active_player_id,
    players: [],
    bunkerCards: [],
    revealedBunkerCards: [],
    timer: data.timer,
    createdAt: new Date(data.created_at),
    startedAt: data.started_at ? new Date(data.started_at) : undefined,
    finishedAt: data.finished_at ? new Date(data.finished_at) : undefined,
  };
}

function mapPlayerFromDb(data: any): Player {
  return {
    id: data.id,
    gameId: data.game_id,
    name: data.name,
    status: data.status,
    cards: JSON.parse(data.cards || '[]'),
    votes: JSON.parse(data.votes || '[]'),
    joinedAt: new Date(data.joined_at),
    isActive: data.is_active || false,
  };
}

