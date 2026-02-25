import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { spaceApi, Space as SpaceType } from '../services/api'

type Space = SpaceType

const Spaces: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await spaceApi.list()
        setSpaces(data)
      } catch (err) {
        console.error('获取空间列表失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [])

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newSpaceName) {
      setError('请输入空间名称')
      return
    }

    if (creating) return

    try {
      setCreating(true)
      const newSpace = await spaceApi.create(newSpaceName)
      const spaceExists = spaces.some(space => space.id === newSpace.id)
      if (!spaceExists) {
        setSpaces(prevSpaces => [newSpace, ...prevSpaces])
      }
      setShowCreateModal(false)
      setNewSpaceName('')
    } catch (err) {
      setError('创建空间失败，请重试')
      console.error('创建空间错误:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!invitationCode) {
      setError('请输入邀请码')
      return
    }

    try {
      setJoining(true)
      const joinedSpace = await spaceApi.join(invitationCode)
      const spaceExists = spaces.some(space => space.id === joinedSpace.id)
      if (!spaceExists) {
        setSpaces(prevSpaces => [joinedSpace, ...prevSpaces])
      } else {
        setSpaces(prevSpaces => 
          prevSpaces.map(space => 
            space.id === joinedSpace.id ? joinedSpace : space
          )
        )
      }
      setShowJoinModal(false)
      setInvitationCode('')
    } catch (err: any) {
      setError(err.message || '加入空间失败，请重试')
      console.error('加入空间错误:', err)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-warm-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-warm-600">FamilyAlbum</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Family&backgroundColor=ffe4e1'}
                  alt="用户头像"
                  className="w-8 h-8 rounded-full"
                />
                <span>{user?.nickname}</span>
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">我的相册空间</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors"
            >
              创建空间
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 border border-warm-500 text-warm-600 rounded-md hover:bg-warm-50 transition-colors"
            >
              加入空间
            </button>
          </div>
        </div>

        {spaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">您还没有加入任何相册空间</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors"
              >
                创建空间
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 border border-warm-500 text-warm-600 rounded-md hover:bg-warm-50 transition-colors"
              >
                加入空间
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-white rounded-lg shadow-sm p-6 card-hover cursor-pointer"
                onClick={() => navigate(`/space/${space.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{space.name}</h3>
                <p className="text-gray-500 text-sm">成员: {space.member_count}/10</p>
                <p className="text-gray-400 text-xs mt-4">创建于: {new Date(space.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">创建相册空间</h3>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label htmlFor="spaceName" className="block text-sm font-medium text-gray-700 mb-1">
                  空间名称
                </label>
                <input
                  type="text"
                  id="spaceName"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="请输入空间名称"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors disabled:bg-warm-400 disabled:cursor-not-allowed"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">加入相册空间</h3>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleJoinSpace} className="space-y-4">
              <div>
                <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-1">
                  邀请码
                </label>
                <input
                  type="text"
                  id="invitationCode"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="请输入邀请码"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors disabled:bg-warm-400 disabled:cursor-not-allowed"
                >
                  {joining ? '加入中...' : '加入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Spaces
