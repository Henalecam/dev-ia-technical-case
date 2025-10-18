'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const savedUserKey = localStorage.getItem('userKey')
    if (savedUserKey) {
      router.push('/tasks')
    } else {
      router.push('/tasks')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg animate-bounce-gentle">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Redirecionando...</h1>
        <p className="text-gray-600">Você será direcionado para suas tarefas</p>
      </div>
    </div>
  )
}
