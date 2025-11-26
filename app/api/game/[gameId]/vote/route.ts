import { NextRequest, NextResponse } from 'next/server'
import { getGame, getPlayers, updatePlayer, updateGame } from '@/lib/db'
import { countVotes, getExcludedPlayer } from '@/lib/utils'
import { VoteRequest } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const body: VoteRequest = await request.json()
    const { playerId, targetPlayerId } = body

    if (!playerId || !targetPlayerId) {
      return NextResponse.json(
        { error: 'ID игрока и цели обязательны' },
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

    if (game.currentPhase !== 'voting') {
      return NextResponse.json(
        { error: 'Сейчас не фаза голосования' },
        { status: 400 }
      )
    }

    const players = await getPlayers(params.gameId)
    const votingPlayer = players.find(p => p.id === playerId)

    if (!votingPlayer || votingPlayer.status !== 'active') {
      return NextResponse.json(
        { error: 'Игрок не может голосовать' },
        { status: 400 }
      )
    }

    // Добавляем голос
    const currentVotes = [...votingPlayer.votes]
    currentVotes.push(targetPlayerId)
    await updatePlayer(playerId, { votes: currentVotes })

    // Проверяем, все ли проголосовали
    const updatedPlayers = await getPlayers(params.gameId)
    const activePlayers = updatedPlayers.filter(p => p.status === 'active')
    const allVoted = activePlayers.every(p => p.votes.length > 0)

    if (allVoted) {
      // Подсчитываем голоса
      const votes = countVotes(activePlayers)
      const excludedId = getExcludedPlayer(votes)

      if (excludedId) {
        await updatePlayer(excludedId, { status: 'excluded' })
      }

      // Переходим к следующему раунду или завершаем игру
      const nextRound = game.currentRound + 1
      if (nextRound > game.maxRounds) {
        await updateGame(params.gameId, {
          status: 'finished',
          finishedAt: new Date(),
        })
      } else {
        await updateGame(params.gameId, {
          currentRound: nextRound,
          currentPhase: 'bunker-reveal',
        })
      }
    }

    return NextResponse.json({
      message: 'Голос учтён',
      allVoted,
    })
  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке голоса' },
      { status: 500 }
    )
  }
}

