import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { RoomProvider, useRoom } from './context/RoomContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import DocumentEditor from './pages/DocumentEditor'
import Whiteboard from './pages/Whiteboard'
import About from './pages/About'

function AppContent() {
  const { roomMeta } = useRoom()

  return (
    <div className="app-container">
      <Navbar 
        connected={roomMeta.connected} 
        users={roomMeta.users} 
        activeRoomTitle={roomMeta.activeRoomTitle} 
        roomType={roomMeta.roomType}
        onToggleChat={roomMeta.onToggleChat}
        unreadCount={roomMeta.unreadCount}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/docs/:id" element={<DocumentEditor />} />
        <Route path="/board/:id" element={<Whiteboard />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </Router>
  )
}

export default App