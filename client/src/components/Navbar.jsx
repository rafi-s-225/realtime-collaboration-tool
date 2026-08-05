import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sparkles, 
  FileText, 
  Palette, 
  LayoutDashboard, 
  Info, 
  Plus, 
  Copy, 
  Check, 
  Radio, 
  Home,
  MessageSquare
} from 'lucide-react'
import './Navbar.css'

export default function Navbar({ connected, users = [], activeRoomTitle, roomType, onToggleChat, unreadCount = 0 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const isRoomPage = location.pathname.startsWith('/docs/') || location.pathname.startsWith('/board/')

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createNewDoc = () => {
    const newId = uuidv4()
    navigate(`/docs/${newId}`)
  }

  const createNewBoard = () => {
    const newId = uuidv4()
    navigate(`/board/${newId}`)
  }

  return (
    <header className="navbar-container">
      <div className="navbar-wrapper glass-card">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Sparkles size={20} className="sparkle-svg" />
          </div>
          <div className="brand-text">
            <span className="brand-title">SyncCraft</span>
            <span className="brand-tag">Realtime Collab</span>
          </div>
        </Link>

        {/* Center Nav Items */}
        <nav className="navbar-links">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Home size={16} />
            <span>Home</span>
          </Link>

          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link to="/about" className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
            <Info size={16} />
            <span>About</span>
          </Link>
        </nav>

        {/* Active Room Title or Quick Actions */}
        {isRoomPage ? (
          <div className="navbar-room-info">
            <div className="room-meta">
              <span className={`badge ${roomType === 'board' ? 'badge-board' : 'badge-doc'}`}>
                {roomType === 'board' ? <Palette size={12} /> : <FileText size={12} />}
                {roomType === 'board' ? 'Whiteboard' : 'Document'}
              </span>
              <span className="room-title-text">{activeRoomTitle || 'Collaborative Room'}</span>
            </div>

            <div className="users-avatars">
              {users.slice(0, 4).map((u) => (
                <div 
                  key={u.id} 
                  className="user-avatar-chip" 
                  style={{ backgroundColor: u.color || '#6366f1' }}
                  title={u.username}
                >
                  {u.username.substring(0, 2).toUpperCase()}
                </div>
              ))}
              {users.length > 4 && (
                <div className="user-avatar-more">+{users.length - 4}</div>
              )}
            </div>

            <button className="copy-link-btn" onClick={copyRoomLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {onToggleChat && (
              <button className="chat-toggle-btn" onClick={onToggleChat}>
                <MessageSquare size={16} />
                {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
              </button>
            )}
          </div>
        ) : (
          <div className="navbar-actions">
            <button className="btn-secondary" onClick={createNewDoc}>
              <FileText size={16} />
              <span>New Doc</span>
            </button>
            <button className="btn-primary" onClick={createNewBoard}>
              <Palette size={16} />
              <span>New Canvas</span>
            </button>
          </div>
        )}

        {/* Status Indicator */}
        <div className="navbar-status">
          <span className={`status-pill ${connected ? 'connected' : 'offline'}`}>
            <Radio size={12} />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
