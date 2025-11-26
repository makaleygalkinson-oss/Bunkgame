import { NextRequest, NextResponse } from 'next/server'
import { getGame } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const game = await getGame(params.gameId)

    if (!game) {
      return NextResponse.json(
        { error: 'Игра не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении игры' },
      { status: 500 }
    )
  }
}

