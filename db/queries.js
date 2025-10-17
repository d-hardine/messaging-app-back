const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

async function createNewUser(firstName, lastName, username, email, hashedPassword) {
    return await prisma.user.create({
        data: {
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: hashedPassword,
        }
    })
}

async function lookupUser(username) {
    return await prisma.user.findUnique({
        where: {
            username: username
        },
    })
}

async function lookupEmail(email) {
    return await prisma.user.findUnique({
        where: {
            email: email
        },
    })
}

module.exports = { createNewUser, lookupUser, lookupEmail }