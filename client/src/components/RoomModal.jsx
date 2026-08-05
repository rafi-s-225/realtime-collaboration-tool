import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { X, FileText, Palette, ArrowRight, Sparkles } from 'lucide-react'
import './RoomModal.css'

export default function RoomModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [roomType, setRoomType] = useState('doc') // 'doc' or 'board'
  const [title, setTitle] = useState('')
  const [joinId, setJoinId] = useState('')
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'join'

  if (!isOpen) return null

  const handleCreate = (e) => {
    e.preventDefault()
    const newId = uuidv4()
    const path = roomType === 'board' ? `/board/${newId}` : `/docs/${newId}`
    onClose()
    navigate(path, { state: { initialTitle: title.trim() || 'Untitled Workspace' } })
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (!joinId.trim()) return
    const id = joinId.trim()
    onClose()
    if (id.startsWith('board-')) {
      navigate(`/board/${id}`)
    } else {
      navigate(`/docs/${id}`)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={20} className="modal-icon" />
            <h2>Workspace Room Studio</h2>
          </div>
          <button className="btn-icon modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create New Room
          </button>
          <button
            className={`modal-tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Existing Room
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group">
              <label>Select Room Mode</label>
              <div className="type-selector">
                <div
                  className={`type-card ${roomType === 'doc' ? 'selected' : ''}`}
                  onClick={() => setRoomType('doc')}
                >
                  <div className="type-icon doc">
                    <FileText size={24} />
                  </div>
                  <div className="type-info">
                    <h4>Document Editor</h4>
                    <p>Real-time collaborative Markdown & rich text editing</p>
                  </div>
                </div>

                <div
                  className={`type-card ${roomType === 'board' ? 'selected' : ''}`}
                  onClick={() => setRoomType('board')}
                >
                  <div className="type-icon board">
                    <Palette size={24} />
                  </div>
                  <div className="type-info">
                    <h4>Whiteboard Canvas</h4>
                    <p>Real-time collaborative vector drawing & sketch board</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Workspace Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Brainstorming Notes, System Architecture..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <span>Launch {roomType === 'board' ? 'Whiteboard' : 'Document'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="modal-form">
            <div className="form-group">
              <label>Enter Room ID or URL</label>
              <input
                type="text"
                placeholder="Paste Room ID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="modal-input"
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <span>Join Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
