import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { marked } from 'marked'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { message, user_key } = body

  if (!message || !user_key) {
    return NextResponse.json(
      { error: 'message e user_key são obrigatórios' },
      { status: 400 }
    )
  }

  try {
    let userId = null
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
        userId = newUser.id
      } else {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      userId = userData.id
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (tasksError) {
      console.error('Erro ao buscar tasks:', tasksError)
    }

    const { data: userFullData, error: userDataError } = await supabase
      .from('users')
      .select('email, whatsapp_number')
      .eq('id', userId)
      .single()

    if (userDataError) {
      console.error('Erro ao buscar dados do usuário:', userDataError)
    }

    const n8nChatWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL

    if (!n8nChatWebhookUrl) {
      return NextResponse.json(
        { error: 'N8N_CHAT_WEBHOOK_URL não configurado' },
        { status: 500 }
      )
    }

    const response = await axios.post(n8nChatWebhookUrl, {
      message,
      user_key,
      user_email: userFullData?.email || user_key,
      user_whatsapp: userFullData?.whatsapp_number || null,
      tasks: tasks || [],
      source: 'web',
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`
        })
      },
      timeout: 30000,
    })
    
    console.log('Full N8N response:', response.data);
    
    let rawReply = 'Resposta recebida';
    let userEmail = user_key;
    
    try {
      const replyMatch = response.data.match(/"reply":\s*"([\s\S]*?)",\s*"user_email"/);
      if (replyMatch) {
        rawReply = replyMatch[1].replace(/\\n/g, '\n');
      }
      
      const emailMatch = response.data.match(/"user_email":\s*"([^"]+)"/);
      if (emailMatch) {
        userEmail = emailMatch[1];
      }
    } catch (error) {
      console.error('Erro ao extrair dados do N8N:', error);
      rawReply = response.data || 'Resposta recebida';
    }
    
    console.log('Raw reply from N8N:', rawReply);
    
    const formattedReply = await marked.parse(rawReply, {
      breaks: true,
      gfm: true,
    });
    
    console.log('Formatted reply:', formattedReply);

    return NextResponse.json({
      reply: formattedReply,
      user_email: userEmail,
    })
  } catch (error: any) {
    console.error('Erro ao comunicar com N8N:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar mensagem',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
