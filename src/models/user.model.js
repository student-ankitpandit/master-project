import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const Userschema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    avatar: {
        type: String, //cloudinary url
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    },
},

    {timestamps: true}
)

Userschema.pre("save", async function (next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        
    }
    next();
    
    Userschema.methods.isPasswordCorrect = async function(password) {
        return await bcrypt.compare(password, this.password)
    }

    //both are jwt tokens
    Userschema.methods.generateAccessToken = function(){
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username,
                fullName: this.fullName
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    }
    
    Userschema.methods.generateAccessToken = function(){
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    }

})

export const User = mongoose.model("User", Userschema)