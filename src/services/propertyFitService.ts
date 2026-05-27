import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Property } from '../entities/Property.js';
import * as propertyRepository from '../repositories/propertyRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import {
  sendPropertyFitListEmail,
  sendPropertyViewNotificationEmail
} from './emailService.js';
import * as notificationService from './notificationService.js';
import { generateJWTToken } from './authService.js';
import { AppError } from '../utils/errors.js';

type AdvisorAnswers = {
  intent?: 'rent' | 'buy' | '';
  location?: string;
  budgetRange?: string;
  budgetAmount?: string | number;
  bedrooms?: string;
};

type AdvisorContact = {
  name?: string;
  phone?: string;
  email?: string;
};

type PropertyFitRequest = {
  answers?: AdvisorAnswers;
  contact?: AdvisorContact;
};

type PropertyViewRequest = {
  propertyId?: string;
  contact?: AdvisorContact;
  propertyUrl?: string;
};

const DEFAULT_PASSWORD_LENGTH = 18;
const DEFAULT_MATCH_LIMIT = 12;

const clean = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const parseBedrooms = (value?: string): number | undefined => {
  const parsed = parseInt(clean(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBudget = (value?: string): { minPrice?: number; maxPrice?: number } => {
  const budget = clean(value).toLowerCase();

  if (!budget) return {};
  if (budget.includes('below') && budget.includes('500')) return { maxPrice: 500000 };
  if (budget.includes('500') && budget.includes('800')) return { minPrice: 500000, maxPrice: 800000 };
  if (budget.includes('800') && budget.includes('1.2')) return { minPrice: 800000, maxPrice: 1200000 };
  if (budget.includes('1.2')) return { minPrice: 1200000 };

  return {};
};

const parseBudgetAmount = (value?: string | number): number | undefined => {
  const amount = typeof value === 'number'
    ? value
    : Number(clean(value).replace(/[^\d.]/g, ''));

  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
};

const buildLocation = (property: Property): string => {
  return [
    property.propertyName,
    property.streetName,
    property.cityName,
    property.state
  ].filter(Boolean).join(', ');
};

const buildPropertyUrl = (propertyId: string): string | undefined => {
  const clientUrl = process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_URL;
  if (!clientUrl) return undefined;

  return `${clientUrl.replace(/\/$/, '')}/property-details/${propertyId}`;
};

const getPropertyImageUrl = (property: Property): string | undefined => {
  const images = property.images;
  if (!Array.isArray(images) || images.length === 0) {
    return undefined;
  }

  const cover = images.find(
    (image) => image && typeof image === 'object' && !Array.isArray(image) && Boolean((image as { isCover?: boolean }).isCover)
  );
  const image = cover || images[0];

  if (typeof image === 'string') {
    return image;
  }

  if (image && typeof image === 'object' && !Array.isArray(image)) {
    const item = image as { url?: string; imageUrl?: string; src?: string };
    return item.url || item.imageUrl || item.src;
  }

  return undefined;
};

const applyLooseFilters = (
  properties: Property[],
  filters: { minBedrooms?: number; maxPrice?: number }
): Property[] => {
  return properties.filter((property) => {
    if (filters.minBedrooms !== undefined && Number(property.bedrooms || 0) < filters.minBedrooms) {
      return false;
    }

    if (filters.maxPrice !== undefined && Number(property.price || 0) > filters.maxPrice) {
      return false;
    }

    return true;
  });
};

const getDisplayName = (contact?: AdvisorContact): string => {
  return clean(contact?.name) || clean(contact?.email).split('@')[0] || 'PropertyLA user';
};

const createLeadAccountIfNeeded = async (contact?: AdvisorContact) => {
  const email = clean(contact?.email).toLowerCase();
  const phone = clean(contact?.phone);
  const name = getDisplayName(contact);

  if (!email || !phone || !name) {
    return { created: false, user: null };
  }

  const existing = await userRepository.findUserByEmail(email);
  if (existing) {
    const existingPhone = existing.phoneNumber || '';
    const canLoginExistingLead =
      existing.userType === 'lead' && (!existingPhone || existingPhone === phone);

    return {
      created: false,
      user: existing,
      token: canLoginExistingLead ? generateJWTToken(existing.id, existing.email) : null
    };
  }

  const password = crypto.randomBytes(DEFAULT_PASSWORD_LENGTH).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);
  const usernameBase = email.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'lead';
  const username = `${usernameBase.slice(0, 22)}_${crypto.randomBytes(3).toString('hex')}`;

  const user = await userRepository.createUser({
    username,
    email,
    phoneNumber: phone,
    userType: 'lead',
    passwordHash,
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    otp: String(crypto.randomInt(100000, 999999))
  });

  await userRepository.updateUser(user.id, {
    fullName: name,
    userType: 'lead',
    phoneNumber: phone
  });

  return {
    created: true,
    user,
    token: generateJWTToken(user.id, user.email)
  };
};

export const getPropertyFitMatches = async (request: PropertyFitRequest) => {
  const answers = request.answers || {};
  const maxPrice = parseBudgetAmount(answers.budgetAmount);
  const filters = {
    listingType: answers.intent === 'buy' ? 'sale' as const : answers.intent || undefined,
    cityName: clean(answers.location) || undefined,
    minBedrooms: parseBedrooms(answers.bedrooms),
    ...(maxPrice ? { maxPrice } : parseBudget(answers.budgetRange))
  };

  let properties = await propertyRepository.findAllProperties(filters);

  if (properties.length === 0 && clean(answers.location)) {
    const searched = await propertyRepository.searchProperties({
      q: clean(answers.location),
      type: filters.listingType
    });
    properties = applyLooseFilters(searched, {
      minBedrooms: filters.minBedrooms,
      maxPrice: filters.maxPrice
    });
  }

  if (properties.length === 0) {
    properties = await propertyRepository.findAllProperties({
      listingType: filters.listingType,
      minBedrooms: filters.minBedrooms,
      maxPrice: filters.maxPrice
    });
  }

  const exactMatchCount = properties.length;
  let fallbackUsed = false;

  if (properties.length === 0) {
    properties = await propertyRepository.findAllProperties();
    fallbackUsed = true;
  }

  const limited = properties.slice(0, DEFAULT_MATCH_LIMIT);
  const lead = await createLeadAccountIfNeeded(request.contact);

  if (clean(request.contact?.email) && limited.length > 0) {
    try {
      await sendPropertyFitListEmail(
        clean(request.contact?.email),
        getDisplayName(request.contact),
        limited.map((property) => ({
          title: property.propertyName || property.title,
          price: property.price,
          location: buildLocation(property),
          url: buildPropertyUrl(property.id),
          imageUrl: getPropertyImageUrl(property)
        }))
      );
    } catch (error) {
      console.error('Failed to send property fit list email:', error);
    }
  }

  const agentNotificationResults = await Promise.allSettled(
    limited.map((property) =>
      notificationService.createPropertyFitMatchNotification({
        property,
        viewerName: getDisplayName(request.contact),
        viewerEmail: clean(request.contact?.email),
        viewerPhone: clean(request.contact?.phone),
        propertyUrl: buildPropertyUrl(property.id),
        intent: answers.intent,
        location: answers.location,
        budgetAmount: answers.budgetAmount,
        bedrooms: answers.bedrooms
      })
    )
  );

  const agentNotificationCount = agentNotificationResults.filter(
    (result) => result.status === 'fulfilled' && Boolean(result.value)
  ).length;

  return {
    autoRegistered: lead.created,
    autoLoggedIn: Boolean(lead.token),
    fallbackUsed,
    exactMatchCount,
    auth: lead.token && lead.user ? {
      token: lead.token,
      user: {
        id: lead.user.id,
        username: lead.user.username,
        email: lead.user.email,
        phoneNumber: lead.user.phoneNumber,
        userType: lead.user.userType,
        fullName: lead.user.fullName || getDisplayName(request.contact),
        emailVerified: lead.user.emailVerified
      }
    } : null,
    leadUserId: lead.user?.id,
    agentNotificationCount,
    count: limited.length,
    data: limited
  };
};

export const notifyPropertyViewed = async (
  request: PropertyViewRequest,
  options: { sendEmail?: boolean } = {}
) => {
  const propertyId = clean(request.propertyId);
  if (!propertyId) {
    throw new AppError('Property ID is required', 400);
  }

  const property = await propertyRepository.findPropertyById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  await createLeadAccountIfNeeded(request.contact);

  const notification = await notificationService.createPropertyViewNotification({
    propertyId: property.id,
    viewerName: getDisplayName(request.contact),
    viewerEmail: clean(request.contact?.email),
    viewerPhone: clean(request.contact?.phone),
    propertyUrl: request.propertyUrl || buildPropertyUrl(property.id)
  });

  const agentEmail = property.user?.email;
  if (!agentEmail) {
    return {
      notified: Boolean(notification),
      notificationId: notification?.id,
      emailSent: false,
      message: 'Property owner notification saved, but no email was available'
    };
  }

  const shouldSendEmail = options.sendEmail ?? true;
  if (shouldSendEmail) {
    try {
      await sendPropertyViewNotificationEmail({
        to: agentEmail,
        agentName: property.user?.fullName || property.user?.username,
        leadName: getDisplayName(request.contact),
        leadEmail: clean(request.contact?.email),
        leadPhone: clean(request.contact?.phone),
        propertyTitle: property.propertyName || property.title,
        propertyUrl: request.propertyUrl || buildPropertyUrl(property.id)
      });
    } catch (error) {
      console.error('Failed to send property view notification:', error);
      throw new AppError('Failed to notify agent', 500);
    }
  }

  return {
    notified: Boolean(notification),
    notificationId: notification?.id,
    emailSent: shouldSendEmail
  };
};

export const createOrLoginPropertyFitLead = async (contact?: AdvisorContact) => {
  const lead = await createLeadAccountIfNeeded(contact);

  if (!lead.token || !lead.user) {
    throw new AppError(
      'This email is already registered. Please sign in with your account.',
      409
    );
  }

  return {
    autoRegistered: lead.created,
    autoLoggedIn: true,
    auth: {
      token: lead.token,
      user: {
        id: lead.user.id,
        username: lead.user.username,
        email: lead.user.email,
        phoneNumber: lead.user.phoneNumber,
        userType: lead.user.userType,
        fullName: lead.user.fullName || getDisplayName(contact),
        emailVerified: lead.user.emailVerified
      }
    }
  };
};
