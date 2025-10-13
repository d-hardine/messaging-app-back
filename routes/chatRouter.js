const { Router } = require('express')

const chatRouter = Router()

chatRouter.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>')
})

module.exports = chatRouter