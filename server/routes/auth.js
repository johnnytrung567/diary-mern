const express = require('express')
const router = express.Router()
const argon2 = require('argon2')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

// @route POST api/auth/register
// @desc Register user
// @access Public
router.post('/register', async (req, res) => {
    const { username, password, fullname, gender, birthday } = req.body

    // Simple validation
    if (!username || !password || !fullname || !gender || !birthday)
        return res.status(400).json({
            success: false,
            message: 'Missing information',
        })

    try {
        // Check for existing user
        const user = await User.findOne({ username })

        if (user)
            return res.status(400).json({
                success: false,
                message: 'Username already taken',
            })

        // All good
        const hashedPassword = await argon2.hash(password)
        const newUser = new User({
            username,
            password: hashedPassword,
            fullname,
            gender,
            birthday,
            avatar: {
                data: fs.readFileSync(
                    path.join(__dirname, '..', 'images', 'avatar.png')
                ),
                contentType: 'image/png',
            },
        })
        await newUser.save()

        // Return token
        const accessToken = jwt.sign(
            { userId: newUser._id },
            process.env.ACCESS_TOKEN_SECRET
        )

        res.json({
            success: true,
            message: 'User created successfully',
            accessToken,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route POST api/auth/login
// @desc Login user
// @access Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password)
        return res.status(400).json({
            success: false,
            message: 'Missing username and/or password',
        })

    try {
        // Check for existing user
        const user = await User.findOne({ username })
        if (!user)
            return res.status(400).json({
                succes: false,
                message: 'Incorrect username or password',
            })

        // User found
        const passwordValid = await argon2.verify(user.password, password)
        if (!passwordValid)
            return res.status(400).json({
                success: false,
                message: 'Incorrect username or password',
            })

        // All good
        // Return token
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET
        )

        res.json({
            success: true,
            message: 'User logged in successfully',
            accessToken,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

module.exports = router
