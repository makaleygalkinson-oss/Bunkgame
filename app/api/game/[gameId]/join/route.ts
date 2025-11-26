import { NextRequest, NextResponse } from 'next/server'
import { getGame, addPlayer, getPlayers } from '@/lib/db'
import { generateId } from '@/lib/utils'
import { Player, JoinGameRequest } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const body: JoinGameRequest = await request.json()
    const { playerName } = body

    if (!playerName) {
      return NextResponse.json(
        { error: 'Имя игрока обязательно' },
        { status: 400 }
      )
    }

    const game = await getGame(params.gameId)

    if (!game) {
      return NextResponse.json(
        { error: 'Игра не найдена' },
        { status: 404 }
      )
    }

    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Игра уже началась' },
        { status: 400 }
      )
    }

    // Проверяем, не превышен ли лимит игроков
    const players = await getPlayers(params.gameId)
    if (players.length >= 10) {
      return NextResponse.json(
        { error: 'Лобби переполнено' },
        { status: 400 }
      )
    }

    // Проверяем, не занято ли имя
    if (players.some(p => p.name === playerName)) {
      return NextResponse.json(
        { error: 'Имя уже занято' },
        { status: 400 }
      )
    }

    // Создаём игрока
    const playerId = generateId()
    const newPlayer: Player = {
      id: playerId,
      gameId: params.gameId,
      name: playerName,
      status: 'active',
      cards: [],
      votes: [],
      joinedAt: new Date(),
      isActive: false,
    }

    await addPlayer(newPlayer)

    return NextResponse.json({
      playerId: playerId,
      message: 'Успешно присоединились к игре',
    })
  } catch (error) {
    console.error('Error joining game:', error)
    return NextResponse.json(
      { error: 'Ошибка при присоединении к игре' },
      { status: 500 }
    )
  }
}

