import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Ensure uploads directory exists on startup
const uploadDir = path.join(process.cwd(), 'uploads', 'properties');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});
export const uploadAny = () => upload.any();
export const uploadSingle = (fieldName = 'images') => upload.single(fieldName);
export const uploadArray = (fieldName = 'images', maxCount = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);
const getServerBase = () => process.env.SERVER_BASE_URL || 'http://localhost:3008';
export const uploadToSpaces = async (file, _folder = 'properties') => {
    return `${getServerBase()}/uploads/properties/${file.filename}`;
};
export const uploadMultipleToSpaces = async (files, _folder = 'properties') => {
    if (files.length > 10) {
        throw new Error('Maximum 10 images allowed');
    }
    return files.map(file => `${getServerBase()}/uploads/properties/${file.filename}`);
};
export const deleteFromSpaces = async (fileUrl) => {
    try {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Error deleting local file:', error);
        throw new Error('Failed to delete image');
    }
};
export const deleteMultipleFromSpaces = async (fileUrls) => {
    const deletePromises = fileUrls.map(url => deleteFromSpaces(url));
    try {
        await Promise.all(deletePromises);
    }
    catch (error) {
        console.error('Error deleting multiple images:', error);
    }
};
//# sourceMappingURL=imageUploadService.js.map