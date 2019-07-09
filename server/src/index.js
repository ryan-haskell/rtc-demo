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

// WebRTC Stuff
const WebRTC = {
  onOfferCreated: ({ description }) => {
    let connection = new RTCPeerConnection(config.rtc.connection)
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
app.use(require('cors'))
const server = http.createServer(app)
const io = socketIo(server)

io.on('connection', (socket) => {
  let connection
  socket.on('offer-created', description => {
    Promise.resolve(WebRTC.onOfferCreated({ description }))
      .then(conn => (connection = conn))
      .then(WebRTC.createAnswer)
      .then(answer => socket.emit('answer', answer))
      .catch(console.error)
  })
  socket.on('ice-candidate', candidate =>
    WebRTC.onIceCandidate({ connection, candidate })
      .catch(console.error)
  )
  socket.on('disconnect', _ => console.log('disconnect'))
})

const url = `http://${config.host}:${config.port}`
server.listen(config.port, config.host, _ =>
  console.info(`Ready at ${url}`)
)
