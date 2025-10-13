const { Router } = require('express')
const db = require('../db/queries')
const bcrypt = require('bcryptjs')
const passport = require('passport')

// Load environment variables
require('dotenv').config()

//jwt stuff
const jwt = require('jsonwebtoken')
const jwtAuthenticate = passport.authenticate('jwt', { session: false })

const chatRouter = Router()

chatRouter.get('/api/auth', jwtAuthenticate, (req, res) => {
    return res.status(200).json(req.user)
})

chatRouter.post('/api/signup', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    await db.createNewUser(req.body.firstName, req.body.lastName, req.body.username, req.body.email, hashedPassword)
    res.status(201).json({message: "inputted data for sign up OK"})
})

chatRouter.post('/api/login', async (req, res) => {
    const { username, password } = req.body
    const findUserInDb = await db.lookupUser(username)
    if(findUserInDb) {
        const match = await bcrypt.compare(password, findUserInDb.password)
        if(match) {
            const opts = {}
            opts.expiresIn = '7d' //expires in 7 days
            const secret = process.env.JWT_SECRET
            const username = findUserInDb.username
            const userId = findUserInDb.id
            const token = jwt.sign({ username, userId }, secret, opts)
            return res.status(200).json({
                message: 'auth passed',
                username: username,
                userId: userId,
                token
            })
        } else
            res.status(401).json({message: 'auth failed'})
    }
    res.status(401).json({message: 'auth failed'})
})

module.exports = chatRouter