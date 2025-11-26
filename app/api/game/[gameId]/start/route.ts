import { NextRequest, NextResponse } from 'next/server'
import { getGame, getPlayers, updateGame, updatePlayer } from '@/lib/db'
import { dealCards } from '@/lib/utils'
import { Game } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const body = await request.json()
    const { playerId } = body

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

    // Проверяем, что это хост (первый игрок)
    const players = await getPlayers(params.gameId)
    if (players.length < 4) {
      return NextResponse.json(
        { error: 'Минимум 4 игрока для начала игры' },
        { status: 400 }
      )
    }

    // Раздаём карты
    const playersWithCards = dealCards(players)
    
    // Обновляем игроков с картами
    for (const player of playersWithCards) {
      await updatePlayer(player.id, { cards: player.cards })
    }

    // Обновляем игру
    const updatedGame: Partial<Game> = {
      status: 'playing',
      currentRound: 1,
      currentPhase: 'bunker-reveal',
      activePlayerId: players[0].id,
      startedAt: new Date(),
    }

    await updateGame(params.gameId, updatedGame)

    // Устанавливаем первого активного игрока
    await updatePlayer(players[0].id, { isActive: true })

    return NextResponse.json({
      message: 'Игра началась',
      game: await getGame(params.gameId),
    })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Ошибка при запуске игры' },
      { status: 500 }
    )
  }
}

