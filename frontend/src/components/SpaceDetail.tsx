import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

// 模拟数据
import { mockGetFiles, mockGetMembers, mockUploadFile, mockDownloadFile, mockDeleteFiles, mockGetSpaces } from '../services/mockData'

// 类型定义
type Comment = {
  id: number
  user_id: number
  user_nickname: string
  content: string
  created_at: string
}

type File = {
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
  comments: Comment[]
}

type SpaceMember = {
  id: number
  user_id: number
  nickname: string
  avatar: string | null
  is_admin: boolean
  joined_at: string
}

const SpaceDetail: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>()
  const [files, setFiles] = useState<File[]>([])
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showInvitationCode, setShowInvitationCode] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [currentSpace, setCurrentSpace] = useState<any>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  // 获取空间文件列表和空间信息
  useEffect(() => {
    if (spaceId) {
      const fetchFiles = async () => {
        try {
          const data = await mockGetFiles(parseInt(spaceId))
          setFiles(data)
          
          // 获取空间信息
          const spaces = await mockGetSpaces()
          console.log('获取到的空间列表:', spaces)
          console.log('当前空间ID:', spaceId)
          const space = spaces.find((s: any) => s.id === parseInt(spaceId))
          if (space) {
            console.log('找到的空间:', space)
            setCurrentSpace(space)
          } else {
            console.log('未找到空间，重新获取空间列表')
            // 再次尝试获取空间列表
            setTimeout(async () => {
              const spaces = await mockGetSpaces()
              console.log('再次获取到的空间列表:', spaces)
              const space = spaces.find((s: any) => s.id === parseInt(spaceId))
              if (space) {
                console.log('找到的空间:', space)
                setCurrentSpace(space)
              }
            }, 1000)
          }
        } catch (err) {
          console.error('获取文件列表失败:', err)
        } finally {
          setLoading(false)
        }
      }

      fetchFiles()
    }
  }, [spaceId])

  // 获取空间成员列表
  const fetchMembers = async () => {
    if (spaceId) {
      try {
        const data = await mockGetMembers(parseInt(spaceId))
        setMembers(data)
      } catch (err) {
        console.error('获取成员列表失败:', err)
      }
    }
  }

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const newFile = await mockUploadFile(parseInt(spaceId || '1'), file)
      setFiles([newFile, ...files])
    } catch (err) {
      console.error('上传文件失败:', err)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // 处理文件下载
  const handleFileDownload = async (file: File) => {
    try {
      const response = await mockDownloadFile(file.id)
      const fileUrl = response.file_path
      // 打开新窗口下载文件
      window.open(fileUrl, '_blank')
      
      // 更新文件下载状态
      setFiles(files.map(f => 
        f.id === file.id ? { ...f, is_downloaded: true, download_count: f.download_count + 1 } : f
      ))
    } catch (err: any) {
      console.error('下载文件失败:', err)
      alert(err.message || '下载失败，请重试')
    }
  }

  // 处理文件选择
  const handleFileSelect = (fileId: number) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId)
      } else {
        return [...prev, fileId]
      }
    })
  }

  // 全选文件
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(file => file.id))
    }
  }

  // 删除选中文件
  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return
    
    if (confirm('确定要删除选中的文件吗？')) {
      try {
        await mockDeleteFiles(selectedFiles)
        setFiles(files.filter(file => !selectedFiles.includes(file.id)))
        setSelectedFiles([])
        setSelectMode(false)
      } catch (err) {
        console.error('删除文件失败:', err)
        alert('删除失败，请重试')
      }
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 处理点赞
  const handleLike = (fileId: number) => {
    // 更新文件列表中的点赞数
    const updatedFiles = files.map(file => 
      file.id === fileId ? { ...file, likes: file.likes + 1 } : file
    )
    setFiles(updatedFiles)
    
    // 如果当前正在预览该文件，也更新预览中的点赞数
    if (selectedFile && selectedFile.id === fileId) {
      setSelectedFile({
        ...selectedFile,
        likes: selectedFile.likes + 1
      })
    }
  }

  // 处理评论
  const handleAddComment = (fileId: number, content: string) => {
    if (!content.trim()) return
    
    const newComment: Comment = {
      id: Date.now(),
      user_id: user?.id || 1,
      user_nickname: user?.nickname || '用户',
      content,
      created_at: new Date().toISOString()
    }
    
    // 更新文件列表中的评论
    const updatedFiles = files.map(file => 
      file.id === fileId ? { ...file, comments: [...file.comments, newComment] } : file
    )
    setFiles(updatedFiles)
    
    // 如果当前正在预览该文件，也更新预览中的评论
    if (selectedFile && selectedFile.id === fileId) {
      setSelectedFile({
        ...selectedFile,
        comments: [...selectedFile.comments, newComment]
      })
    }
  }

  // 按日期分组文件
  const groupFilesByDate = () => {
    const grouped: Record<string, File[]> = {}
    files.forEach(file => {
      const date = new Date(file.upload_time).toLocaleDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(file)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-warm-600">加载中...</div>
      </div>
    )
  }

  const groupedFiles = groupFilesByDate()

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
              <h1 className="text-xl font-bold text-warm-600">相册空间</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  fetchMembers()
                  setShowMembersModal(true)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                成员
              </button>
              <button
                onClick={() => {
                  console.log('点击邀请按钮')
                  console.log('当前 showInvitationCode 状态:', showInvitationCode)
                  console.log('当前 currentSpace:', currentSpace)
                  setShowInvitationCode(!showInvitationCode)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                邀请
              </button>
              {showInvitationCode && currentSpace && (
                <div className="absolute top-16 right-4 bg-white p-3 rounded-md shadow-lg border border-gray-200 z-10">
                  <p className="text-sm font-medium text-gray-700 mb-1">邀请码</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{currentSpace.invitation_code}</p>
                  <p className="text-xs text-gray-500 mt-2">请将邀请码分享给需要加入的成员</p>
                </div>
              )}
              {showInvitationCode && !currentSpace && (
                <div className="absolute top-16 right-4 bg-white p-3 rounded-md shadow-lg border border-gray-200 z-10">
                  <p className="text-sm font-medium text-gray-700 mb-1">邀请码</p>
                  <p className="text-sm text-gray-500">加载中...</p>
                </div>
              )}
              {selectMode ? (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {selectedFiles.length === files.length ? '取消全选' : '全选'}
                  </button>
                  <button
                    onClick={handleDeleteFiles}
                    disabled={selectedFiles.length === 0}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                  >
                    删除 ({selectedFiles.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false)
                      setSelectedFiles([])
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    选择
                  </button>
                  <label className="px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors cursor-pointer">
                    上传
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 上传状态 */}
        {uploading && (
          <div className="mb-6 p-3 bg-blue-50 text-blue-600 rounded-md">
            上传中...
          </div>
        )}

        {/* 文件列表 */}
        {files.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">空间内暂无文件</p>
            <label className="px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors cursor-pointer inline-block">
              上传文件
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFiles).map(([date, dateFiles]) => (
              <div key={date} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{date}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dateFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`bg-gray-50 rounded-lg overflow-hidden card-hover ${selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => {
                        if (selectMode) {
                          handleFileSelect(file.id)
                        } else {
                          setSelectedFile(file)
                          setShowPreviewModal(true)
                        }
                      }}
                    >
                      <div className="relative">
                        {selectMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleFileSelect(file.id)
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </div>
                        )}
                        {file.file_type === 'image' ? (
                          <img
                            src={file.file_path}
                            alt={file.file_name}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-40 bg-gray-200">
                            <video
                              src={file.file_path}
                              className="w-full h-full object-cover"
                              poster={`${file.file_path}#t=0.1`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <span className="text-white text-2xl">📹</span>
                            </div>
                          </div>
                        )}
                        {!selectMode && file.is_downloaded && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            已下载
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploader_nickname}
                        </p>
                        {!selectMode && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">
                                {formatFileSize(file.file_size)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFileDownload(file)
                                }}
                                className="text-xs text-warm-600 hover:text-warm-800"
                              >
                                下载
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLike(file.id)
                                }}
                                className="flex items-center text-xs text-gray-500 hover:text-warm-600"
                              >
                                👍 {file.likes}
                              </button>
                              <span className="text-xs text-gray-500">
                                💬 {file.comments.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成员列表模态框 */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">空间成员</h3>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <img
                    src={member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Family'}
                    alt={member.nickname}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{member.nickname}</p>
                    <p className="text-xs text-gray-500">
                      {member.is_admin ? '管理员' : '成员'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMembersModal(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 文件预览模态框 */}
      {showPreviewModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{selectedFile.file_name}</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="mb-4">
                {selectedFile.file_type === 'image' ? (
                  <img
                    src={selectedFile.file_path}
                    alt={selectedFile.file_name}
                    className="w-full max-h-96 object-contain"
                  />
                ) : (
                  <video
                    src={selectedFile.file_path}
                    className="w-full max-h-96 object-contain"
                    controls
                  />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">上传人:</span> {selectedFile.uploader_nickname}</p>
                <p><span className="font-medium">上传时间:</span> {new Date(selectedFile.upload_time).toLocaleString()}</p>
                <p><span className="font-medium">文件大小:</span> {formatFileSize(selectedFile.file_size)}</p>
                <p><span className="font-medium">下载次数:</span> {selectedFile.download_count}/{members.length}</p>
              </div>
              
              {/* 点赞和评论 */}
              <div className="mt-6 space-y-4">
                {/* 点赞按钮 */}
                <button
                  onClick={() => handleLike(selectedFile.id)}
                  className="flex items-center space-x-2 text-warm-600 hover:text-warm-800"
                >
                  <span className="text-xl">👍</span>
                  <span>{selectedFile.likes} 人点赞</span>
                </button>
                
                {/* 评论区 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">评论 ({selectedFile.comments.length})</h4>
                  
                  {/* 评论列表 */}
                  {selectedFile.comments.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selectedFile.comments.map(comment => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-800">{comment.user_nickname}</span>
                            <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">暂无评论</p>
                  )}
                  
                  {/* 评论输入框 */}
                  <div className="relative">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="写下你的评论..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(selectedFile.id, commentInput)
                              setCommentInput('')
                            }
                          }}
                        />
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          😊
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          handleAddComment(selectedFile.id, commentInput)
                          setCommentInput('')
                        }}
                        className="px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors"
                      >
                        发送
                      </button>
                    </div>
                    
                    {/* 表情选择器 */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-md shadow-lg p-3 z-10">
                        <div className="grid grid-cols-8 gap-2">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '🥵', '🤒', '🤕', '🤢'].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setCommentInput(commentInput + emoji)
                                setShowEmojiPicker(false)
                              }}
                              className="text-2xl hover:bg-gray-100 rounded-full p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleFileDownload(selectedFile)}
                  className="flex-1 px-4 py-2 bg-warm-500 text-white rounded-md hover:bg-warm-600 transition-colors"
                >
                  下载文件
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpaceDetail
