import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express";
import { errorMiddleware } from "./middlewares/error.js";
import adminRouter from './routes/admin.js';
import chatRouter from './routes/chat.js';
import userRouter from './routes/user.js';
import { connectDB } from "./utils/dbConnect.js";

import { Server } from "socket.io";
import {createServer} from 'http'
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";

config({
    path: "./.env"
});

export const adminSecretKey = process.env.ADMIN_SECRET_KEY || 'dasfasgakjhkasf';

export const userSocketIds= new Map()

const app=express();
const server=createServer(app);
const io =new Server(server);

app.use(express.json());
app.use(cookieParser());

app.use('/user',userRouter);
app.use('/chat',chatRouter);
app.use('/admin',adminRouter);

app.get('/',(_,res)=>{
    return res.send("JAI SIYA RAM");
})

io.on("connection",async(socket)=>{

    console.log("User connected with ID : ",socket.id);

    const user = {
        _id:'fsfsa',
        name:"asfa"
    }

    userSocketIds.set(user._id.toString(),socket.id.toString());

    console.log(userSocketIds); 

    socket.on(NEW_MESSAGE,async ({chatId,members,message})=>{

        const messageForRealTime={
            content:message,
            _id:uuid(),
            sender:user,
            chat:chatId,
            createdAt:new Date().toISOString(),
        }

        const messageForDB = {
            content:message,
            sender:user._id,
            chat:chatId,
        }

        const memberSocket = getSockets(members);
        io.to(memberSocket).emit(NEW_MESSAGE,{
            chatId,message:messageForRealTime
        });

        io.to(memberSocket).emit(NEW_MESSAGE_ALERT,{chatId});

        try {
            await Message.create(messageForDB);
        } catch (e) {
            console.log(e.message);
        }
    })

    socket.on("disconnect",()=>{
        console.log("User Disconnected");
        userSocketIds.delete(user._id.toString());
    })
})

app.use(errorMiddleware)

// createUser(10);
// createSingleChats();
// createGroupChats(5);

const PORT=process.env.PORT || 3000;
export const envMode=process.env.NODE_ENV.trim() || "PRODUCTION";

server.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running successfully on port ${PORT} in ${envMode} Mode`);
})