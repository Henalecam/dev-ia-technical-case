import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userKey = searchParams.get('user_key')

  if (!userKey) {
    return NextResponse.json(
      { error: 'user_key (email) é obrigatório' },
      { status: 400 }
    )
  }

  let userData = await supabase
    .from('users')
    .select('*')
    .eq('email', userKey.toLowerCase())
    .single()

  if (userData.error) {
    if (userData.error.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ email: userKey.toLowerCase() }])
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      return NextResponse.json(newUser)
    }
    return NextResponse.json({ error: userData.error.message }, { status: 500 })
  }

  return NextResponse.json(userData.data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_key, whatsapp_number } = body

  if (!user_key || !whatsapp_number) {
    return NextResponse.json(
      { error: 'user_key e whatsapp_number são obrigatórios' },
      { status: 400 }
    )
  }

  let userId = null
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user_key.toLowerCase())
    .single()

  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{ email: user_key.toLowerCase() }])
      .select('id')
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
    userId = newUser.id
  }

  const { data, error } = await supabase
    .from('users')
    .update({ whatsapp_number: whatsapp_number })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

