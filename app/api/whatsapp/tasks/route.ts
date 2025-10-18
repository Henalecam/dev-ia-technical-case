import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const remoteJid = body.remoteJid;
    
    if (!remoteJid) {
      return NextResponse.json(
        { error: 'remoteJid é obrigatório' },
        { status: 400 }
      );
    }

    const phoneNumber = remoteJid.split('@')[0];
    
    let cleanNumber = phoneNumber;
    if (phoneNumber.startsWith('55')) {
      cleanNumber = phoneNumber.substring(2);
    }
    
    cleanNumber = cleanNumber.replace(/\D/g, '');

    // Primeiro tenta com o 9 adicional no lugar correto (formato mais comum no banco)
    // Se o número tem 10 dígitos, adiciona o 9 após o DDD (42)
    let numberWith9 = cleanNumber;
    if (cleanNumber.length === 10 && cleanNumber.startsWith('42')) {
      numberWith9 = cleanNumber.substring(0, 2) + '9' + cleanNumber.substring(2);
    } else if (cleanNumber.length < 11) {
      numberWith9 = '9' + cleanNumber;
    }
    
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number', numberWith9)
      .single();

    // Se não encontrou, tenta sem o 9
    if (userError) {
      const { data: userWithout9, error: userErrorWithout9 } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', cleanNumber)
        .single();
      
      if (!userErrorWithout9 && userWithout9) {
        user = userWithout9;
        userError = null;
      }
    }

    // Se ainda não encontrou, tenta busca flexível
    if (userError) {
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .or(`whatsapp_number.eq.${cleanNumber},whatsapp_number.eq.9${cleanNumber},whatsapp_number.eq.${cleanNumber.substring(1)}`)
        .limit(1);
      
      if (!searchError && users && users.length > 0) {
        user = users[0];
        userError = null;
      }
    }

    if (userError || !user) {
      console.log('Usuário não encontrado para o número:', cleanNumber);
      return NextResponse.json({
        error: 'Usuário não encontrado. Por favor, cadastre-se primeiro no sistema.',
        user_email: null,
        tasks: [],
        remoteJid: remoteJid
      });
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Erro ao buscar tarefas:', tasksError);
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      );
    }

    console.log('Tarefas encontradas:', tasks?.length || 0);

    const formattedTasks = tasks?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      tags: task.tags,
      due_date: task.due_date,
      created_at: task.created_at,
      updated_at: task.updated_at
    })) || [];

    return NextResponse.json({
      user_key: user.email,
      user_email: user.email,
      user_whatsapp: user.whatsapp_number,
      tasks: formattedTasks,
      remoteJid: remoteJid
    });

  } catch (error) {
    console.error('Erro na API WhatsApp tasks:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
