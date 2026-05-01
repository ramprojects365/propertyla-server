import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
export const register = async (req, res) => {
    console.log('Test this is the test route for auth controller');
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const { username, email, phone_number, password } = req.body;
        const result = await authService.registerUser({
            username,
            email,
            phoneNumber: phone_number,
            password
        });
        res.status(201).json({
            success: true,
            message: 'Registration successful. A verification code has been sent to your email.',
            data: result
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
export const login = async (req, res) => {
    console.log('Test this is the test route for auth controller');
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const { email, password } = req.body;
        const result = await authService.loginUser({
            email,
            password
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
export const getProfile = async (req, res) => {
    try {
        const user = await authService.getUserProfile(req.user.id);
        res.status(200).json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { username, phone_number, full_name, bio, company_name, ic_passport, designation, experience_years } = req.body;
        const updates = {};
        if (username !== undefined)
            updates.username = username;
        if (phone_number !== undefined)
            updates.phoneNumber = phone_number || null;
        if (full_name !== undefined)
            updates.fullName = full_name || null;
        if (bio !== undefined)
            updates.bio = bio || null;
        if (company_name !== undefined)
            updates.companyName = company_name || null;
        if (ic_passport !== undefined)
            updates.icPassport = ic_passport || null;
        if (designation !== undefined)
            updates.designation = designation || null;
        if (experience_years !== undefined)
            updates.experienceYears = experience_years ? Number(experience_years) : null;
        const user = await authService.updateUserProfile(req.user.id, updates);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const oldPassword = req.body.oldPassword || req.body.old_password;
        const newPassword = req.body.newPassword || req.body.new_password;
        await authService.changePassword(req.user.id, oldPassword, newPassword);
        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyUserEmailToken(token);
        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: result
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
            return;
        }
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
export const verifyOTP = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }
        const { email, otp } = req.body;
        const result = await authService.verifyOtpByEmail(email, otp);
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully. Your account is now active.',
            data: result
        });
    }
    catch (error) {
        if (error.status) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
            return;
        }
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
//# sourceMappingURL=authController.js.map