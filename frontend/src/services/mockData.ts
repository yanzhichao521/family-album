// 模拟数据
import { User } from '../App'

const loadUserStorage = (): Record<string, User> => {
  try {
    const stored = localStorage.getItem('userStorage')
    return stored ? JSON.parse(stored) : {
      '13800138000': {
        id: 1,
        device_id: '13800138000',
        nickname: '家庭成员',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mom&backgroundColor=ffe4e1',
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('加载用户存储失败:', error)
    return {
      '13800138000': {
        id: 1,
        device_id: '13800138000',
        nickname: '家庭成员',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mom&backgroundColor=ffe4e1',
        created_at: new Date().toISOString()
      }
    }
  }
}

const saveUserStorage = (storage: Record<string, User>) => {
  try {
    localStorage.setItem('userStorage', JSON.stringify(storage))
  } catch (error) {
    console.error('保存用户存储失败:', error)
  }
}

export const userStorage: Record<string, User> = loadUserStorage()

let currentUser: User = userStorage['13800138000']

const loadSpaces = (): any[] => {
  try {
    const stored = localStorage.getItem('mockSpaces')
    const spaces = stored ? JSON.parse(stored) : []
    console.log('从本地存储加载的空间数据:', spaces)
    return spaces
  } catch (error) {
    console.error('加载空间数据失败:', error)
    return []
  }
}

const saveSpaces = (spaces: any[]) => {
  try {
    localStorage.setItem('mockSpaces', JSON.stringify(spaces))
    console.log('保存到本地存储的空间数据:', spaces)
  } catch (error) {
    console.error('保存空间数据失败:', error)
  }
}

export const mockSpaces: any[] = loadSpaces()
console.log('初始化的空间数据:', mockSpaces)

let mockFiles: any[] = []

export const mockMembers: any[] = [
  {
    id: 1,
    user_id: 1,
    nickname: '家庭成员',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mom&backgroundColor=ffe4e1',
    is_admin: true,
    joined_at: new Date().toISOString()
  }
]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockLogin = async (device_id: string, nickname: string) => {
  await delay(500)
  
  let existingUser = userStorage[device_id]
  
  if (existingUser) {
    currentUser = existingUser
  } else {
    currentUser = {
      id: Object.keys(userStorage).length + 1,
      device_id,
      nickname,
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=' + nickname + '&backgroundColor=e0f7fa',
      created_at: new Date().toISOString()
    }
    userStorage[device_id] = currentUser
    saveUserStorage(userStorage)
  }
  
  mockMembers[0] = {
    id: 1,
    user_id: currentUser.id,
    nickname: currentUser.nickname,
    avatar: currentUser.avatar,
    is_admin: true,
    joined_at: new Date().toISOString()
  }
  
  return {
    user: currentUser,
    token: 'mock-token'
  }
}

export const mockGetUser = async () => {
  await delay(300)
  return currentUser
}

export const mockUpdateUser = async (userData: Partial<User>) => {
  await delay(500)
  currentUser = {
    ...currentUser,
    ...userData
  }
  mockMembers[0] = {
    ...mockMembers[0],
    nickname: currentUser.nickname,
    avatar: currentUser.avatar
  }
  return currentUser
}

export const mockDeleteFiles = async (fileIds: number[]) => {
  await delay(500)
  mockFiles = mockFiles.filter(file => !fileIds.includes(file.id))
  return { success: true }
}

export const mockGetSpaces = async () => {
  await delay(300)
  const spaces = loadSpaces()
  console.log('从本地存储加载的空间列表:', spaces)
  return spaces
}

const generateInvitationCode = (): string => {
  let code: string
  let isUnique: boolean
  
  const spaces = loadSpaces()
  
  do {
    code = 'SPACE' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    isUnique = !spaces.some(space => space.invitation_code === code)
  } while (!isUnique)
  
  return code
}

export const mockCreateSpace = async (name: string) => {
  await delay(500)
  const uniqueId = Date.now()
  const newSpace = {
    id: uniqueId,
    name,
    invitation_code: generateInvitationCode(),
    created_at: new Date().toISOString(),
    member_count: 1
  }
  const spaces = loadSpaces()
  const spaceExists = spaces.some(space => space.id === uniqueId)
  if (!spaceExists) {
    spaces.push(newSpace)
    saveSpaces(spaces)
  }
  console.log('创建新空间:', newSpace)
  return newSpace
}

export const mockJoinSpace = async (invitation_code: string) => {
  await delay(500)
  const normalizedCode = invitation_code.trim().toUpperCase()
  console.log('寻找空间，邀请码:', normalizedCode)
  
  const spaces = loadSpaces()
  console.log('从本地存储加载的空间列表:', spaces)
  
  const space = spaces.find(s => s.invitation_code.toUpperCase() === normalizedCode)
  if (space) {
    space.member_count += 1
    saveSpaces(spaces)
    console.log('找到空间:', space)
    return space
  }
  console.log('未找到空间')
  throw new Error('空间不存在或邀请码无效')
}

export const mockGetMembers = async (_spaceId: number) => {
  await delay(300)
  return mockMembers
}

export const mockGetFiles = async (spaceId: number) => {
  await delay(300)
  return mockFiles.filter(f => f.space_id === spaceId)
}

export const mockUploadFile = async (spaceId: number, file: File) => {
  await delay(1000)
  const fileUrl = URL.createObjectURL(file)
  const newFile = {
    id: mockFiles.length + 1,
    space_id: spaceId,
    uploader_id: currentUser.id,
    uploader_nickname: currentUser.nickname,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type.startsWith('image') ? 'image' : 'video',
    file_path: fileUrl,
    upload_time: new Date().toISOString(),
    expiry_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_deleted: false,
    download_count: 0,
    is_downloaded: false,
    likes: 0,
    comments: []
  }
  mockFiles.push(newFile)
  return newFile
}

export const mockDownloadFile = async (fileId: number) => {
  await delay(500)
  const file = mockFiles.find(f => f.id === fileId)
  if (file) {
    file.download_count += 1
    file.is_downloaded = true
    return {
      file_path: file.file_path
    }
  }
  throw new Error('文件不存在或已删除')
}
