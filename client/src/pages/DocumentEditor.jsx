import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import MDEditor from '@uiw/react-md-editor'
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Eye, 
  Edit3, 
  Sparkles, 
  Clock, 
  Hash,
  Users
} from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import ChatDrawer from '../components/ChatDrawer'
import './DocumentEditor.css'

const SOCKET_SERVER = 'http://localhost:5000'

export default function DocumentEditor() {
  const { id: documentId } = useParams()
  const location = useLocation()
  const { setRoomMeta } = useRoom()
  
  const [socket, setSocket] = useState(null)
  const [title, setTitle] = useState(location.state?.initialTitle || 'Untitled Document')
  const [value, setValue] = useState('')
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewMode, setPreviewMode] = useState('live')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadChat, setUnreadChat] = useState(0)

  const [username] = useState(() => `User_${Math.floor(1000 + Math.random() * 9000)}`)

  // Sync RoomMeta with Context for Navbar
  useEffect(() => {
    setRoomMeta({
      connected,
      users,
      activeRoomTitle: title,
      roomType: 'doc',
      onToggleChat: () => {
        setIsChatOpen((prev) => !prev)
        setUnreadChat(0)
      },
      unreadCount: unreadChat
    })
  }, [connected, users, title, unreadChat, setRoomMeta])

  // Socket Connection
  useEffect(() => {
    const s = io(SOCKET_SERVER)
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    setSocket(s)
    return () => s.disconnect()
  }, [])

  // Join Room & Load Data
  useEffect(() => {
    if (!socket) return
    socket.emit('join-room', { roomId: documentId, username, roomType: 'doc', roomTitle: title })
    
    socket.on('load-room', (room) => {
      setValue(room.content || '')
      if (room.title) setTitle(room.title)
    })

    socket.on('room-users', (userList) => setUsers(userList))
    socket.on('title-updated', (newTitle) => setTitle(newTitle))
    socket.on('receive-chat', () => {
      if (!isChatOpen) setUnreadChat((prev) => prev + 1)
    })
  }, [socket, documentId, username, isChatOpen])

  // Receive text changes
  useEffect(() => {
    if (!socket) return
    const handler = (content) => setValue(content)
    socket.on('receive-changes', handler)
    return () => socket.off('receive-changes', handler)
  }, [socket])

  const handleChange = (content) => {
    const text = content || ''
    setValue(text)
    if (!socket) return
    socket.emit('send-changes', { content: text, roomId: documentId })
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!socket) return
    socket.emit('update-title', { title: newTitle, roomId: documentId })
  }

  const exportDocument = (format = 'md') => {
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyRawContent = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const charCount = value.length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="editor-page-container">
      <main className="main-content animate-fade-in">
        <div className="doc-studio glass-panel">
          {/* Top Control Bar */}
          <div className="studio-topbar">
            <div className="title-edit-wrapper">
              <FileText size={20} className="title-icon" />
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Document Title..."
                className="document-title-input"
              />
            </div>

            <div className="studio-actions">
              <div className="mode-switcher">
                <button
                  className={`mode-btn ${previewMode === 'edit' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('edit')}
                  title="Editor Only"
                >
                  <Edit3 size={15} />
                  <span>Edit</span>
                </button>
                <button
                  className={`mode-btn ${previewMode === 'live' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('live')}
                  title="Split View"
                >
                  <Sparkles size={15} />
                  <span>Split</span>
                </button>
                <button
                  className={`mode-btn ${previewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('preview')}
                  title="Preview Only"
                >
                  <Eye size={15} />
                  <span>Preview</span>
                </button>
              </div>

              <button className="btn-secondary action-sm" onClick={copyRawContent}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <div className="dropdown-export">
                <button className="btn-primary action-sm" onClick={() => exportDocument('md')}>
                  <Download size={14} />
                  <span>Export .md</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Sub-Bar */}
          <div className="doc-stats-bar">
            <div className="stat-item">
              <Hash size={14} />
              <span>{wordCount} words</span>
            </div>
            <div className="stat-item">
              <span>{charCount} characters</span>
            </div>
            <div className="stat-item">
              <Clock size={14} />
              <span>~{readingTime} min read</span>
            </div>
            <div className="stat-item users-online">
              <Users size={14} />
              <span>{users.length} collaborator{users.length !== 1 ? 's' : ''} online</span>
            </div>
          </div>

          {/* Editor Core */}
          <div className="editor-wrapper dark-editor" data-color-mode="dark">
            <MDEditor
              value={value}
              onChange={handleChange}
              height={640}
              preview={previewMode}
              visibleDragbar={false}
            />
          </div>
        </div>
      </main>

      <ChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        socket={socket} 
        roomId={documentId} 
      />
    </div>
  )
}
