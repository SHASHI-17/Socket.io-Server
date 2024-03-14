import express from "express";
import { connectDB } from "./utils/dbConnect.js";
import { config } from "dotenv";
const app=express();


config({
    path: "./.env"
});
app.get('/',(_,res)=>{
    return res.send("JAI SIYA RAM");
})
const PORT=3000;
app.listen(PORT,()=>{
    connectDB();
    console.log(`Server is running successfully on port ${PORT}`);
})