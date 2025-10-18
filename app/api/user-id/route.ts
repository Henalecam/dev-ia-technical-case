import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const identifier = searchParams.get('identifier') // Email ou WhatsApp

  if (!identifier) {
    return NextResponse.json(
      { error: 'identifier é obrigatório (email ou whatsapp)' },
      { status: 400 }
    )
  }

  try {
    let user = null

    if (identifier.includes('@')) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      user = data
    } else {
      const cleanNumber = identifier.replace(/\D/g, '')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', cleanNumber)
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      user = data
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado', identifier },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      whatsapp_number: user.whatsapp_number,
      display_name: user.display_name,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuário', details: error.message },
      { status: 500 }
    )
  }
}

