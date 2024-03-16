import jwt from "jsonwebtoken";
import { ErrorHandler, TryCatch } from "./error.js"


export const isAuthenticated = (req, _ , next) => {
    const token = req.cookies["chat-token"];

    if (!token) next(new ErrorHandler('Please login to access this route ', 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedData._id;

    next();
}