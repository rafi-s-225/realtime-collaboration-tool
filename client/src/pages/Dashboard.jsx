import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  FileText, 
  Palette, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  Filter
} from 'lucide-react'
import RoomModal from '../components/RoomModal'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'doc', 'board'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRooms(data)
      })
      .catch(() => {
        // Mock fallback
        setRooms([
          { _id: 'doc-sample-101', title: 'Sprint Roadmap & Specifications', type: 'doc', updatedAt: new Date() },
          { _id: 'board-sample-202', title: 'UX/UI Brainstorming Whiteboard', type: 'board', updatedAt: new Date() },
          { _id: 'doc-sample-102', title: 'API Architecture & Database Schema', type: 'doc', updatedAt: new Date() }
        ])
      })
  }, [])

  const copyLink = (id, e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/${id.includes('board') ? 'board' : 'docs'}/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase()) || r._id.includes(search)
    const matchesType = filterType === 'all' || r.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title-group">
            <LayoutDashboard size={24} className="dash-icon" />
            <h1>Workspace Dashboard</h1>
          </div>
          <p className="dash-subtitle">Manage and access all your active document rooms and collaborative whiteboards.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="dashboard-controls glass-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search workspaces by title or Room ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Workspaces ({rooms.length})
          </button>
          <button
            className={`filter-btn ${filterType === 'doc' ? 'active' : ''}`}
            onClick={() => setFilterType('doc')}
          >
            <FileText size={14} />
            Docs ({rooms.filter(r => r.type === 'doc').length})
          </button>
          <button
            className={`filter-btn ${filterType === 'board' ? 'active' : ''}`}
            onClick={() => setFilterType('board')}
          >
            <Palette size={14} />
            Whiteboards ({rooms.filter(r => r.type === 'board').length})
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="empty-dashboard glass-panel">
          <Sparkles size={40} className="empty-sparkle" />
          <h3>No Workspaces Found</h3>
          <p>Create a new document or whiteboard canvas to get started!</p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Create Workspace</span>
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className="room-card glass-card"
              onClick={() => navigate(room.type === 'board' ? `/board/${room._id}` : `/docs/${room._id}`)}
            >
              <div className="room-card-header">
                <span className={`badge ${room.type === 'board' ? 'badge-board' : 'badge-doc'}`}>
                  {room.type === 'board' ? <Palette size={12} /> : <FileText size={12} />}
                  {room.type === 'board' ? 'Whiteboard' : 'Document'}
                </span>
                <button 
                  className="card-copy-btn" 
                  onClick={(e) => copyLink(room._id, e)}
                  title="Copy Room URL"
                >
                  {copiedId === room._id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <h3 className="room-card-title">{room.title || 'Untitled Workspace'}</h3>

              <div className="room-card-footer">
                <span className="room-id-chip">ID: {room._id.substring(0, 10)}...</span>
                <button className="open-btn">
                  <span>Open</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
