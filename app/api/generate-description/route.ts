import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { marked } from 'marked'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, user_key } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL

    if (!n8nUrl) {
      return NextResponse.json(
        { error: 'N8N_CHAT_WEBHOOK_URL não configurada' },
        { status: 500 }
      )
    }


    const response = await axios.post(n8nUrl, {
      title,
      description: description || '',
      action: 'generate_description',
      user_key,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })


    // N8N retorna texto simples com a descrição
    let generatedDescription = '';
    if (typeof response.data === 'string') {
      generatedDescription = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Se vier como objeto, tenta extrair o output ou description
      generatedDescription = response.data.output || response.data.description || JSON.stringify(response.data);
    } else {
      console.error('Formato de resposta inesperado do N8N:', response.data);
      return NextResponse.json(
        { error: 'Formato de resposta inesperado do N8N.' },
        { status: 500 }
      );
    }

    // Processa quebras de linha usando -- como separador antes do marked
    const processedDescription = generatedDescription
      .split(' -- ')
      .map(line => line.trim())
      .join('\n\n');

    // Processa o texto usando marked (mesma lógica do chat)
    const formattedDescription = await marked.parse(processedDescription, {
      breaks: true,
      gfm: true,
    });

    return NextResponse.json({ description: formattedDescription })

  } catch (error: any) {
    console.error('Erro ao chamar N8N:', error)
    console.error('Erro response:', error.response?.data)
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar descrição',
        details: error.response?.data || error.message 
      },
      { status: error.response?.status || 500 }
    )
  }
}

