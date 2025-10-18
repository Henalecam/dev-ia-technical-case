'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Navbar from '@/components/Navbar'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatPage() {
  const [userKey, setUserKey] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedUserKey = localStorage.getItem('userKey')
    if (savedUserKey) {
      setUserKey(savedUserKey)
      setIsLoggedIn(true)
      
      const savedMessages = localStorage.getItem(`chat_messages_${savedUserKey}`)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      } else {
        const welcomeMessage: Message = {
          role: 'assistant',
          content: 'Olá! 👋 Sou seu assistente de consulta de tarefas.\n\nPosso ajudá-lo a:\n• 📋 Consultar suas tarefas\n• 🔍 Filtrar por prioridade\n• 📊 Ver estatísticas\n• 💡 Dar dicas de organização\n• ⏰ Lembrar sobre prazos\n\n⚠️ Para criar ou editar tarefas, use a interface principal.\n\nComo posso ajudar você hoje?',
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && userKey) {
      localStorage.setItem(`chat_messages_${userKey}`, JSON.stringify(messages))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoggedIn, userKey])

  const handleLogin = () => {
    if (userKey.trim()) {
      localStorage.setItem('userKey', userKey)
      setIsLoggedIn(true)
      
      const savedMessages = localStorage.getItem(`chat_messages_${userKey}`)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      } else {
        const welcomeMessage: Message = {
          role: 'assistant',
          content: 'Olá! 👋 Sou seu assistente de consulta de tarefas.\n\nPosso ajudá-lo a:\n• 📋 Consultar suas tarefas\n• 🔍 Filtrar por prioridade\n• 📊 Ver estatísticas\n• 💡 Dar dicas de organização\n• ⏰ Lembrar sobre prazos\n\n⚠️ Para criar ou editar tarefas, use a interface principal.\n\nComo posso ajudar você hoje?',
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userKey')
    setIsLoggedIn(false)
    setUserKey('')
    setMessages([])
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    // Adiciona mensagem do usuário imediatamente
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: inputMessage,
        user_key: userKey,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.reply || 'Resposta recebida',
        timestamp: new Date().toISOString(),
      }

      setMessages([...updatedMessages, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Erro ao processar mensagem: ${error.response?.data?.error || error.message}.\n\n💡 Verifique se o N8N está configurado corretamente.`,
        timestamp: new Date().toISOString(),
      }
      setMessages([...updatedMessages, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente de tarefas inteligente.\n\nPosso ajudá-lo a:\n• 📋 Consultar suas tarefas\n• ✨ Criar novas tarefas\n• 📝 Melhorar descrições\n• 🎯 Organizar prioridades\n• 💡 Dar sugestões\n\nComo posso ajudar você hoje?',
      timestamp: new Date().toISOString(),
    }
    setMessages([welcomeMessage])
    localStorage.setItem(`chat_messages_${userKey}`, JSON.stringify([welcomeMessage]))
  }

  const quickActions = [
    { label: 'Minhas tarefas pendentes', icon: '📋', description: 'Ver todas as tarefas não concluídas' },
    { label: 'Tarefas de alta prioridade', icon: '🔴', description: 'Tarefas urgentes que precisam de atenção' },
    { label: 'Tarefas para hoje', icon: '📅', description: 'Tarefas com prazo para hoje' },
    { label: 'Resumo das minhas tarefas', icon: '📊', description: 'Estatísticas e análise geral' },
    { label: 'Criar nova tarefa', icon: '➕', description: 'Adicionar uma nova tarefa à lista' },
    { label: 'Dicas de produtividade', icon: '💡', description: 'Sugestões para ser mais produtivo' },
  ]

  const handleQuickAction = (label: string) => {
    setInputMessage(label)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center transform -rotate-3">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chatbot AI
            </h1>
            <p className="text-gray-600">
              Seu assistente inteligente de tarefas
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={userKey}
              onChange={(e) => setUserKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Digite seu nome ou e-mail"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Acessar Chatbot
            </button>
          </div>
          <div className="mt-6 text-center">
            <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-2">
              <span>←</span>
              Voltar para Tarefas
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar userKey={userKey} onLogout={handleLogout} currentPage="chat" />
      
      <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col">
        {/* Chat Header */}
        <div className="bg-white rounded-t-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center transform -rotate-3">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Assistente AI
                </h1>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {userKey}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearChat}
                className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl hover:bg-yellow-200 transition-all text-sm font-medium border border-yellow-300 flex items-center gap-2"
              >
                <span>🗑️</span>
                Limpar Chat
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white shadow-xl overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-5xl">💬</span>
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">Comece uma conversa</p>
              <p className="text-gray-400 text-sm">
                Digite uma mensagem ou use uma ação rápida abaixo
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                }`}>
                  <span className="text-xl">{message.role === 'user' ? '👤' : '🤖'}</span>
                </div>
                
                {/* Message Bubble */}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl p-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200 rounded-tl-sm'
                    }`}
                  >
                    <div 
                      className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                      }}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 px-2 ${
                      message.role === 'user' ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">IA está pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="bg-white shadow-xl px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 font-medium flex items-center gap-2">
              <span>⚡</span>
              Ações Rápidas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.label)}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 px-4 py-3 rounded-xl transition-all text-sm font-medium flex items-start gap-3 text-left group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 border border-gray-100 border-t-0">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder={loading ? "Aguarde a resposta da IA..." : "Digite sua mensagem ou pergunta..."}
                disabled={loading}
                className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-sm">💬</span>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none min-w-[120px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Pensando...</span>
                </>
              ) : (
                <>
                  <span>Enviar</span>
                  <span className="text-lg">🚀</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>Dica: Use ações rápidas para começar</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2 text-indigo-600">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>IA processando...</span>
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Pronto para conversar</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
