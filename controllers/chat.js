import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMembers } from "../lib/helper.js";
import { ErrorHandler, TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";

import { deleteFilesFromCloudinary, emitEvent } from "../utils/features.js";

export const newGroupChat = TryCatch(async (req, res, next) => {
    const { name, members } = req.body;

    if (members.length < 2) return next(new ErrorHandler('Group Chat must have at least 3 members', 400));

    const allMembers = [...members, req.user];

    await Chat.create({ name, groupChat: true, creator: req.user, members: allMembers });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group chat`);
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({
        success: true,
        message: "Group Created"
    })

});

export const getMyChats = TryCatch(async (req, res, next) => {

    const chats = await Chat.find({ members: req.user }).populate("members", "name avatar")

    const transformedChats = chats.map(({ _id, name, members, groupChat }) => {

        const otherMember = getOtherMembers(members, req.user);

        return {
            _id,
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) :
                [otherMember.avatar.url],
            name: groupChat ? name : otherMember.name,
            members: members.filter(i => i._id.toString() !== req.user.toString()).map(i => i._id),
        }
    })

    return res.status(200).json({
        success: true,
        chats: transformedChats
    })

});

export const getMyGroups = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({
        members: req.user,
        groupChat: true,
        creator: req.user,
    }).populate("members", "name avatar");


    const groups = chats.map(({ members, _id, groupChat, name }) => {
        return {
            _id, groupChat, name,
            avatar: members.slice(0, 3).map(({ avatar }) => avatar.url)
        }
    })


    return res.status(200).json({
        success: true,
        groups
    })

});

export const addmembers = TryCatch(async (req, res, next) => {

    const { chatId, members } = req.body;

    if (!chatId) return next(new ErrorHandler("ChatId is required", 404));

    if (!members || members.length < 1) return next(new ErrorHandler("Please provide members", 404));

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) return next(new ErrorHandler('This is not a group chat', 400));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You are not allowed to add member ", 403));

    const allNewMembersPromise = members.map(i => User.findById(i, "name"));

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers.filter(i => !chat.members.includes(i._id.toString())).map(i => i._id);

    chat.members.push(...uniqueMembers);

    if (chat.members.length > 100) return next(new ErrorHandler("Group members limit reached", 400));

    await chat.save();

    const allUsersName = allNewMembers.map(i => i.name).join(' , ');

    emitEvent(req, ALERT, chat.members, `${allUsersName} has been added in the group.`);

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Members added successfully",
    });

});

export const removeMember = TryCatch(async (req, res, next) => {
    const { userId, chatId } = req.body;

    if (!chatId) return next(new ErrorHandler("ChatId is required", 404));

    if (!userId) return next(new ErrorHandler("userId is required", 404));

    const [chat, userThatWillBeRemoved] = await Promise.all([
        Chat.findById(chatId), User.findById(userId, "name")
    ]);

    if (userId === chat.creator.toString()) return next(new ErrorHandler("You are the admin ", 404));

    if (!chat.members.includes(userThatWillBeRemoved._id.toString()))
        return next(new ErrorHandler("Already left the group", 404));

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) return next(new ErrorHandler('This is not a group chat', 400));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You are not allowed to add member ", 403));

    if (chat.members.length <= 3)
        return next(new ErrorHandler("Group should have atleast have 3 members", 404));

    chat.members = chat.members.filter(i => i.toString() !== userId.toString());

    await chat.save();

    emitEvent(req, ALERT, chat.members, `${userThatWillBeRemoved.name} has been removed from the group`);
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Member removed successfully",
    })

});

export const leaveGroup = TryCatch(async (req, res, next) => {

    const { id: chatId } = req.params;

    if (!chatId) return next(new ErrorHandler("ChatId is required", 404));

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) return next(new ErrorHandler('This is not a group chat', 400));

    if (!chat.members.includes(req.user.toString())) return next(new ErrorHandler("Already left the Group", 404));

    const remainingMembers = chat.members.filter(i => i._id.toString() !== req.user.toString());

    if (remainingMembers.length < 3) return next(new ErrorHandler("Group must have atleast 3 members", 400));

    if (chat.creator.toString() === req.user.toString()) {
        const randomElement = Math.floor((Math.random() * remainingMembers.length));
        chat.creator = remainingMembers[randomElement];
    }

    chat.members = remainingMembers;

    const [user] = await Promise.all([User.findById(req.user, "name"), chat.save()]);

    emitEvent(req, ALERT, chat.members, `User ${user.name} has left group`)

    return res.status(200).json({
        success: true,
        message: "You left the group successfully",
    })

});

export const sendAttachments = TryCatch(async (req, res, next) => {
    const { chatId } = req.body;

    if (!chatId) return next(new ErrorHandler("ChatId is required", 404));

    const [chat, me] = await Promise.all([Chat.findById(chatId), User.findById(req.user, "name")]);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    const files = req.files || [];

    if (files.length < 1) return next(new ErrorHandler("Please Provide attachments", 400));

    const attachments = [];

    const messageForDB = { content: "", attachments, sender: me._id, chat: chatId };

    const messageForRealTime = { ...messageForDB, sender: { _id: me._id, name: me.name } }

    const message = await Message.create(messageForDB);

    emitEvent(req, NEW_ATTACHMENT, chat.members, { message: messageForRealTime, chat: chatId });
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

    return res.status(200).json({
        success: true,
        message
    })
});

export const getChatDetails = TryCatch(async (req, res, next) => {

    if (!req.params.id) return next(new ErrorHandler("chatId is required to fetch", 404));

    if (req.query.populate === "true") {

        const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean();

        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        chat.members = chat.members.map(({ _id, name, avatar }) => {
            return {
                _id, name, avatar: avatar.url
            }
        });

        return res.status(200).json({
            success: true,
            chat,
        });

    } else {

        const chat = await Chat.findById(req.params.id);

        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        return res.status(200).json({
            success: true,
            chat,
        });
    }
});

export const renameGroup = TryCatch(async (req, res, next) => {
    const { id: chatId } = req.params;

    if (!chatId) return next(new ErrorHandler('chatId is required to fetch', 400));

    const { name } = req.body;

    if (!name) return next(new ErrorHandler('name is required to update the group name', 404));

    const chat = await Chat.findById(req.params.id);

    if (name === chat.name) return next(new ErrorHandler("Please dont update with the same name", 404));

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) return next(new ErrorHandler('This is not a group chat', 400));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler('You are not allowed to rename the group', 400));

    chat.name = name;

    await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: 'Group renamed successfully',
    })

});

export const deleteChat = TryCatch(async (req, res, next) => {
    const { id: chatId } = req.params;

    if (!chatId) return next(new ErrorHandler('chatId is required to fetch', 400));

    const chat = await Chat.findById(req.params.id);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler('You are not allowed to rename the group', 403));

    if (!chat.groupChat && !chat.members.includes(req.user.toString()))
        return next(new ErrorHandler('You are not allowed to rename the group', 403));

    const messagesWithAttachments = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } });

    const public_ids = [];

    messagesWithAttachments.forEach(({ attachments }) => {
        attachments.forEach(({ public_id }) => public_ids.push(public_id));
    });

    await Promise.all([
        // delete files from cloudinary
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(), Message.deleteMany({ chat: chatId }),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully"
    })

});

export const getMessages = TryCatch(async (req, res, next) => {
    const { id: chatId } = req.params;

    const { page = 1 } = req.query; const limit = 20;

    const skip = (page - 1) * limit

    if (!chatId) return next(new ErrorHandler('chatId is required to fetch', 400));

    const [messages, totalMessagesCount] = await Promise.all([
        Message.find({ chat: chatId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate("sender", "name avatar").lean(),
        Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / limit) || 0;

    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages
    })

})