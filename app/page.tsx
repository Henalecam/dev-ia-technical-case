'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Task } from '@/lib/supabase'

export default function Home() {
  const [userKey, setUserKey] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTaskTags, setNewTaskTags] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [savedWhatsappNumber, setSavedWhatsappNumber] = useState<string | null>(null)

  useEffect(() => {
    const savedUserKey = localStorage.getItem('userKey')
    if (savedUserKey) {
      setUserKey(savedUserKey)
      setIsLoggedIn(true)
      loadTasks(savedUserKey)
      loadWhatsAppNumber(savedUserKey)
    }
  }, [])

  const loadWhatsAppNumber = async (key: string) => {
    try {
      const response = await axios.get(`/api/user?user_key=${key}`)
      if (response.data && response.data.whatsapp_number) {
        setSavedWhatsappNumber(response.data.whatsapp_number)
      } else {
        setSavedWhatsappNumber(null)
      }
    } catch (error) {
      console.error('Erro ao carregar número WhatsApp:', error)
      setSavedWhatsappNumber(null)
    }
  }

  const formatWhatsAppNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsAppNumber(value)
    setWhatsappNumber(formatted)
  }

  const saveWhatsAppNumber = async () => {
    if (!whatsappNumber.trim()) {
      alert('Digite seu número de WhatsApp')
      return
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, '')
    
    if (cleanNumber.length < 10 || cleanNumber.length > 11) {
      alert('Digite um número válido no formato: (XX) XXXXX-XXXX')
      return
    }

    const ddd = parseInt(cleanNumber.substring(0, 2))
    if (ddd < 11 || ddd > 99) {
      alert('DDD inválido! Use um DDD válido (11 a 99)')
      return
    }

    try {
      await axios.post('/api/user', {
        user_key: userKey,
        whatsapp_number: cleanNumber,
      })
      setSavedWhatsappNumber(cleanNumber)
      setShowWhatsAppModal(false)
      setWhatsappNumber('')
      openWhatsApp(cleanNumber)
    } catch (error) {
      console.error('Erro ao salvar número WhatsApp:', error)
      alert('Erro ao salvar número')
    }
  }

  const openWhatsApp = (number?: string) => {
    const userNumber = number || savedWhatsappNumber
    const targetNumber = '5541999155948'
    const message = encodeURIComponent('#todolist')
    const url = `https://wa.me/${targetNumber}?text=${message}`
    window.open(url, '_blank')
  }

  const handleLogin = () => {
    if (userKey.trim()) {
      localStorage.setItem('userKey', userKey)
      setIsLoggedIn(true)
      loadTasks(userKey)
    }
  }

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem('userKey')
      setIsLoggedIn(false)
      setUserKey('')
      setTasks([])
    }
  }

  const loadTasks = async (key: string) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/tasks?user_key=${key}`)
      setTasks(response.data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      alert('Erro ao carregar tarefas. Verifique sua conexão.')
    }
    setLoading(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('Digite um título para a tarefa')
      return
    }

    try {
      const tags = newTaskTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const response = await axios.post('/api/tasks', {
        user_key: userKey,
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        tags: tags,
        due_date: newTaskDueDate || null,
      })
      setTasks([response.data, ...tasks])
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('medium')
      setNewTaskTags('')
      setNewTaskDueDate('')
      setShowForm(false)
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error)
      alert('Erro ao adicionar tarefa')
    }
  }

  const toggleComplete = async (task: Task) => {
    try {
      const response = await axios.put('/api/tasks', {
        id: task.id,
        completed: !task.completed,
      })
      setTasks(tasks.map(t => t.id === task.id ? response.data : t))
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const quickUpdatePriority = async (task: Task, priority: 'low' | 'medium' | 'high') => {
    try {
      const response = await axios.put('/api/tasks', {
        id: task.id,
        priority: priority,
      })
      setTasks(tasks.map(t => t.id === task.id ? response.data : t))
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`/api/tasks?id=${id}`)
      setTasks(tasks.filter(t => t.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-red-100'
      case 'medium': return 'border-l-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100'
      case 'low': return 'border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100'
      default: return 'border-l-4 border-gray-300 bg-white'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  }).sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    high: tasks.filter(t => t.priority === 'high' && !t.completed).length,
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              TaskFlow AI
            </h1>
            <p className="text-gray-600">Gerencie suas tarefas com inteligência</p>
          </div>
          <input
            type="text"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Digite seu email"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 mb-4 transition-all"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TaskFlow AI
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {userKey}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => savedWhatsappNumber ? openWhatsApp() : setShowWhatsAppModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                title={savedWhatsappNumber ? 'Abrir WhatsApp' : 'Conectar WhatsApp'}
              >
                <span>💬</span>
                <span className="hidden sm:inline">
                  {savedWhatsappNumber ? 'WhatsApp' : 'Conectar'}
                </span>
              </button>
              <a
                href="/chat"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Chat IA</span>
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-all"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <p className="text-sm opacity-90">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-4 rounded-xl">
              <p className="text-sm opacity-90">Pendentes</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl">
              <p className="text-sm opacity-90">Concluídas</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-4 rounded-xl">
              <p className="text-sm opacity-90">Urgentes</p>
              <p className="text-3xl font-bold">{stats.high}</p>
            </div>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl hover:shadow-xl transition-all font-medium mb-6 flex items-center justify-center gap-2"
          >
            <span className="text-2xl">+</span>
            <span>Nova Tarefa</span>
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Nova Tarefa</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Título da tarefa"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                autoFocus
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none"
                rows={3}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="low">🟢 Baixa</option>
                  <option value="medium">🟡 Média</option>
                  <option value="high">🔴 Alta</option>
                </select>
                <input
                  type="text"
                  value={newTaskTags}
                  onChange={(e) => setNewTaskTags(e.target.value)}
                  placeholder="Tags (separadas por vírgula)"
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Criar Tarefa
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pendentes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Concluídas ({stats.completed})
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="date">📅 Por Data</option>
              <option value="priority">🎯 Por Prioridade</option>
            </select>
          </div>
        </div>

        {showWhatsAppModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  📱 {savedWhatsappNumber ? 'Atualizar' : 'Conectar'} WhatsApp
                </h3>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false)
                    setWhatsappNumber('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              {savedWhatsappNumber ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-800">
                    ✓ Número atual: <strong>{formatWhatsAppNumber(savedWhatsappNumber)}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Digite um novo número para atualizar
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">
                  Digite seu número de WhatsApp para receber suas tarefas diretamente no celular!
                </p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-blue-800">
                  📱 <strong>Exemplo:</strong> (41) 99915-5948
                </p>
              </div>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                placeholder="(41) 99999-9999"
                maxLength={15}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all mb-4 text-lg tracking-wide"
                autoFocus
              />
              <p className="text-xs text-gray-500 -mt-3 mb-4">
                ✓ Formato: (DDD) XXXXX-XXXX
              </p>
              <p className="text-sm text-gray-500 mb-4">
                💡 Você será direcionado para conversar com nosso bot e receberá suas tarefas com o comando <strong>#todolist</strong>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={saveWhatsAppNumber}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  {savedWhatsappNumber ? '🔄 Atualizar e Abrir' : '💬 Conectar WhatsApp'}
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false)
                    setWhatsappNumber('')
                  }}
                  className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
              {savedWhatsappNumber && (
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false)
                    openWhatsApp()
                  }}
                  className="w-full mt-2 bg-gray-50 text-gray-700 py-2 rounded-xl hover:bg-gray-100 transition-all text-sm"
                >
                  Ou apenas abrir WhatsApp com número atual
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl hover:scale-[1.02] ${
                  task.completed ? 'opacity-60' : ''
                } ${getPriorityColor(task.priority)}`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-400 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <span className="text-white text-sm font-bold">✓</span>}
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getPriorityBadge(task.priority)}`}>
                      {task.priority === 'high' ? '🔴 ALTA' : task.priority === 'medium' ? '🟡 MÉDIA' : '🟢 BAIXA'}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-2 ${
                        task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p
                        className={`text-sm mb-3 line-clamp-2 ${
                          task.completed ? 'line-through text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.tags && task.tags.length > 0 && task.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                      {task.due_date && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium flex items-center gap-1">
                          📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-200">
                    <div className="flex gap-1 items-center mb-2">
                      <span className="text-xs text-gray-500 mr-1">Prioridade:</span>
                      <button
                        onClick={() => quickUpdatePriority(task, 'low')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all ${
                          task.priority === 'low' ? 'bg-green-500 text-white shadow' : 'bg-gray-100 hover:bg-green-100'
                        }`}
                      >
                        🟢
                      </button>
                      <button
                        onClick={() => quickUpdatePriority(task, 'medium')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all ${
                          task.priority === 'medium' ? 'bg-yellow-500 text-white shadow' : 'bg-gray-100 hover:bg-yellow-100'
                        }`}
                      >
                        🟡
                      </button>
                      <button
                        onClick={() => quickUpdatePriority(task, 'high')}
                        className={`px-2 py-1 rounded-lg text-xs transition-all ${
                          task.priority === 'high' ? 'bg-red-500 text-white shadow' : 'bg-gray-100 hover:bg-red-100'
                        }`}
                      >
                        🔴
                      </button>
                      <div className="flex-1"></div>
                      {deleteConfirm === task.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-400"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(task.id)}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(task.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg font-medium mb-2">
                  {filter === 'pending' ? 'Nenhuma tarefa pendente' : filter === 'completed' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa cadastrada'}
                </p>
                <p className="text-gray-400">
                  {filter === 'all' ? 'Clique em "+ Nova Tarefa" para começar' : 'Tente outro filtro'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
