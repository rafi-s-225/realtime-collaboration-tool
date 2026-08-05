import React, { useState, useEffect, useRef } from 'react'
import { Send, X, MessageSquare, User } from 'lucide-react'
import './ChatDrawer.css'

export default function ChatDrawer({ isOpen, onClose, socket, roomId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!socket) return
    const handleChat = (msg) => {
      setMessages((prev) => [...prev, msg])
    }
    socket.on('receive-chat', handleChat)
    return () => socket.off('receive-chat', handleChat)
  }, [socket])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !socket) return
    socket.emit('send-chat', { message: input.trim(), roomId })
    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="chat-drawer glass-card animate-fade-in">
      <div className="chat-header">
        <div className="chat-title">
          <MessageSquare size={18} className="chat-icon" />
          <span>Room Chat</span>
          <span className="chat-count">({messages.length})</span>
        </div>
        <button className="btn-icon close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <User size={32} className="empty-icon" />
            <p>No messages yet. Say hello to your collaborators!</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="chat-msg">
              <div className="msg-header">
                <span className="msg-sender" style={{ color: m.color || '#6366f1' }}>
                  {m.sender}
                </span>
                <span className="msg-time">{m.time}</span>
              </div>
              <div className="msg-text">{m.text}</div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-footer" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
