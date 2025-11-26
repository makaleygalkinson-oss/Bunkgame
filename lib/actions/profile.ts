'use server';

import { createClient } from '@/lib/supabase/server';

export async function createProfile(userId: string, email: string | null) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email === 'anonymous' ? null : email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    });

  if (error) {
    console.error('Error creating/updating profile:', error);
    // Не бросаем ошибку, чтобы не прерывать процесс авторизации
  }
}

