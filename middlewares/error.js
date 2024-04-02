import { envMode } from "../app.js";



export class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message ||= 'Internal Server Error';
    err.statusCode ||= 500;

    if (err.code === 11000) {
        err.message = `Duplicate field - ${Object.keys(err.keyPattern).join(",")}`;
        err.statusCode = 400;
    }

    if (err.name === 'CastError') {
        err.message = `Invalid Format of ${err.path}`;
        err.statusCode = 400;
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(envMode === 'DEVELOPMENT' && { error: err })
    })
}




export const TryCatch = (passedFunc) => async (req, res, next) => {
    try {
        await passedFunc(req, res, next);
    } catch (e) {
        next(e);
    }
}