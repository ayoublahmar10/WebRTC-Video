const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require('path')

const DIST_DIR = path.join(__dirname, '../dist')
const HTML_FILE = path.join(DIST_DIR, 'index.html')

const mockResponse = {
    foo: 'bar',
    bar: 'foo',
}

const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

app.get('/api', (req, res) => {
    res.send(mockResponse)
})
app.get('/', (req, res) => {
    res.sendFile(HTML_FILE)
})
app.use(express.static(DIST_DIR))
const peers = []

io.on('connection', (socket) => {
    console.log('a user connected with id ' + socket.id)

    let peer = {
        peerId: socket.id,
        initiator: true, // ou false selon la situation
    }

    if (Object.keys(peers).length == 1) {
        peer.initiator = false
    }
    peers.push(peer)
    console.log(peers)
    if (peers.length === 2) {
        io.to(peers[0].peerId).emit('peer', peers[1])
        io.to(peers[1].peerId).emit('peer', peers[0])
    }

    socket.on('signal', (data) => {
        //console.log('received signal on socket', data)
        // TODO propagate signal from socket to peer
        let sk = io.sockets.sockets.get(data.peerId)

        if (!sk) {
            return
        }
        sk.emit('signal', {
            signal: data.signal,
            peerId: sk.id,
            initiator: peer.initiator,
        })
    })
    socket.on('disconnect', () => {
        console.log('user disconnected')

        peers.splice(
            peers.findIndex((v) => v.peerId === String(socket.id)),
            1
        )

        console.log(peers)
    })
})
server.listen(port, function () {
    console.log('App listening on port: ' + port)
})
