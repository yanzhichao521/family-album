import { User } from '../App'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const request = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const baseUrl = API_BASE_URL || window.location.origin
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.error || '请求失败')
  }

  return response.json()
}

export interface LoginResponse {
  user: User
  token: string
}

export interface Space {
  id: number
  name: string
  invitation_code: string
  created_at: string
  member_count: number
}

export interface SpaceMember {
  id: number
  user_id: number
  nickname: string
  avatar: string | null
  is_admin: boolean
  joined_at: string
}

export interface FileItem {
  id: number
  space_id: number
  uploader_id: number
  uploader_nickname: string
  file_name: string
  file_size: number
  file_type: string
  file_path: string
  upload_time: string
  expiry_time: string
  is_deleted: boolean
  download_count: number
  is_downloaded: boolean
  likes: number
  comments: any[]
}

export const authApi = {
  login: async (device_id: string, nickname: string): Promise<LoginResponse> => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ device_id, nickname }),
    })
  },

  getMe: async (): Promise<User> => {
    return request('/api/auth/me')
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    return request('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

export const spaceApi = {
  create: async (name: string): Promise<Space> => {
    return request('/api/space/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  list: async (): Promise<Space[]> => {
    return request('/api/space/list')
  },

  join: async (invitation_code: string): Promise<Space> => {
    return request(`/api/space/join/${invitation_code}`, {
      method: 'POST',
    })
  },

  getMembers: async (space_id: number): Promise<SpaceMember[]> => {
    return request(`/api/space/${space_id}/members`)
  },
}

export const fileApi = {
  upload: async (space_id: number, file: globalThis.File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('space_id', space_id.toString())

    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const baseUrl = API_BASE_URL || window.location.origin
    const response = await fetch(`${baseUrl}/api/file/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.error || '上传失败')
    }

    return response.json()
  },

  list: async (space_id: number): Promise<FileItem[]> => {
    return request(`/api/file/list/${space_id}`)
  },

  download: async (file_id: number): Promise<{ file_path: string }> => {
    return request(`/api/file/download/${file_id}`, {
      method: 'POST',
    })
  },

  delete: async (file_ids: number[]): Promise<{ success: boolean }> => {
    return request('/api/file/delete', {
      method: 'DELETE',
      body: JSON.stringify({ file_ids }),
    })
  },
}
