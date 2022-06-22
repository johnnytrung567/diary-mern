const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            require: true,
        },
        fullname: {
            type: String,
            trim: true,
            require: true,
        },
        gender: {
            type: String,
            emum: ['Male', 'Female', 'Other'],
        },
        birthday: {
            type: Date,
        },
        avatar: {
            data: Buffer,
            contentType: String,
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('users', UserSchema)
