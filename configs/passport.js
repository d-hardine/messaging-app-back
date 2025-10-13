//JWT stuff
const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

//db stuff
const db = require('../db/queries')

// Load environment variables
require('dotenv').config();

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = process.env.JWT_SECRET

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try{
            const user = await db.lookupUser(jwt_payload.username)
            if(user)
                return done(null, user)
            return done(null, false)
        } catch(err) {
            return done(err)
        }
    })
)