import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { cookieOptions, emitEvent, sendToken, uploadFilesToCLoudinary } from '../utils/features.js';
import { ErrorHandler, TryCatch } from '../middlewares/error.js';
import { Chat } from '../models/chat.js';
import { Request } from '../models/request.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/events.js';
import { getOtherMembers } from '../lib/helper.js';

export const newUser = TryCatch(
    async (req, res,next) => {

        const { name, username, password, bio } = req.body;

        const file = req.file;

        // console.log(req.body,req.file);
        if(!file) return next(new ErrorHandler("Please Upload Avatar",403))

        const result = await uploadFilesToCLoudinary([file]);

        const avatar = {
            public_id: result[0].public_id,
            url: result[0].url
        }
        const user = await User.create({ name, username, password, bio, avatar });

        sendToken(res, user, 201, 'User Created Successfully');
    }
);

export const login = TryCatch(
    async (req, res, next) => {
        const { username, password } = req.body;

        const user = await User.findOne({ username }).select("+password");

        if (!user) return next(new ErrorHandler('Invalid username', 404));

        const isMatch = await compare(password, user.password);

        if (!isMatch) return next(new ErrorHandler('Invalid password', 404));

        sendToken(res, user, 201, `Welcome Back,${user.name}`);
    }
);

export const getMyProfile = TryCatch(async (req, res) => {

    const user = await User.findById(req.user);

    return res.status(200).json({
        success: "true",
        data: user
    })
});

export const logout = TryCatch(async (req, res) => {

    return res.status(200).cookie('chat-token', '', { ...cookieOptions, maxAge: 0 }).json({
        success: "true",
        message: 'Logged out successfully'
    })
});

export const searchUser = TryCatch(async (req, res) => {

    const { name = "" } = req.query;

    // finding all my chats
    const myChats = await Chat.find({ groupChat: false, members: req.user });

    // extracting all users from my chat and including all them in one array
    const allUsersFromChat = myChats.flatMap(chat => chat.members);

    // extracting all except me and my friends
    const allUsersExceptMeAndFriends = await User.find({
        _id: { $nin: allUsersFromChat },
        name: { $regex: name, $options: 'i' }
    })

    const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => {
        return {
            _id, name, avatar: avatar.url,
        }
    })

    return res.status(200).json({
        success: "true",
        users
    })
});

export const sendFriendRequest = TryCatch(async (req, res, next) => {

    const { userId } = req.body;

    const request = await Request.findOne({
        $or: [
            { sender: req.user, receiver: userId },
            { sender: userId, receiver: req.user }
        ]
    });

    if (request) return next(new ErrorHandler("Request already sent.", 400));

    await Request.create({ sender: req.user, receiver: userId })

    emitEvent(req, NEW_REQUEST, [userId]);

    return res.status(200).json({
        success: "true",
        message: 'Friend Request sent'
    })
});

export const acceptFriendRequest = TryCatch(async (req, res, next) => {

    const { accept, requestId } = req.body;

    const request = await Request.findById(requestId).populate("sender", "name").populate("receiver", "name");

    if (!request) return next(new ErrorHandler("Request not found.", 404));

    if (request.receiver._id.toString() !== req.user.toString())
        return next(new ErrorHandler("You are not authorized to accept this request.", 401));

    if (!accept) {

        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected",
        });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([Chat.create({ members, name: `${request.sender.name}-${request.receiver.name}` }),
    request.deleteOne()]);

    emitEvent(req, REFETCH_CHATS, members);


    return res.status(200).json({
        success: "true",
        message: 'Friend Request Accepted',
        senderId: request.sender._id,
    })
});

export const getMyNotifications = TryCatch(async (req, res, next) => {

    const requests = await Request.find({ receiver: req.user }).populate("sender", "name avatar");

    const allRequests = requests.map(({ _id, sender }) => {
        return {
            _id, sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url }
        }
    });

    return res.status(200).json({
        success: true,
        allRequests,
    })
});

export const getMyFriends = TryCatch(async (req, res, next) => {

    const { chatId } = req.query;

    const chats = await Chat.find({ members: req.user, groupChat: false }).populate("members", "name avatar");

    const friends = chats.map(({ members }) => {
        const otherUser = getOtherMembers(members, req.user);
        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url,
        }
    })

    if (chatId) {
        const chat = await Chat.findById(chatId);
        const availableFriends = friends.filter(friend => !chat.members.includes(friend._id));

        return res.status(200).json({
            success: true,
            friends:availableFriends
        })

    } else {
        return res.status(200).json({
            success: true,
            friends
        })
    }

});