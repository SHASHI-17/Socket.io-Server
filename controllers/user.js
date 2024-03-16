import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { cookieOptions, sendToken } from '../utils/features.js';
import { ErrorHandler, TryCatch } from '../middlewares/error.js';

export const newUser = TryCatch(
    async (req, res) => {

        const { name, username, password, bio } = req.body;

        console.log(req.body);

        const avatar = {
            public_id: "dasd",
            url: "dasfa"
        }
        const user = await User.create({ name, username, password, bio, avatar });

        sendToken(res, user, 201, 'user created');


        // return res.status(200).json("User Created Successfully")
    }
)
export const login = TryCatch(
    async (req, res, next) => {
        const { username, password } = req.body;

        const user = await User.findOne({ username }).select("+password");

        if (!user) return next(new ErrorHandler('Invalid username', 404));

        const isMatch = await compare(password, user.password);

        if (!isMatch) return next(new ErrorHandler('Invalid password', 404));

        sendToken(res, user, 201, `Welcome Back,${user.name}`);
    }
)

export const getMyProfile = TryCatch(async (req, res) => {

    const user = await User.findById(req.user);

    return res.status(200).json({
        success: "true",
        data: user
    })
})

export const logout = TryCatch(async (req, res) => {

    return res.status(200).cookie('chat-token', '', { ...cookieOptions, maxAge: 0 }).json({
        success: "true",
        message: 'Logged out successfully'
    })
})

export const searchUser = TryCatch(async (req, res) => {

    const {name}=req.query;



    return res.status(200).json({
        success: "true",
        message: name
    })
})