import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userKey = searchParams.get('user_key')
  const userId = searchParams.get('user_id')
  const pendingOnly = searchParams.get('pending_only') === 'true'

  let finalUserId = userId

  if (!finalUserId && userKey) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userKey.toLowerCase())
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ email: userKey.toLowerCase() }])
          .select('id')
          .single()

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }
        finalUserId = newUser.id
      } else {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      finalUserId = userData.id
    }
  }

  if (!finalUserId) {
    return NextResponse.json(
      { error: 'user_key or user_id is required' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', finalUserId)

  if (pendingOnly) {
    query = query.eq('completed', false)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_key, user_id, title, description, priority, tags, due_date } = body

  if (!title) {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400 }
    )
  }

  let finalUserId = user_id

  if (!finalUserId && user_key) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_key.toLowerCase())
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ email: user_key.toLowerCase() }])
          .select('id')
          .single()

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }
        finalUserId = newUser.id
      } else {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      finalUserId = userData.id
    }
  }

  if (!finalUserId) {
    return NextResponse.json(
      { error: 'user_key or user_id is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: finalUserId,
        title,
        description: description || '',
        completed: false,
        priority: priority || 'medium',
        tags: tags || [],
        due_date: due_date || null,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, title, description, completed, priority, tags, due_date } = body

  if (!id) {
    return NextResponse.json(
      { error: 'id is required' },
      { status: 400 }
    )
  }

  const updateData: any = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (completed !== undefined) updateData.completed = completed
  if (priority !== undefined) updateData.priority = priority
  if (tags !== undefined) updateData.tags = tags
  if (due_date !== undefined) updateData.due_date = due_date

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'id is required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
