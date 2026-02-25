import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

// 模拟数据
import { mockUpdateUser } from '../services/mockData'

// 默认头像列表 - 使用Lorelei风格，更温馨适合家庭
const defaultAvatars = [
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Mom&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Dad&backgroundColor=ffd9da",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Son&backgroundColor=d6f8d6",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Daughter&backgroundColor=ffdae0",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Grandma&backgroundColor=e8d5ff",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Grandpa&backgroundColor=fff3cd",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Family1&backgroundColor=e0f7fa",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Family2&backgroundColor=fff8e1",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Family3&backgroundColor=e8f5e8",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Family4&backgroundColor=f3e5f5"
]

const UserProfile: React.FC = () => {
  const [nickname, setNickname] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // 初始化用户信息
  React.useEffect(() => {
    if (user) {
      setNickname(user.nickname)
      setSelectedAvatar(user.avatar || defaultAvatars[0])
    }
  }, [user])

  // 保存用户信息
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!nickname) {
      setError('请输入昵称')
      setLoading(false)
      return
    }

    try {
      const updatedUser = await mockUpdateUser({ nickname, avatar: selectedAvatar })
      updateUser(updatedUser)
      setEditing(false)
    } catch (err) {
      setError('更新失败，请重试')
      console.error('更新用户信息错误:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-warm-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/spaces')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 返回
              </button>
              <h1 className="text-xl font-bold text-warm-600">个人资料</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <img
                src={selectedAvatar}
                alt="用户头像"
                className="w-32 h-32 rounded-full object-cover border-4 border-warm-100"
              />
              {editing && (
                <div className="absolute bottom-0 right-0 bg-warm-500 text-white rounded-full p-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-4">{user.nickname}</h2>
            <p className="text-gray-500 text-sm">账号: {user.device_id}</p>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  昵称
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择头像
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {defaultAvatars.map((avatar, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer rounded-full overflow-hidden border-2 ${selectedAvatar === avatar ? 'border-warm-500' : 'border-gray-200'}`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <img src={avatar} alt={`头像 ${index + 1}`} className="w-12 h-12 object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setNickname(user.nickname)
                    setSelectedAvatar(user.avatar || defaultAvatars[0])
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors disabled:bg-warm-400 disabled:cursor-not-allowed"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                <span className="text-gray-600">昵称</span>
                <span className="font-medium">{user.nickname}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                <span className="text-gray-600">账号</span>
                <span className="font-medium">{user.device_id}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                <span className="text-gray-600">注册时间</span>
                <span className="font-medium">{new Date(user.created_at).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors"
              >
                编辑资料
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
