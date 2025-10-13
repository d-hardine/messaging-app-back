const express = require('express')
const chatRouter = require('./routes/chatRouter')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const cors = require('cors')

//express initialization
const app = express()

//socket.io server initialization
const server = createServer(app)

//cors initialization
app.use(cors())

//access html body
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//route middleware
app.use(chatRouter)

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173/',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log('connected user: ' + socket.id)

    socket.on('send chat', (message) => {
        console.log(message)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

server.listen(3000, () => console.log('server running at port 3000'))