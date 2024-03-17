import express from "express";
import { connectDB } from "./utils/dbConnect.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from './routes/user.js'
import { errorMiddleware } from "./middlewares/error.js";
import chatRouter from './routes/chat.js'
import adminRouter from './routes/admin.js'
import { createGroupChats, createSingleChats, createUser } from "./seeders/user.js";

config({
    path: "./.env"
});

export const adminSecretKey = process.env.ADMIN_SECRET_KEY || 'dasfasgakjhkasf';

const app=express();
app.use(express.json());
app.use(cookieParser());

app.use('/user',userRouter);
app.use('/chat',chatRouter);
app.use('/admin',adminRouter);

app.get('/',(_,res)=>{
    return res.send("JAI SIYA RAM");
})

app.use(errorMiddleware)

// createUser(10);
// createSingleChats();
// createGroupChats(5);

const PORT=process.env.PORT || 3000;
export const envMode=process.env.NODE_ENV.trim() || "PRODUCTION";

app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running successfully on port ${PORT} in ${envMode} Mode`);
})