import React, { createContext, useContext, useState } from 'react'

const RoomContext = createContext()

export function RoomProvider({ children }) {
  const [roomMeta, setRoomMeta] = useState({
    connected: false,
    users: [],
    activeRoomTitle: '',
    roomType: 'doc',
    onToggleChat: null,
    unreadCount: 0
  })

  return (
    <RoomContext.Provider value={{ roomMeta, setRoomMeta }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext)
