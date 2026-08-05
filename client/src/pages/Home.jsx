import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sparkles, 
  FileText, 
  Palette, 
  ArrowRight, 
  Zap, 
  Users, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import RoomModal from '../components/RoomModal'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [recentRooms, setRecentRooms] = useState([])

  useEffect(() => {
    // Fetch recent active rooms from server API
    fetch('http://localhost:5000/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentRooms(data.slice(0, 6))
      })
      .catch(() => {
        // Fallback mock rooms if server isn't reached yet
        setRecentRooms([
          { _id: 'demo-doc-1', title: 'Product Architecture Specs', type: 'doc', updatedAt: new Date() },
          { _id: 'demo-board-1', title: 'Sprint 24 Whiteboard Canvas', type: 'board', updatedAt: new Date() }
        ])
      })
  }, [])

  const handleQuickJoin = (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const code = joinCode.trim()
    if (code.includes('board') || code.length > 20) {
      navigate(`/board/${code}`)
    } else {
      navigate(`/docs/${code}`)
    }
  }

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section glass-panel">
        <div className="hero-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Realtime Collaboration Suite v2.0</span>
        </div>

        <h1 className="hero-title">
          Collaborate in Real-Time with <br />
          <span className="hero-gradient">Docs & Interactive Whiteboards</span>
        </h1>

        <p className="hero-subtitle">
          SyncCraft combines seamless Markdown document editing with a powerful multiplayer whiteboard canvas. 
          Share instant room links, draw ideas, write specs, and chat live with your team.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary hero-btn" onClick={() => setIsModalOpen(true)}>
            <Sparkles size={18} />
            <span>Create New Workspace</span>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn-secondary hero-btn"
            onClick={() => navigate(`/docs/${uuidv4()}`)}
          >
            <FileText size={18} />
            <span>Quick Markdown Doc</span>
          </button>

          <button 
            className="btn-secondary hero-btn canvas-cta"
            onClick={() => navigate(`/board/${uuidv4()}`)}
          >
            <Palette size={18} />
            <span>Quick Whiteboard</span>
          </button>
        </div>

        {/* Quick Join Bar */}
        <div className="quick-join-box glass-card">
          <span className="join-label">Already have a Room ID?</span>
          <form onSubmit={handleQuickJoin} className="join-form">
            <input
              type="text"
              placeholder="Paste Room ID here..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="join-input"
            />
            <button type="submit" className="btn-primary join-btn">
              <span>Join Room</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need for Remote Team Sync</h2>
          <p className="section-desc">Designed for high performance, modern design aesthetics, and fluid multiplayer interaction.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper purple">
              <FileText size={24} />
            </div>
            <h3>Realtime Markdown Studio</h3>
            <p>Write specs, documentation, and notes in clean Markdown with instant side-by-side rendering and auto-save.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper cyan">
              <Palette size={24} />
            </div>
            <h3>Collaborative Whiteboard</h3>
            <p>Freehand draw, render geometric shapes, select custom colors, and view co-workers' live mouse cursors in real-time.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper pink">
              <MessageSquare size={24} />
            </div>
            <h3>Instant Room Chat</h3>
            <p>Integrated side-drawer chat lets collaborators communicate seamlessly without leaving their document or whiteboard canvas.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper emerald">
              <Zap size={24} />
            </div>
            <h3>WebSocket Performance</h3>
            <p>Powered by Socket.IO for sub-millisecond bidirectional synchronization across all connected team members.</p>
          </div>
        </div>
      </section>

      {/* Recent Workspaces Preview */}
      {recentRooms.length > 0 && (
        <section className="recent-section">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Active Workspaces</h2>
              <p className="section-desc">Jump right back into recent document rooms or canvas whiteboards.</p>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              <span>View All Workspaces</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="recent-grid">
            {recentRooms.map((room) => (
              <div 
                key={room._id} 
                className="recent-card glass-card"
                onClick={() => navigate(room.type === 'board' ? `/board/${room._id}` : `/docs/${room._id}`)}
              >
                <div className="card-top">
                  <span className={`badge ${room.type === 'board' ? 'badge-board' : 'badge-doc'}`}>
                    {room.type === 'board' ? <Palette size={12} /> : <FileText size={12} />}
                    {room.type === 'board' ? 'Whiteboard' : 'Document'}
                  </span>
                  <ExternalLink size={14} className="card-arrow" />
                </div>
                <h4 className="card-title">{room.title || 'Untitled Workspace'}</h4>
                <div className="card-meta">
                  <span>Room ID: {room._id.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      <RoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
