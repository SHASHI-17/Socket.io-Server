import multer from "multer";

const multerUploads = multer({ limits: { fileSize: 1024 * 1024 * 5 } });

export const singleAvatar = multerUploads.single("avatar");