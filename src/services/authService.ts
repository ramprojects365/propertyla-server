import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepository from '../repositories/userRepository.js';
import { RegistrationData, LoginCredentials, AuthToken, UserProfile, UpdateProfileData } from '../types/user.js';
import { generateOTP } from '../utils/otp.js';
import { sendOtpEmail } from './emailService.js';

const BCRYPT_SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET: string = process.env.JWT_SECRET;

interface ServiceError {
  status: number;
  message: string;
}

const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const generateJWTToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY } as SignOptions
  );
};

const calculateVerificationExpiry = (): Date => {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
};

const generateUsernameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0] || 'user';
  const base = localPart
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'user';

  return `${base}_${crypto.randomBytes(4).toString('hex')}`;
};

export const registerUser = async (registrationData: RegistrationData) => {
  const { email, password } = registrationData;
  const username = registrationData.username?.trim() || generateUsernameFromEmail(email);
  const phoneNumber = registrationData.phoneNumber?.trim() || undefined;

  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    throw {
      status: 400,
      message: 'Email already exists'
    } as ServiceError;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const verificationToken = generateVerificationToken();
  const verificationExpiry = calculateVerificationExpiry();
  const otp = generateOTP();


  const newUser = await userRepository.createUser({
    username,
    email,
    phoneNumber,
    passwordHash,
    verificationToken,
    verificationExpiry,
    otp
  });

  try {
    await sendOtpEmail(newUser.email, newUser.username, otp);
  } catch (err) {
    console.error('Failed to send OTP email:', err);
  }

  return {
    userId: newUser.id,
    username: newUser.username,
    email: newUser.email,
    emailVerified: newUser.emailVerified
  };
};

export const loginUser = async (credentials: LoginCredentials): Promise<AuthToken> => {
  const { email, password } = credentials;

  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw {
      status: 401,
      message: 'Invalid email or password'
    } as ServiceError;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw {
      status: 401,
      message: 'Invalid email or password'
    } as ServiceError;
  }

  if (!user.emailVerified) {
    throw {
      status: 403,
      message: 'Please verify your email before logging in'
    } as ServiceError;
  }

  await userRepository.updateLastLogin(user.id);

  const token = generateJWTToken(user.id, user.email);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  };
};


export const verifyUserEmailToken = async (token: string) => {
  if (!token) {
    throw {
      status: 400,
      message: 'Verification token required'
    } as ServiceError;
  }

  const user = await userRepository.verifyUserEmail(token);

  if (!user) {
    throw {
      status: 400,
      message: 'Invalid verification token'
    } as ServiceError;
  }

  if (user.verificationExpiry && new Date() > new Date(user.verificationExpiry)) {
    throw {
      status: 400,
      message: 'Verification token has expired'
    } as ServiceError;
  }

  const updatedUser = await userRepository.updateUserEmailVerification(user.id);

  return {
    id: updatedUser.id,
    emailVerified: updatedUser.emailVerified
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw { status: 404, message: 'User not found' } as ServiceError;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    fullName: user.fullName,
    bio: user.bio,
    companyName: user.companyName,
    icPassport: user.icPassport,
    designation: user.designation,
    experienceYears: user.experienceYears,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const updateUserProfile = async (
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> => {
  if (updates.username) {
    const existing = await userRepository.findUserByUsername(updates.username);
    if (existing && existing.id !== userId) {
      throw { status: 400, message: 'Username already taken' } as ServiceError;
    }
  }

  const updated = await userRepository.updateUser(userId, updates);

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    phoneNumber: updated.phoneNumber,
    fullName: updated.fullName,
    bio: updated.bio,
    companyName: updated.companyName,
    icPassport: updated.icPassport,
    designation: updated.designation,
    experienceYears: updated.experienceYears,
    emailVerified: updated.emailVerified,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
};

export const uploadProfileImage = async (userId: string, imageUrl: string): Promise<UserProfile> => {
  const updated = await userRepository.updateProfileImage(userId, imageUrl);

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    phoneNumber: updated.phoneNumber,
    profileImage: updated.profileImage,
    fullName: updated.fullName,
    bio: updated.bio,
    companyName: updated.companyName,
    icPassport: updated.icPassport,
    designation: updated.designation,
    experienceYears: updated.experienceYears,
    emailVerified: updated.emailVerified,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await userRepository.findUserByIdWithPassword(userId);

  if (!user) {
    throw { status: 404, message: 'User not found' } as ServiceError;
  }

  const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!passwordMatch) {
    throw { status: 400, message: 'Old password is incorrect' } as ServiceError;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await userRepository.updatePassword(userId, newPasswordHash);
};

export const validateToken = async (userId: string): Promise<UserProfile> => {
  const user = await userRepository.findUserById(userId);
  console.log(user);
  if (!user) {
    throw {
      status: 403,
      message: 'Invalid token or user not found'
    } as ServiceError;
  }

  return user;
};

export const verifyOTP = async (userId: string, code: string) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  const otpRecord = await userRepository.findValidOTP(userId, code);

  if (!otpRecord) {
    throw { status: 400, message: 'Invalid or expired OTP' };
  }

  const updatedUser = await userRepository.updateUserEmailVerification(userId);

  return {
    userId: updatedUser.id,
    email: updatedUser.email,
    emailVerified: updatedUser.emailVerified
  };
};
export const verifyOtpByEmail = async (
  email: string,
  code: string
): Promise<AuthToken> => {
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw {
      status: 404,
      message: 'User not found'
    } as ServiceError;
  }

  if (user.emailVerified) {
    throw {
      status: 400,
      message: 'Account is already verified'
    } as ServiceError;
  }

  // ✅ FIXED HERE
  const otpMatch = await userRepository.findValidOTP(user.id, code);

  if (!otpMatch) {
    throw {
      status: 400,
      message: 'Invalid or expired OTP'
    } as ServiceError;
  }

  const updatedUser = await userRepository.updateUserEmailVerification(user.id);

  const token = generateJWTToken(updatedUser.id, updatedUser.email);

  return {
    token,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }
  };
};
