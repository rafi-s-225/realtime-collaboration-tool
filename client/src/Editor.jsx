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

  // Connect to socket
  useEffect(() => {
    const s = io(SOCKET_SERVER)
    setSocket(s)
    return () => s.disconnect()
  }, [])

  // Join room and load document
  useEffect(() => {
    if (!socket) return
    socket.emit('join-room', documentId)
    socket.on('load-document', (content) => {
      setValue(content || '')
    })
  }, [socket, documentId])

  // Receive changes from other users
  useEffect(() => {
    if (!socket) return
   const handler = (content) => {
      console.log('Received changes from another user')
      setValue(content)
    }
    socket.on('receive-changes', handler)
    return () => socket.off('receive-changes', handler)
  }, [socket])

  // Send changes to other users
const handleChange = (content) => {
    setValue(content)
    if (!socket) return
    console.log('Sending changes for room:', documentId)
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

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>📝 Realtime Collaboration Tool</h2>
        <span className="room-id">Room ID: {documentId}</span>
      </div>
      <div data-color-mode="light" className="editor-wrapper">
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