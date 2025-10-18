import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaskFlow AI - Sistema Inteligente de Tarefas',
  description: 'Gerencie suas tarefas com inteligência artificial, integração WhatsApp e chatbot avançado',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}





