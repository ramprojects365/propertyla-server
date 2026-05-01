import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { uploadProfileImage, getProfile, updateProfile } from '../controllers/userController.js';
// Ensure avatars upload directory exists
const avatarUploadDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(avatarUploadDir, { recursive: true });
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, avatarUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueName);
    }
});
const avatarFileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
};
const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB max for avatars
});
const router = Router();
router.get('/profile', authenticateToken, getProfile);
const profileValidation = [
    body('fullName').optional({ nullable: true }).trim(),
    body('aboutYou').optional({ nullable: true }).trim(),
    body('companyName').optional({ nullable: true }).trim(),
    body('icPassport').optional({ nullable: true }).trim(),
    body('designation').optional({ nullable: true }).trim(),
    body('experience').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('phoneNumber').optional({ nullable: true }).trim()
];
router.put('/profile', authenticateToken, profileValidation, updateProfile);
router.patch('/profile', authenticateToken, profileValidation, updateProfile);
router.post('/profile/image', authenticateToken, avatarUpload.single('profileImage'), uploadProfileImage);
export default router;
//# sourceMappingURL=userRoutes.js.map