import { v2 as cloudinary } from 'cloudinary';
import cookieParser from "cookie-parser";
import cors from 'cors';
import { config } from "dotenv";
import express from "express";
import { errorMiddleware } from "./middlewares/error.js";


import { connectDB } from "./utils/dbConnect.js";

import { createServer } from 'http';
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { socketAuthenticator } from "./middlewares/auth.js";
import { Message } from "./models/message.js";
import chatRouter from './routes/chat.js';
import userRouter from './routes/user.js';
import adminRouter from './routes/admin.js';

config({
    path: "./.env"
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const adminSecretKey = process.env.ADMIN_SECRET_KEY || 'dasfasgakjhkasf';

export const userSocketIds = new Map()

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:4173",],
        credentials: true
    }
});

app.set('io',io);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4173",],
    credentials: true
}))

app.use('/api/v1/user', userRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/admin', adminRouter);

app.get('/', (_, res) => {
    return res.send("JAI SIYA RAM");
})

io.use((socket, next) => {
    cookieParser()(socket.request, socket.request.res, async (err) => await socketAuthenticator(err, socket, next))
})

io.on("connection", async (socket) => {

    console.log("User connected with ID : ", socket.id);

    const user = socket.user;
    // console.log(socket.user);

    userSocketIds.set(user._id.toString(), socket.id.toString());

    console.log(userSocketIds);

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {

        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: user,
            chat: chatId,
            createdAt: new Date().toISOString(),
        }

        const messageForDB = {
            content: message,
            sender: user._id,
            chat: chatId,
        }

        console.log("Emitting",members);

        const memberSocket = getSockets(members);
        
        io.to(memberSocket).emit(NEW_MESSAGE, {
            chatId, message: messageForRealTime
        });

        io.to(memberSocket).emit(NEW_MESSAGE_ALERT, { chatId });

        try {
            await Message.create(messageForDB);
        } catch (e) {
            console.log(e.message);
        }
    })

    socket.on("disconnect", () => {
        console.log("User Disconnected");
        userSocketIds.delete(user._id.toString());
    })
})

app.use(errorMiddleware)

// createUser(10);
// createSingleChats();
// createGroupChats(5);

const PORT = process.env.PORT || 3000;
export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";

server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running successfully on port ${PORT} in ${envMode} Mode`);
})