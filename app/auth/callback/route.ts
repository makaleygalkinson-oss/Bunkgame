import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createProfile } from '@/lib/actions/profile';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/lobby';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Создаём профиль для OAuth пользователей
      await createProfile(data.user.id, data.user.email || '');
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}

