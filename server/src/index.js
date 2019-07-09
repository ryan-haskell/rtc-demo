const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const { RTCPeerConnection } = require('wrtc')

// Configuration options
const config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT) || 3000,
  rtc: {
    connection: {
      sdpSemantics: 'unified-plan'
    },
    channel: {
      ordered: false,
      maxRetransmits: 0
    }
  }
}

const connections = {}

// WebRTC Stuff
const WebRTC = {
  onOfferCreated: ({ description }) => {
    const connection = new RTCPeerConnection(config.rtc.connection)
    connection.createDataChannel('dc', config.rtc.channel)
    connection.setRemoteDescription(description)
    return connection
  },
  createAnswer: (connection) =>
    new Promise((resolve, reject) =>
      connection.createAnswer(resolve, reject)
    ),
  onIceCandidate: ({ connection, candidate }) =>
    new Promise((resolve, reject) =>
      connection.addIceCandidate(candidate, resolve, reject)
    )
}

// Express web server
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

io.on('connection', (socket) => {
  const { id } = socket

  socket.on('offer-created', (description) => {
    Promise.resolve(WebRTC.onOfferCreated({ description }))
      .then(conn => {
        connections[id] = conn
        console.log('connected:', Object.keys(connections))
        return conn
      })
      .then(WebRTC.createAnswer)
      .then(answer => socket.emit('answer', answer))
      .catch(console.error)
  })

  socket.on('ice-candidate', (candidate) =>
    WebRTC.onIceCandidate({ connection: connections[id], candidate })
      .catch(console.error)
  )

  socket.on('disconnect', _ => {
    delete connections[id]
    console.log('connected:', Object.keys(connections))
  })
})

const url = `http://${config.host}:${config.port}`
server.listen(config.port, config.host, _ =>
  console.info(`Ready at ${url}`)
)
