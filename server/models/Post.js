const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            default: 'Untitled',
        },
        content: {
            type: String,
            trim: true,
            require: true,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        locked: {
            type: Boolean,
            default: false,
        },
        pin: {
            type: String,
            default: null,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'users',
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('posts', PostSchema)
