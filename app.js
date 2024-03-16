import express from "express";
import { connectDB } from "./utils/dbConnect.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from './routes/user.js'
import { errorMiddleware } from "./middlewares/error.js";
import chatRouter from './routes/chat.js'
import { createUser } from "./seeders/user.js";

config({
    path: "./.env"
});

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use('/user',userRouter);
app.use('/chat',chatRouter);

app.get('/',(_,res)=>{
    return res.send("JAI SIYA RAM");
})

app.use(errorMiddleware)

// createUser(10);

const PORT=3000;
app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running successfully on port ${PORT}`);
})