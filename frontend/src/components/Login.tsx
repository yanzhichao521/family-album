import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'

const Login: React.FC = () => {
  const [deviceId, setDeviceId] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!deviceId) {
      setError('请输入账号')
      setLoading(false)
      return
    }

    if (!nickname) {
      setError('请输入昵称')
      setLoading(false)
      return
    }

    try {
      await login(deviceId, nickname)
      navigate('/spaces')
    } catch (err) {
      setError('登录失败，请重试')
      console.error('登录错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 to-warm-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-warm-600">FamilyAlbum</h1>
          <p className="text-gray-600 mt-2">中转即焚多人相册</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-1">
              账号
            </label>
            <input
              type="text"
              id="deviceId"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="请输入手机号或其他唯一标识"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
              required
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              昵称
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的昵称"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warm-500 text-white py-3 rounded-md font-medium hover:bg-warm-600 transition-colors disabled:bg-warm-400 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>首次登录将自动注册账号</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
