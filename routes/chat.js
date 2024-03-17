import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import {
    addmembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat,
    removeMember, renameGroup, sendAttachments
} from '../controllers/chat.js';
import { attachmentsMulter } from '../middlewares/multer.js';
import { addMemberValidator, getMessagesValidator, leaveGroupValidator, newGroupValidator, removeMemberValidator, sendAttachmentsValidator, validateHandler } from '../lib/validators.js';

const app = express.Router();

app.use(isAuthenticated);

app.post('/new', newGroupValidator(), validateHandler, newGroupChat);

app.get('/my', getMyChats);

app.get('/my/groups', getMyGroups);

app.put('/addmembers', addMemberValidator(), validateHandler, addmembers);

app.put('/removemembers', removeMemberValidator(), validateHandler, removeMember);

app.delete('/leave/:id', leaveGroupValidator(), validateHandler, leaveGroup);

//send attachments ..
app.post('/message', attachmentsMulter, sendAttachmentsValidator(), validateHandler, sendAttachments)

//get messages
app.get('/message/:id',getMessagesValidator(),validateHandler, getMessages)

// get chat details , rename , delete
app.route('/:id').get(getChatDetails).put(renameGroup).delete(deleteChat)

export default app