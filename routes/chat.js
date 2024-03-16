import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { addmembers, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember } from '../controllers/chat.js';

const app = express.Router();

app.use(isAuthenticated);

app.post('/new', newGroupChat);

app.get('/my', getMyChats);

app.get('/my/groups', getMyGroups);

app.put('/addmembers', addmembers);

app.put('/removemembers', removeMember);

app.delete('/leave/:id',leaveGroup)

export default app