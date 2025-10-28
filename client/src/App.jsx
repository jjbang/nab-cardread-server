import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

function App() {
  const [cardNumber, setCardNumber] = useState('')

  useEffect(() => {
    // Always use port 4014 for Socket.IO
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const socketUrl = `${protocol}//${hostname}:4014`
    const socket = io(socketUrl)

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server')
    })

    socket.on('cardData', (data) => {
      console.log('Received card data:', data)
      setCardNumber(data.cardData)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div>
      <h1>Card Number: {cardNumber}</h1>
    </div>
  )
}

export default App
