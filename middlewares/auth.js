import jwt from "jsonwebtoken";
import { ErrorHandler, TryCatch } from "./error.js"
import { adminSecretKey } from "../app.js";
import { User } from "../models/user.js";


export const isAuthenticated = (req, _, next) => {
    const token = req.cookies["chat-token"];

    if (!token) next(new ErrorHandler('Please login to access this route ', 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedData._id;
    next();
}

export const adminOnly = (req, _, next) => {
    const token = req.cookies["admin-chat-token"];

    if (!token) next(new ErrorHandler('Only Admin can access this route ', 401));

    const secretKey = jwt.verify(token, process.env.JWT_SECRET);

    const isMatched = secretKey === adminSecretKey;

    if (!isMatched) return next(new ErrorHandler("Only Admin can access this route.", 401));

    next();
}

export const socketAuthenticator = async (err,socket,next)=>{
    try {
        if(err) return next(err);

        const authToken=socket.request.cookies["chat-token"];

        if(!authToken) return next(new ErrorHandler('Please login to access this route',401));

        const decodedData = jwt.verify(authToken,process.env.JWT_SECRET);

        const user=await User.findById(decodedData._id);

        if(!user) return next(new ErrorHandler("Please login to access this route",401));

        socket.user = user;
        
        return next()

     } catch (e) {
        console.log(e);
        return next(new ErrorHandler("Please login to access this route",401));
    }
}