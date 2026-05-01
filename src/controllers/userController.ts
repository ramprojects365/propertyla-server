import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
import * as userRepository from '../repositories/userRepository.js';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.getUserProfile(req.user!.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    // Map frontend field names → DB field names
    const { fullName, aboutYou, companyName, icPassport, designation, experience, username, phoneNumber } = req.body;

    const updates: Record<string, any> = {};
    if (fullName !== undefined)    updates.fullName = fullName || null;
    if (aboutYou !== undefined)    updates.bio = aboutYou || null;
    if (companyName !== undefined) updates.companyName = companyName || null;
    if (icPassport !== undefined)  updates.icPassport = icPassport || null;
    if (designation !== undefined) updates.designation = designation || null;
    if (experience !== undefined)  updates.experienceYears = experience ? Number(experience) : null;
    if (username !== undefined)    updates.username = username;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber || null;

    const user = await authService.updateUserProfile(req.user!.id, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File;

    if (!file) {
      res.status(400).json({ success: false, message: 'No image provided' });
      return;
    }

    const serverBase = process.env.SERVER_BASE_URL || 'http://localhost:3008';
    const imageUrl = `${serverBase}/uploads/avatars/${file.filename}`;

    // Delete old profile image from disk if it exists
    const oldImageUrl = await userRepository.getProfileImage(req.user!.id);
    if (oldImageUrl) {
      const oldFileName = path.basename(oldImageUrl);
      const oldFilePath = path.join(process.cwd(), 'uploads', 'avatars', oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const user = await authService.uploadProfileImage(req.user!.id, imageUrl);

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: { user }
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Profile image upload error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
