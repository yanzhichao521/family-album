import { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './components/Login'
import Register from './components/Register'
import Spaces from './components/Spaces'
import SpaceDetail from './components/SpaceDetail'
import UserProfile from './components/UserProfile'

import { authApi } from './services/api'

export type User = {
  id: number
  device_id: string
  nickname: string
  avatar: string | null
  created_at: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (device_id: string, nickname: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      authApi.getMe()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
    }
  }, [token])

  const login = async (device_id: string, nickname: string) => {
    try {
      const response = await authApi.login(device_id, nickname)
      const { user: userData, token: newToken } = response
      setUser(userData)
      setToken(newToken)
      localStorage.setItem('token', newToken)
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const authContextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/spaces" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/spaces" /> : <Register />} />
        <Route path="/spaces" element={token ? <Spaces /> : <Navigate to="/login" />} />
        <Route path="/space/:spaceId" element={token ? <SpaceDetail /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default App
