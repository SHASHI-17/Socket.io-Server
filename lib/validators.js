import { body, check, param, query, validationResult, } from 'express-validator'
import { ErrorHandler } from '../middlewares/error.js';

export const validateHandler = (req, res, next) => {

    const errors = validationResult(req)
    const errorMessages = errors.array().map(error => error.msg).join(', ');

    if (errors.isEmpty()) return next();
    else next(new ErrorHandler(errorMessages, 404));

};

export const registerValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("username", "Please Enter Username").notEmpty(),
    body("bio", "Please Enter Bio").notEmpty(),
    body("password", "Please Enter Strong Password").notEmpty().isStrongPassword(),
    check("avatar", "Please Upload Avatar").notEmpty()
];

export const loginValidator = () => [
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Strong Password").notEmpty().isStrongPassword(),
];

export const newGroupValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter Members").
        isArray({ min: 2, max: 100 }).withMessage("Member must be 2-100"),
];


export const addMemberValidator = () => [
    body("chatId", "Please Enter ChatId").notEmpty(),
    body("members").notEmpty().withMessage("Please Enter Members").
        isArray({ min: 1, max: 97 }).withMessage("Member must be 1-97"),
];

export const removeMemberValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    body("userId", "Please Enter User ID").notEmpty(),
];

export const leaveGroupValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty(),
];

export const sendAttachmentsValidator = () => [
    body("chatId", "Please Enter Chat ID").notEmpty(),
    check("files").notEmpty().withMessage("Please Upload Attachments").
        isArray({ min: 1, max: 5 }).withMessage("Attachments must be 1-5")
];

export const getMessagesValidator = () => [
    param("id", "Please Enter Chat ID").notEmpty()
];

export const sendRequestValidator = () => [
    body("userId", "Please Enter User ID").notEmpty()
];

export const acceptRequestValidator = () => [
    body("accept").notEmpty().withMessage("Please Add Accept").isBoolean().withMessage("Accept must be boolean"),
    body("requestId").notEmpty().withMessage( "Please Enter Request ID"),
];
