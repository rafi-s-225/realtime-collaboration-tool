import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import MDEditor from '@uiw/react-md-editor'
import './Editor.css'

const SAVE_INTERVAL = 2000
const SOCKET_SERVER = 'http://localhost:5000'

export default function Editor() {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState(null)
  const [value, setValue] = useState('')
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [username] = useState(() => `User${Math.floor(Math.random() * 1000)}`)

  // Connect to socket
  useEffect(() => {
    const s = io(SOCKET_SERVER)
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    setSocket(s)
    return () => s.disconnect()
  }, [])

  // Join room and load document
  useEffect(() => {
    if (!socket) return
    socket.emit('join-room', documentId, username)
    socket.on('load-document', (content) => setValue(content || ''))
    socket.on('room-users', (userList) => setUsers(userList))
  }, [socket, documentId, username])

  // Receive changes from other users
  useEffect(() => {
    if (!socket) return
    const handler = (content) => setValue(content)
    socket.on('receive-changes', handler)
    return () => socket.off('receive-changes', handler)
  }, [socket])

  // Send changes to other users
  const handleChange = (content) => {
    setValue(content)
    if (!socket) return
    socket.emit('send-changes', content, documentId)
  }

  // Auto-save every 2 seconds
  useEffect(() => {
    if (!socket) return
    const interval = setInterval(() => {
      socket.emit('save-document', documentId, value)
    }, SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [socket, value, documentId])

  // Copy room link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="editor-page">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <h2>📝 Realtime Collaboration Tool</h2>
          <span className={`status-badge ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div className="header-right">
          <div className="users-list">
            {users.map((u) => (
              <span key={u.id} className="user-badge">
                👤 {u.username}
              </span>
            ))}
          </div>
          <button className="copy-btn" onClick={copyLink}>
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      </div>

      {/* Room ID bar */}
      <div className="room-bar">
        <span>🏠 Room: <strong>{documentId}</strong></span>
        <span className="users-count">👥 {users.length} user{users.length !== 1 ? 's' : ''} online</span>
      </div>

      {/* Editor */}
      <div className="editor-wrapper" data-color-mode="light">
        <MDEditor
          value={value}
          onChange={handleChange}
          height={500}
          preview="edit"
        />
      </div>
    </div>
  )
}