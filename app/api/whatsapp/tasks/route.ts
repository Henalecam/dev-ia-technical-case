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

    console.log('=== DEBUG WHATSAPP TASKS ===');
    console.log('RemoteJid original:', remoteJid);
    console.log('Phone number extraído:', phoneNumber);
    console.log('Clean number final:', cleanNumber);
    console.log('Tamanho do número:', cleanNumber.length);
    console.log('============================');

    // Tenta buscar o usuário com o número exato
    console.log('1. Buscando número exato:', cleanNumber);
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number', cleanNumber)
      .single();

    console.log('Resultado busca exata:', { user: !!user, error: userError?.message });

    // Se não encontrou e o número tem 12 dígitos (com 9), tenta sem o 9
    if (userError && cleanNumber.length === 12 && cleanNumber.startsWith('9')) {
      const numberWithout9 = cleanNumber.substring(1);
      console.log('2. Tentando sem o 9:', numberWithout9);
      
      const { data: userWithout9, error: userErrorWithout9 } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', numberWithout9)
        .single();
      
      console.log('Resultado sem 9:', { user: !!userWithout9, error: userErrorWithout9?.message });
      
      if (!userErrorWithout9 && userWithout9) {
        user = userWithout9;
        userError = null;
      }
    }

    // Se não encontrou e o número tem 11 dígitos (sem 9), tenta com o 9
    if (userError && cleanNumber.length === 11 && !cleanNumber.startsWith('9')) {
      const numberWith9 = '9' + cleanNumber;
      console.log('3. Tentando com o 9:', numberWith9);
      
      const { data: userWith9, error: userErrorWith9 } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', numberWith9)
        .single();
      
      console.log('Resultado com 9:', { user: !!userWith9, error: userErrorWith9?.message });
      
      if (!userErrorWith9 && userWith9) {
        user = userWith9;
        userError = null;
      }
    }

    // Se ainda não encontrou, tenta buscar por qualquer variação do número
    if (userError) {
      console.log('4. Tentando busca flexível para:', cleanNumber);
      
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .or(`whatsapp_number.eq.${cleanNumber},whatsapp_number.eq.9${cleanNumber},whatsapp_number.eq.${cleanNumber.substring(1)}`)
        .limit(1);
      
      console.log('Resultado busca flexível:', { users: users?.length, error: searchError?.message });
      
      if (!searchError && users && users.length > 0) {
        user = users[0];
        userError = null;
        console.log('Usuário encontrado na busca flexível:', user.whatsapp_number);
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
