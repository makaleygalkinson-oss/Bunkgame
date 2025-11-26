'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

const signInSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = signUpSchema.safeParse({ email, password })
  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const { data, error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Создаем профиль пользователя
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/lobby')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = signInSchema.safeParse({ email, password })
  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Создаем или обновляем профиль
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/lobby')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

// Раскомментируйте, если VK поддерживается в вашем регионе
/*
export async function signInWithVK() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'vk',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
*/

export async function signInAnonymously() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInAnonymously()

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Создаем профиль для анонимного пользователя
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: null,
        is_anonymous: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Error creating anonymous profile:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/lobby')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

