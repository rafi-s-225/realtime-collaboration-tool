import React, { useEffect, useRef, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { 
  Pencil, 
  Minus, 
  Square, 
  Circle, 
  Eraser, 
  Type, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Download, 
  Grid, 
  Palette,
  Users
} from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import ChatDrawer from '../components/ChatDrawer'
import './Whiteboard.css'

const SOCKET_SERVER = 'http://localhost:5000'

const COLOR_PRESETS = [
  '#ffffff',
  '#f87171',
  '#f59e0b',
  '#34d399',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6'
]

export default function Whiteboard() {
  const { id: boardId } = useParams()
  const location = useLocation()
  const { setRoomMeta } = useRoom()

  const [socket, setSocket] = useState(null)
  const [title, setTitle] = useState(location.state?.initialTitle || 'Untitled Whiteboard')
  const [users, setUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadChat, setUnreadChat] = useState(0)

  // Drawing tools state
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#818cf8')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [showGrid, setShowGrid] = useState(true)
  const [isFilled, setIsFilled] = useState(false)

  // Canvas elements state stack
  const [elements, setElements] = useState([])
  const [history, setHistory] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})

  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const currentElement = useRef(null)
  const [username] = useState(() => `Artist_${Math.floor(1000 + Math.random() * 9000)}`)

  // Sync RoomMeta with Context
  useEffect(() => {
    setRoomMeta({
      connected,
      users,
      activeRoomTitle: title,
      roomType: 'board',
      onToggleChat: () => {
        setIsChatOpen((prev) => !prev)
        setUnreadChat(0)
      },
      unreadCount: unreadChat
    })
  }, [connected, users, title, unreadChat, setRoomMeta])

  // Connect socket
  useEffect(() => {
    const s = io(SOCKET_SERVER)
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    setSocket(s)
    return () => s.disconnect()
  }, [])

  // Join Room & Socket Handlers
  useEffect(() => {
    if (!socket) return
    socket.emit('join-room', { roomId: boardId, username, roomType: 'board', roomTitle: title })

    socket.on('load-room', (room) => {
      if (room.title) setTitle(room.title)
      if (Array.isArray(room.boardData)) setElements(room.boardData)
    })

    socket.on('room-users', (userList) => setUsers(userList))
    socket.on('title-updated', (newTitle) => setTitle(newTitle))
    socket.on('receive-stroke', (stroke) => {
      setElements((prev) => [...prev, stroke])
    })
    socket.on('receive-board-data', (data) => {
      setElements(data)
    })
    socket.on('canvas-cleared', () => {
      setElements([])
    })
    socket.on('user-cursor-moved', (cursor) => {
      setRemoteCursors((prev) => ({ ...prev, [cursor.id]: cursor }))
    })
    socket.on('user-left', (userId) => {
      setRemoteCursors((prev) => {
        const copy = { ...prev }
        delete copy[userId]
        return copy
      })
    })
    socket.on('receive-chat', () => {
      if (!isChatOpen) setUnreadChat((prev) => prev + 1)
    })
  }, [socket, boardId, username, isChatOpen])

  // Redraw Canvas whenever elements change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    elements.forEach((el) => drawElement(ctx, el))
  }, [elements])

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
        const ctx = canvas.getContext('2d')
        elements.forEach((el) => drawElement(ctx, el))
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [elements])

  const drawElement = (ctx, el) => {
    ctx.beginPath()
    ctx.strokeStyle = el.color
    ctx.fillStyle = el.color
    ctx.lineWidth = el.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (el.tool === 'pencil' || el.tool === 'eraser') {
      if (el.tool === 'eraser') ctx.strokeStyle = '#0f172a'
      if (!el.points || el.points.length === 0) return
      ctx.moveTo(el.points[0].x, el.points[0].y)
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y)
      }
      ctx.stroke()
    } else if (el.tool === 'line') {
      ctx.moveTo(el.startX, el.startY)
      ctx.lineTo(el.endX, el.endY)
      ctx.stroke()
    } else if (el.tool === 'rect') {
      const width = el.endX - el.startX
      const height = el.endY - el.startY
      if (el.isFilled) {
        ctx.fillRect(el.startX, el.startY, width, height)
      } else {
        ctx.strokeRect(el.startX, el.startY, width, height)
      }
    } else if (el.tool === 'circle') {
      const radius = Math.hypot(el.endX - el.startX, el.endY - el.startY)
      ctx.beginPath()
      ctx.arc(el.startX, el.startY, radius, 0, Math.PI * 2)
      if (el.isFilled) {
        ctx.fill()
      } else {
        ctx.stroke()
      }
    } else if (el.tool === 'text') {
      ctx.font = `${el.strokeWidth * 4 + 14}px Plus Jakarta Sans, sans-serif`
      ctx.fillText(el.text || '', el.startX, el.startY)
    }
  }

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    isDrawing.current = true

    if (tool === 'text') {
      const textPrompt = prompt('Enter text to place on canvas:')
      if (textPrompt) {
        const newEl = {
          tool: 'text',
          startX: x,
          startY: y,
          text: textPrompt,
          color,
          strokeWidth,
        }
        const updated = [...elements, newEl]
        setElements(updated)
        if (socket) {
          socket.emit('draw-stroke', { stroke: newEl, roomId: boardId })
          socket.emit('sync-board-data', { boardData: updated, roomId: boardId })
        }
      }
      isDrawing.current = false
      return
    }

    currentElement.current = {
      tool,
      color,
      strokeWidth,
      isFilled,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      points: [{ x, y }],
    }
  }

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (socket) {
      socket.emit('cursor-move', { x, y, roomId: boardId })
    }

    if (!isDrawing.current || !currentElement.current) return

    if (tool === 'pencil' || tool === 'eraser') {
      currentElement.current.points.push({ x, y })
    } else {
      currentElement.current.endX = x
      currentElement.current.endY = y
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    elements.forEach((el) => drawElement(ctx, el))
    drawElement(ctx, currentElement.current)
  }

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentElement.current) return
    isDrawing.current = false

    const newEl = { ...currentElement.current }
    const updated = [...elements, newEl]
    setElements(updated)
    currentElement.current = null

    if (socket) {
      socket.emit('draw-stroke', { stroke: newEl, roomId: boardId })
      socket.emit('sync-board-data', { boardData: updated, roomId: boardId })
    }
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (socket) socket.emit('update-title', { title: newTitle, roomId: boardId })
  }

  const handleUndo = () => {
    if (elements.length === 0) return
    const last = elements[elements.length - 1]
    const updated = elements.slice(0, elements.length - 1)
    setHistory([...history, last])
    setElements(updated)
    if (socket) socket.emit('sync-board-data', { boardData: updated, roomId: boardId })
  }

  const handleRedo = () => {
    if (history.length === 0) return
    const next = history[history.length - 1]
    const updatedHistory = history.slice(0, history.length - 1)
    const updated = [...elements, next]
    setHistory(updatedHistory)
    setElements(updated)
    if (socket) socket.emit('sync-board-data', { boardData: updated, roomId: boardId })
  }

  const handleClear = () => {
    if (window.confirm('Clear the entire whiteboard canvas?')) {
      setElements([])
      setHistory([])
      if (socket) socket.emit('clear-canvas', boardId)
    }
  }

  const exportImage = () => {
    const canvas = canvasRef.current
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_board.png`
    link.click()
  }

  return (
    <div className="board-page-container">
      <main className="main-content animate-fade-in board-layout">
        <div className="board-studio glass-panel">
          {/* Top Bar */}
          <div className="board-topbar">
            <div className="title-edit-wrapper">
              <Palette size={20} className="board-icon" />
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Whiteboard Title..."
                className="document-title-input"
              />
            </div>

            <div className="board-top-actions">
              <button 
                className={`btn-icon ${showGrid ? 'active-tool' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Canvas Grid"
              >
                <Grid size={16} />
              </button>

              <button className="btn-icon" onClick={handleUndo} title="Undo">
                <RotateCcw size={16} />
              </button>

              <button className="btn-icon" onClick={handleRedo} title="Redo">
                <RotateCw size={16} />
              </button>

              <button className="btn-secondary action-sm danger-hover" onClick={handleClear} title="Clear Board">
                <Trash2 size={14} />
                <span>Clear</span>
              </button>

              <button className="btn-primary action-sm" onClick={exportImage}>
                <Download size={14} />
                <span>Export PNG</span>
              </button>
            </div>
          </div>

          {/* Floating Tools Toolbar */}
          <div className="tools-floating-bar glass-card">
            <div className="tool-section">
              <button 
                className={`tool-btn ${tool === 'pencil' ? 'selected' : ''}`}
                onClick={() => setTool('pencil')}
                title="Pencil / Freehand"
              >
                <Pencil size={18} />
              </button>

              <button 
                className={`tool-btn ${tool === 'line' ? 'selected' : ''}`}
                onClick={() => setTool('line')}
                title="Straight Line"
              >
                <Minus size={18} />
              </button>

              <button 
                className={`tool-btn ${tool === 'rect' ? 'selected' : ''}`}
                onClick={() => setTool('rect')}
                title="Rectangle"
              >
                <Square size={18} />
              </button>

              <button 
                className={`tool-btn ${tool === 'circle' ? 'selected' : ''}`}
                onClick={() => setTool('circle')}
                title="Circle / Ellipse"
              >
                <Circle size={18} />
              </button>

              <button 
                className={`tool-btn ${tool === 'text' ? 'selected' : ''}`}
                onClick={() => setTool('text')}
                title="Text Box"
              >
                <Type size={18} />
              </button>

              <button 
                className={`tool-btn ${tool === 'eraser' ? 'selected' : ''}`}
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                <Eraser size={18} />
              </button>
            </div>

            <div className="divider" />

            <div className="color-section">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'active-color' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="custom-color-picker"
                title="Custom Color"
              />
            </div>

            <div className="divider" />

            <div className="width-section">
              <span className="width-label">{strokeWidth}px</span>
              <input
                type="range"
                min="2"
                max="24"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="width-slider"
              />
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className={`canvas-viewport ${showGrid ? 'grid-bg' : 'plain-bg'}`}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="drawing-canvas"
            />

            {/* Remote Cursors */}
            {Object.values(remoteCursors).map((cur) => (
              <div
                key={cur.id}
                className="remote-cursor"
                style={{
                  left: cur.x,
                  top: cur.y,
                  borderColor: cur.color || '#ec4899',
                }}
              >
                <div 
                  className="cursor-badge"
                  style={{ backgroundColor: cur.color || '#ec4899' }}
                >
                  {cur.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <ChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        socket={socket} 
        roomId={boardId} 
      />
    </div>
  )
}
