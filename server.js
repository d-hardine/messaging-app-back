const express = require('express')
const chatRouter = require('./routes/chatRouter')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const passport = require('passport')

//express initialization
const app = express()

//socket.io server initialization
const server = createServer(app)

//access html body
app.use(express.json())
app.use(express.urlencoded({extended: true}))


// Need to require the entire Passport config module so server.js knows about it
require('./configs/passport')

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

/*
//socket io jwt authentication middleware manual
io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            socket.user = decoded
            next()
        }
        catch(err) {
            next(new Error('Authentication error: Invalid token'))
        }
    } else {
        next(new Error('Authentication error: Token not provided'))
    }
})
*/

//socket io jwt authentication middleware
io.engine.use((req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
        console.log('authenticating...')
        passport.authenticate("jwt", { session: false })(req, res, next);
    } else {
        next();
    }
})

//socket io initialization
io.on('connection', (socket) => {
    const user = socket.request.user;
    console.log('connected user: ' + user.username)

    socket.on('send chat', (message) => {
        console.log(message)
        socket.emit('received chat', message)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

//route middleware
app.use(chatRouter)

server.listen(3000, () => console.log('server running at port 3000'))