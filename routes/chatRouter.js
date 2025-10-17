const { Router } = require('express')
const db = require('../db/queries')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const { body, validationResult } = require('express-validator')
const cors = require('cors')

//validate user signup
const validateUser = [
    body('firstName').trim()
        .isAlpha().withMessage(`First name must only contain letters.`)
        .isLength({min: 3, max: 15}).withMessage(`First name must be between 3 and 15 characters.`),
    body('lastName').trim()
        .isAlpha().withMessage(`Last name must only contain letters.`)
        .isLength({min: 3, max: 15}).withMessage(`Last name must be between 3 and 15 characters.`),
    body('username').trim()
        .isLength({min: 3, max: 15}).withMessage(`Username must be between 3 and 15 characters.`)
        .custom(async (username) => {
            const duplicateUsername = await db.lookupUser(username)
            if(duplicateUsername) {
                throw new Error('Username has been used, pick another one.')
            }
        }),
    body('email').trim()
        .isEmail().withMessage('Invalid email')
        .custom(async (email) => {
            const duplicateEmail = await db.lookupEmail(email)
            if(duplicateEmail) {
                throw new Error('Email has been used, pick another one.')
            }
        }),
    body('password').isStrongPassword({ //it needs at least 5 conditions written to make it work, which is stupid
        minLength: 8,
        minLowercase: 1,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
    }).withMessage(`Min 8 characters, with at least 1 number & 1 uppercase letter.`),
    body('confirmPassword').custom((confirmedPasswordvalue, {req}) => {
        return confirmedPasswordvalue === req.body.password
    }).withMessage("Password and confirm password doesn't match.")
]

// Load environment variables
require('dotenv').config()

//jwt stuff
const jwt = require('jsonwebtoken')
const jwtAuthenticate = passport.authenticate('jwt', { session: false })

//router initialization
const chatRouter = Router()

//cors initialization
const corsOptions = {
  origin: 'http://localhost:5173', // Allowed origins
  methods: 'GET,POST', // Allowed methods
};
chatRouter.use(cors(corsOptions))

chatRouter.get('/api/auth', jwtAuthenticate, (req, res) => {
    return res.status(200).json(req.user)
})

chatRouter.post('/api/signup', [validateUser, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors.array())
            return res.status(400).json({errors: errors.array() })
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            await db.createNewUser(req.body.firstName, req.body.lastName, req.body.username, req.body.email, hashedPassword)
            res.status(201).json({message: "inputted data for sign up OK"})
        }
    } catch(err) {
        console.log(err)
        res.status(400).send('error')
    }
}])

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