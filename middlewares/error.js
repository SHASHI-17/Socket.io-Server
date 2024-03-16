


export class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message);
        this.message=message;
        this.statusCode=statusCode
    }
}

export const errorMiddleware=(err,req,res,next)=>{
    err.message ||='Internal Server Error';
    err.statusCode ||=500;

    return res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}




export const TryCatch=(passedFunc)=>async (req,res,next)=>{
    try {
        await passedFunc(req,res,next);
    } catch (e) {
            next(e);    
    }
}