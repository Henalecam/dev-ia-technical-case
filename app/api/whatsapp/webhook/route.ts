import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const messageData = body.data || body
    const messageText = messageData.message?.conversation || 
                       messageData.message?.extendedTextMessage?.text ||
                       messageData.body ||
                       ''
    
    const remoteJid = messageData.key?.remoteJid || 
                      messageData.from ||
                      ''

    if (!messageText || !remoteJid) {
      return NextResponse.json({ status: 'ignored', reason: 'no message or sender' })
    }

    if (remoteJid.includes('@g.us')) {
      return NextResponse.json({ status: 'ignored', reason: 'group message' })
    }

    if (messageText.trim().toLowerCase() === '#todolist') {
      const n8nEvolutionWebhookUrl = process.env.N8N_EVOLUTION_WEBHOOK_URL
      if (n8nEvolutionWebhookUrl) {
        try {
          await axios.post(n8nEvolutionWebhookUrl, {
            remoteJid: remoteJid,
            message: messageText,
            timestamp: new Date().toISOString(),
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          })
        } catch (error) {
          console.error('Error calling N8N Evolution webhook:', error)
        }
      }

      return NextResponse.json({ 
        status: 'processed', 
        command: 'todolist',
        remoteJid: remoteJid
      })
    }

    return NextResponse.json({ 
      status: 'ignored', 
      reason: 'not #todolist command' 
    })

  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Error processing webhook', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'WhatsApp webhook active',
    timestamp: new Date().toISOString()
  })
}
