import jwt from "jsonwebtoken";
import { ErrorHandler, TryCatch } from "./error.js"
import { adminSecretKey } from "../app.js";


export const isAuthenticated = (req, _, next) => {
    const token = req.cookies["chat-token"];

    if (!token) next(new ErrorHandler('Please login to access this route ', 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedData._id;
    console.log(decodedData);
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