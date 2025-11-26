import { NextRequest, NextResponse } from 'next/server'
import { generateId, generateRoomId, createBunkerDeck, dealCards } from '@/lib/utils'
import { createGame, addPlayer } from '@/lib/db'
import { Game, Player, CreateGameRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateGameRequest = await request.json()
    const { playerName, roomName, mode, activeRoles } = body

    if (!playerName || !roomName) {
      return NextResponse.json(
        { error: 'Имя игрока и название комнаты обязательны' },
        { status: 400 }
      )
    }

    // Генерируем ID игры
    const gameId = generateRoomId()
    const playerId = generateId()

    // Создаём игру
    const game: Game = {
      id: gameId,
      status: 'waiting',
      mode: mode || 'basic',
      currentRound: 0,
      maxRounds: 5,
      currentPhase: 'bunker-reveal',
      players: [],
      bunkerCards: createBunkerDeck(),
      revealedBunkerCards: [],
      createdAt: new Date(),
    }

    // Создаём игрока-хозяина
    const hostPlayer: Player = {
      id: playerId,
      gameId: gameId,
      name: playerName,
      status: 'active',
      cards: [],
      votes: [],
      joinedAt: new Date(),
      isActive: true,
    }

    // Сохраняем в БД
    await createGame(game)
    await addPlayer(hostPlayer)

    return NextResponse.json({
      gameId: gameId,
      playerId: playerId,
      message: 'Лобби создано успешно',
    })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании игры' },
      { status: 500 }
    )
  }
}

