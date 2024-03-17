import { ErrorHandler, TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import jwt from 'jsonwebtoken'
import { cookieOptions } from "../utils/features.js";
import { adminSecretKey } from "../app.js";

export const adminLogin = TryCatch(async (req, res, next) => {
    const { secretKey } = req.body;

    const isMatched = secretKey === adminSecretKey;

    if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

    const token = jwt.sign(secretKey, process.env.JWT_SECRET);

    return res.status(200).cookie('admin-chat-token', token, {
        ...cookieOptions, maxAge: 1000 * 60 * 15
    }).json({
        success: true,
        message: "Authenticated Successfully , Welcome Boss"
    })

});

export const adminLogout = TryCatch(async (req, res, next) => {

    return res.status(200).clearCookie('admin-chat-token', {
        ...cookieOptions, maxAge: 0
    }).json({
        success: true,
        message: "Logout Successfully"
    })

});

export const getAdminData = TryCatch(async (req, res, next) => {
    return res.status(200).json({
        success:true,
        admin:true
    })
})

export const allUsers = TryCatch(async (req, res, next) => {

    const users = await User.find({});

    const transformedUsers = await Promise.all(
        users.map(async ({ name, username, avatar, _id }) => {

            const [groups, friends] = await Promise.all([
                Chat.countDocuments({ groupChat: true, members: _id }),
                Chat.countDocuments({ groupChat: false, members: _id }),
            ]);

            return {
                name, username, _id, avatar: avatar.url, groups, friends
            }
        }))

    return res.status(200).json({
        success: true,
        users: transformedUsers,
    })

});

export const allChats = TryCatch(async (req, res, next) => {

    const chats = await Chat.find({}).populate("members", "name avatar").populate("creator", "name avatar");

    const transformedChats = await Promise.all(
        chats.map(async ({ members, groupChat, _id, name, creator }) => {

            const totalMessages = await Message.countDocuments({ chat: _id })

            return {
                _id, groupChat, name,
                avatar: members.slice(0, 3).map(member => member.avatar.url),
                members: members.map(({ _id, name, avatar }) => {
                    return {
                        _id, name, avatar: avatar.url,
                    }
                }),
                creator: {
                    name: creator?.name || "None", avatar: creator?.avatar.url || ""
                },
                totalMessages
            }
        })
    )

    return res.status(200).json({
        success: true,
        chats: transformedChats,
    })

});

export const allMessages = TryCatch(async (req, res) => {

    const messages = await Message.find({}).populate("sender", "name avatar").populate("chat", "groupChat");

    const transformedMessages = messages.map(({ content, attachments, sender, createdAt, chat, _id }) => {
        return {
            _id, content, attachments, createdAt,
            chat: chat._id,
            groupChat: chat.groupChat,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar.url
            }
        }
    })

    return res.status(200).json({
        success: true,
        messages: transformedMessages,
    })
});

export const getDashboardStats = TryCatch(async (req, res) => {

    const [groupsCount, usersCount, messagesCount,
        totalChatsCount] = await Promise.all([
            Chat.countDocuments({ groupChat: true }),
            User.countDocuments(),
            Message.countDocuments(),
            Chat.countDocuments(),
        ])


    const today = new Date();

    const last7days = new Date();

    last7days.setDate(last7days.getDate() - 7);

    const last7daysMessages = await Message.find({
        createdAt: {
            $gte: last7days, $lte: today
        }
    }).select("createdAt")

    const messages = new Array(7).fill(0);

    const daysInMiliSeconds = (1000 * 60 * 60 * 24);

    last7daysMessages.forEach(message => {
        const index = Math.floor((today.getTime() - message.createdAt.getTime()) / daysInMiliSeconds);
        messages[6 - index]++;
    })

    const stats = {
        groupsCount, usersCount, messagesCount, totalChatsCount, messageChart: messages
    }

    return res.status(200).json({
        success: true,
        stats,
    })
});