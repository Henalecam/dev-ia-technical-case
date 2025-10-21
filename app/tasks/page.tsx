'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Task } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function TasksPage() {
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
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editTags, setEditTags] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

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
      console.error('Error loading WhatsApp number:', error)
      setSavedWhatsappNumber(null)
    }
  }

  const formatWhatsAppNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
  }

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsAppNumber(value)
    setWhatsappNumber(formatted)
  }

  const saveWhatsAppNumber = async () => {
    if (!whatsappNumber.trim()) {
      alert('Enter your WhatsApp number')
      return
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, '')
    
    if (cleanNumber.length < 10 || cleanNumber.length > 11) {
      alert('Enter a valid number.\nExamples:\n(42) 9981-8268 or\n(42) 91234-5678')
      return
    }

    const ddd = parseInt(cleanNumber.substring(0, 2))
    if (ddd < 11 || ddd > 99) {
      alert('Invalid area code! Use a valid area code (11 to 99)')
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
      console.error('Error saving WhatsApp number:', error)
      alert('Error saving number. Please try again.')
    }
  }

  const openWhatsApp = (number?: string) => {
    const userNumber = number || savedWhatsappNumber
    
    if (!userNumber || userNumber.trim() === '') {
      setShowWhatsAppModal(true)
      return
    }
    
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
      loadWhatsAppNumber(userKey)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
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
      console.error('Error loading tasks:', error)
      alert('Error loading tasks. Check your connection.')
    }
    setLoading(false)
  }

  const htmlToText = (html: string) => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }

  const generateDescription = async (isEditing: boolean = false) => {
    const title = isEditing ? editTitle : newTaskTitle
    const currentDescription = isEditing ? editDescription : newTaskDescription
    
    if (!title.trim()) {
      alert('Enter a title for the task before generating the description')
      return
    }

    setGeneratingDescription(true)
    
    try {
      const response = await axios.post('/api/generate-description', {
        title: title,
        description: currentDescription,
        user_key: userKey,
        additional_context: '',
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })

      if (response.data && response.data.description) {
        const plainTextDescription = htmlToText(response.data.description)
        
        if (isEditing) {
          setEditDescription(plainTextDescription)
        } else {
          setNewTaskDescription(plainTextDescription)
        }
      } else if (typeof response.data === 'string') {
        if (isEditing) {
          setEditDescription(response.data)
        } else {
          setNewTaskDescription(response.data)
        }
      } else {
        console.error('Unexpected response format:', response.data)
        alert('AI responded, but the format was not recognized. Check the console.')
      }
    } catch (error: any) {
      console.error('Error generating description:', error)
      console.error('Details:', error.response?.data)

      if (error.response?.status === 400) {
        alert('❌ Invalid data.\n\nCheck if you filled in the title correctly.')
      } else if (error.response?.status === 500) {
        const details = error.response?.data?.details || ''
        alert(`❌ Server error generating description.\n\n${details}\n\nCheck if N8N is configured correctly.`)
      } else if (error.code === 'ECONNABORTED') {
        alert('⏱️ Timeout. The AI is taking too long to respond.')
      } else {
        const errorMsg = error.response?.data?.error || error.message
        alert(`❌ Error generating description with AI.\n\n${errorMsg}`)
      }
    } finally {
      setGeneratingDescription(false)
    }
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description ? htmlToText(task.description) : '')
    setEditPriority(task.priority)
    setEditTags(task.tags ? task.tags.join(', ') : '')
    setEditDueDate(task.due_date || '')
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditTitle('')
    setEditDescription('')
    setEditPriority('medium')
    setEditTags('')
    setEditDueDate('')
  }

  const saveEditTask = async () => {
    if (!editTitle.trim()) {
      alert('Enter a title for the task')
      return
    }

    try {
      const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const response = await axios.put('/api/tasks', {
        id: editingTask?.id,
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        tags: tags,
        due_date: editDueDate || null,
      })
      setTasks(tasks.map(t => t.id === editingTask?.id ? response.data : t))
      cancelEdit()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Error updating task')
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('Enter a title for the task')
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
      console.error('Error adding task:', error)
      alert('Error adding task')
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
      console.error('Error updating task:', error)
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
      console.error('Error updating priority:', error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`/api/tasks?id=${id}`)
      setTasks(tasks.filter(t => t.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting task:', error)
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
            <p className="text-gray-600">Manage your tasks intelligently</p>
          </div>
          <input
            type="text"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 mb-4 transition-all"
          />
          <button
            onClick={() => {
              if (userKey.trim()) {
                localStorage.setItem('userKey', userKey)
                setIsLoggedIn(true)
                loadTasks(userKey)
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar 
        userKey={userKey} 
        onLogout={handleLogout} 
        currentPage="tasks"
        onWhatsAppClick={() => openWhatsApp()}
        hasWhatsAppNumber={!!savedWhatsappNumber}
      />
      
      <div className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  My Tasks
                </h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {userKey}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                <p className="text-sm opacity-90">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-4 rounded-xl">
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl">
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-4 rounded-xl">
                <p className="text-sm opacity-90">Urgent</p>
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
              <span>New Task</span>
            </button>
          )}

          {showForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">New Task</h2>
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
                  placeholder="Task title"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                  autoFocus
                />
                <div className="relative">
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => generateDescription(false)}
                    disabled={generatingDescription || !newTaskTitle.trim()}
                    className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                    title={!newTaskTitle.trim() ? 'Enter a title first' : 'Generate description with AI'}
                  >
                    {generatingDescription ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating with AI...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🤖</span>
                        <span>Generate Description with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                  <input
                    type="text"
                    value={newTaskTags}
                    onChange={(e) => setNewTaskTags(e.target.value)}
                    placeholder="Tags (comma separated)"
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
                    Create Task
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
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
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === 'completed'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Completed ({stats.completed})
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="date">📅 By Date</option>
                <option value="priority">🎯 By Priority</option>
              </select>
            </div>
          </div>

          {showWhatsAppModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    📱 {savedWhatsappNumber ? 'Update' : 'Connect'} WhatsApp
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
                      ✓ Current number: <strong>{formatWhatsAppNumber(savedWhatsappNumber)}</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Enter a new number to update
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-4">
                    Enter your WhatsApp number to receive your tasks directly on your phone!
                  </p>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    📱 <strong>Example:</strong> (42) 91234-5678
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Enter only numbers, the mask will be applied automatically
                  </p>
                </div>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => handleWhatsAppChange(e.target.value)}
                  placeholder="(42) 91234-5678"
                  maxLength={15}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-all mb-4 text-lg tracking-wide"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mb-4">
                  💡 You will be directed to chat with our bot and receive your tasks with the command <strong>#todolist</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={saveWhatsAppNumber}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    {savedWhatsappNumber ? '🔄 Update and Open' : '💬 Connect WhatsApp'}
                  </button>
                  <button
                    onClick={() => {
                      setShowWhatsAppModal(false)
                      setWhatsappNumber('')
                    }}
                    className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
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
                    Or just open WhatsApp with current number
                  </button>
                )}
              </div>
            </div>
          )}

          {editingTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span>✏️</span>
                    Edit Task
                  </h3>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none"
                      rows={4}
                    />
                    <button
                      type="button"
                      onClick={() => generateDescription(true)}
                      disabled={generatingDescription || !editTitle.trim()}
                      className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                      title={!editTitle.trim() ? 'Enter a title first' : 'Generate description with AI'}
                    >
                      {generatingDescription ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating with AI...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">🤖</span>
                          <span>Generate/Improve Description with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🔴 High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveEditTask}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      💾 Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-8 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
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
                        {task.priority === 'high' ? '🔴 HIGH' : task.priority === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
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
                        <div
                          className={`text-sm mb-3 line-clamp-2 prose prose-sm max-w-none prose-p:my-1 prose-headings:font-semibold prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${
                            task.completed ? 'line-through text-gray-400' : 'text-gray-600'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: task.description
                          }}
                        />
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
                      <div className="flex gap-2 items-center mb-2 flex-wrap">
                        <button
                          onClick={() => startEditTask(task)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-all font-medium flex items-center gap-1"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                        {deleteConfirm === task.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 font-medium"
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-400 font-medium"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(task.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-all font-medium flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        )}
                        <div className="flex-1"></div>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => quickUpdatePriority(task, 'low')}
                            className={`w-8 h-8 rounded-lg text-sm transition-all flex items-center justify-center ${
                              task.priority === 'low' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 hover:bg-green-100'
                            }`}
                            title="Low Priority"
                          >
                            🟢
                          </button>
                          <button
                            onClick={() => quickUpdatePriority(task, 'medium')}
                            className={`w-8 h-8 rounded-lg text-sm transition-all flex items-center justify-center ${
                              task.priority === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 hover:bg-yellow-100'
                            }`}
                            title="Medium Priority"
                          >
                            🟡
                          </button>
                          <button
                            onClick={() => quickUpdatePriority(task, 'high')}
                            className={`w-8 h-8 rounded-lg text-sm transition-all flex items-center justify-center ${
                              task.priority === 'high' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 hover:bg-red-100'
                            }`}
                            title="High Priority"
                          >
                            🔴
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Created on {new Date(task.created_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-2xl shadow-lg">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    {filter === 'pending' ? 'No pending tasks' : filter === 'completed' ? 'No completed tasks' : 'No tasks registered'}
                  </p>
                  <p className="text-gray-400">
                    {filter === 'all' ? 'Click "+ New Task" to get started' : 'Try another filter'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
