const express = require('express')
const router = express.Router()
const argon2 = require('argon2')
const verifyToken = require('../middleware/auth')
const Post = require('../models/Post')

// @route GET api/posts
// @desc Get post
// @access Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({
            user: req.userId,
            deleted: false,
        }).populate('user', ['username'])
        res.json({ success: true, posts })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route GET api/posts/delete
// @desc Get deleted post
// @access Private
router.get('/delete', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({
            user: req.userId,
            deleted: true,
        }).populate('user', ['username'])
        res.json({ success: true, posts })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route GET api/posts/:id
// @desc Get one post
// @access Private
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const post = await Post.find({
            _id: req.params.id,
        }).populate('user', ['username'])
        res.json({ success: true, post })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route POST api/posts
// @desc Create post
// @access Private
router.post('/', verifyToken, async (req, res) => {
    const { title, content } = req.body

    // Simple validation
    if (!content)
        return res
            .status(400)
            .json({ success: false, message: 'Content is required' })

    try {
        const newPost = new Post({
            title,
            content,
            user: req.userId,
        })

        await newPost.save()

        res.json({
            success: true,
            message: 'Post created successfully',
            post: newPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route PUT api/posts/:id
// @desc Update post
// @access Private
router.put('/:id', verifyToken, async (req, res) => {
    const { title, content } = req.body

    // Simple validation
    if (!content)
        return res
            .status(400)
            .json({ success: false, message: 'Content is required' })

    try {
        let updatedPost = {
            title: title || 'Untitled',
            content,
        }

        const postUpdateCondition = { _id: req.params.id, user: req.userId }

        updatedPost = await Post.findOneAndUpdate(
            postUpdateCondition,
            updatedPost,
            { new: true }
        )

        // User not authorized to update post or post not found
        if (!updatedPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route PUT api/posts/delete/:id
// @desc Remove post to trash bin
// @access Private
router.put('/delete/:id', verifyToken, async (req, res) => {
    try {
        const deletePostCondition = {
            _id: req.params.id,
            user: req.userId,
            deleted: false,
        }

        const deletedPost = await Post.findOneAndUpdate(
            deletePostCondition,
            { deleted: true },
            { new: true }
        )

        // User not authorized to delete post or post not found
        if (!deletedPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post deleted successfully',
            post: deletedPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route PUT api/posts/recover/:id
// @desc Recover post from trash bin
// @access Private
router.put('/recover/:id', verifyToken, async (req, res) => {
    try {
        const recoverPostCondition = {
            _id: req.params.id,
            user: req.userId,
            deleted: true,
        }

        const recoveredPost = await Post.findOneAndUpdate(
            recoverPostCondition,
            { deleted: false },
            { new: true }
        )

        // User not authorized to recover post or post not found
        if (!recoveredPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post recovered successfully',
            post: recoveredPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route PUT api/posts/lock/:id
// @desc Lock post
// @access Private
router.put('/lock/:id', verifyToken, async (req, res) => {
    const { pin } = req.body
    if (!pin)
        return res
            .status(400)
            .json({ success: false, message: 'PIN code required' })
    else if (pin.length !== 4)
        return res
            .status(400)
            .json({ success: false, message: 'PIN code has 4 digits' })

    try {
        const hasedPin = await argon2.hash(pin)
        let lockedPost = { locked: true, pin: hasedPin }

        const lockPostCondition = {
            _id: req.params.id,
            user: req.userId,
            locked: false,
        }

        lockedPost = await Post.findOneAndUpdate(
            lockPostCondition,
            lockedPost,
            { new: true }
        )

        // User not authorized to lock post or post not found
        if (!lockedPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post locked successfully',
            post: lockedPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route PUT api/posts/unlock/:id
// @desc Unlock post
// @access Private
router.put('/unlock/:id', verifyToken, async (req, res) => {
    const { pin } = req.body
    if (!pin)
        return res
            .status(400)
            .json({ success: false, message: 'PIN code required' })
    else if (pin.length !== 4)
        return res
            .status(400)
            .json({ success: false, message: 'PIN code has 4 digits' })

    try {
        // Check for existing post
        const post = await Post.findOne({ _id: req.params.id })
        if (!post)
            return res
                .status(400)
                .json({ success: false, messgae: 'Post not found' })

        // Post found
        const pinValid = await argon2.verify(post.pin, pin)
        if (!pinValid)
            return res
                .status(400)
                .json({ success: false, message: 'Incorrect PIN code' })

        // All good
        let unlockedPost = { locked: false, pin: null }

        const unlockPostCondition = {
            _id: req.params.id,
            user: req.userId,
            locked: true,
        }

        unlockedPost = await Post.findOneAndUpdate(
            unlockPostCondition,
            unlockedPost,
            { new: true }
        )

        // User not authorized to unlock post or post not found
        if (!unlockedPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post unlocked successfully',
            post: unlockedPost,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
})

// @route DELETE api/posts/:id
// @desc permanently delete post
// @access Private
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const deletePostCondition = {
            _id: req.params.id,
            user: req.userId,
        }

        const deletedPost = await Post.findOneAndDelete(deletePostCondition)

        // User not authorized to permanently delete post or post not found
        if (!deletedPost)
            return res.status(401).json({
                success: false,
                message: 'User not authorized or post not found',
            })

        res.json({
            success: true,
            message: 'Post permanently deleted',
            post: deletedPost,
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
