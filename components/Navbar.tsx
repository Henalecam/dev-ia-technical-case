'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavbarProps {
  userKey: string
  onLogout: () => void
  currentPage?: 'chat' | 'tasks'
}

export default function Navbar({ userKey, onLogout, currentPage = 'tasks' }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: '/tasks', label: 'Tarefas', icon: '📋', page: 'tasks' as const },
    { href: '/chat', label: 'Chat IA', icon: '🤖', page: 'chat' as const },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TaskFlow AI
                </h1>
                <p className="text-xs text-gray-500">Sistema Inteligente</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  currentPage === item.page
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* WhatsApp Button */}
            <button
              onClick={() => {
                const targetNumber = '5541999155948'
                const message = encodeURIComponent('#todolist')
                const url = `https://wa.me/${targetNumber}?text=${message}`
                window.open(url, '_blank')
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <span className="text-lg">💬</span>
              <span>WhatsApp</span>
            </button>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userKey}</p>
                <p className="text-xs text-gray-500">Usuário ativo</p>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex px-4 py-3 rounded-xl font-medium transition-all items-center space-x-3 ${
                    currentPage === item.page
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <button
                onClick={() => {
                  const targetNumber = '5541999155948'
                  const message = encodeURIComponent('#todolist')
                  const url = `https://wa.me/${targetNumber}?text=${message}`
                  window.open(url, '_blank')
                  setIsMenuOpen(false)
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-3"
              >
                <span className="text-lg">💬</span>
                <span>WhatsApp</span>
              </button>

              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{userKey}</p>
                  <p className="text-xs text-gray-500">Usuário ativo</p>
                </div>
                <button
                  onClick={() => {
                    onLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full mt-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
