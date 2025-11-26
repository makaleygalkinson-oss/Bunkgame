import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Создаем или обновляем профиль после OAuth входа
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
  }

  return NextResponse.redirect(new URL('/lobby', requestUrl.origin))
}

