import jwt from 'jsonwebtoken';

import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid'
import { getBase64, getSockets } from '../lib/helper.js';

export const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    httpOnly: true,
    secure: true
}

export const sendToken = (res, user, code, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);


    return res.status(code).cookie('chat-token', token, cookieOptions).json({ success: true, message, user })
}


export const emitEvent = (req, event, users, data) => {
    let io = req.app.get('io');
    const userSocket = getSockets(users);
    io.to(userSocket).emit(event, data);

}

export const uploadFilesToCLoudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(getBase64(file), {
                resource_type: "auto",
                public_id: uuid(),
            }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
        })
    });
    try {
        const results = await Promise.all(uploadPromises);
        const formattedResults = results.map((result) => {
            return {
                public_id: result.public_id,
                url: result.secure_url,
            }
        });
        return formattedResults;
    } catch (e) {
        throw new Error("Error Uploading files to Cloudinary", e);
    }
}


export const deleteFilesFromCloudinary = async (public_ids) => {

}