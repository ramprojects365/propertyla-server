import { Request, Response } from 'express';
import * as propertyService from '../services/propertyService.js';
import { Property } from '../entities/Property.js';
import { AppError } from '../utils/errors.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_REGEX.test(value);

const parseOptionalFloat = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
  }

  return Boolean(value);
};

const normalizeAmenities = (value: unknown): Property['amenities'] | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const amenities = value as Partial<Property['amenities']>;
    return {
      lifestyle: Array.isArray(amenities.lifestyle) ? amenities.lifestyle : [],
      facilities: Array.isArray(amenities.facilities) ? amenities.facilities : [],
      security: Array.isArray(amenities.security) ? amenities.security : []
    };
  }

  return undefined;
};

const buildPropertyPayload = (
  body: Record<string, unknown>,
  options: { includeDefaults?: boolean; userId?: string } = {}
): Partial<Property> => {
  const propertyData: Partial<Property> = {};
  const stringFields: Array<keyof Property> = [
    'title',
    'description',
    'listingType',
    'propertyType',
    'tenure',
    'propertyName',
    'streetName',
    'cityName',
    'state',
    'county',
    'pincode',
    'landmark',
    'location',
    'furnishing',
    'availability',
    'floorLevel',
    'status'
  ];

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      (propertyData as Record<string, unknown>)[field] = body[field];
    }
  }

  if (options.includeDefaults && propertyData.status === undefined) {
    propertyData.status = 'active';
  }

  const negotiable = parseOptionalBoolean(body.negotiable);
  if (negotiable !== undefined) {
    propertyData.negotiable = negotiable;
  }

  if (Array.isArray(body.images)) {
    propertyData.images = body.images.filter((image): image is string => typeof image === 'string');
  }

  const amenities = normalizeAmenities(body.amenities);
  if (amenities || options.includeDefaults) {
    propertyData.amenities = amenities ?? { lifestyle: [], facilities: [], security: [] };
  }

  const price = parseOptionalFloat(body.price);
  if (price !== undefined) propertyData.price = price;

  const buildupArea = parseOptionalFloat(body.buildupArea);
  if (buildupArea !== undefined) propertyData.buildupArea = buildupArea;

  const latitude = parseOptionalFloat(body.latitude);
  if (latitude !== undefined) propertyData.latitude = latitude;

  const longitude = parseOptionalFloat(body.longitude);
  if (longitude !== undefined) propertyData.longitude = longitude;

  const bedrooms = parseOptionalInteger(body.bedrooms);
  if (bedrooms !== undefined) propertyData.bedrooms = bedrooms;

  const bathrooms = parseOptionalInteger(body.bathrooms);
  if (bathrooms !== undefined) propertyData.bathrooms = bathrooms;

  const yearOfBuild = parseOptionalInteger(body.yearOfBuild);
  if (yearOfBuild !== undefined) propertyData.yearOfBuild = yearOfBuild;

  if (options.userId) {
    propertyData.userId = options.userId;
  }

  return propertyData;
};

export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const propertyData = buildPropertyPayload(req.body, { includeDefaults: true, userId });

    const property = await propertyService.createProperty(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create property'
      });
    }
  }
};

export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }

    if (!isValidUuid(propertyId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
      return;
    }

    const property = await propertyService.getPropertyById(propertyId);

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch property'
      });
    }
  }
};

export const getAllProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      listingType: req.query.listingType as 'rent' | 'sale' | undefined,
      propertyType: req.query.propertyType as string | undefined,
      tenure: req.query.tenure as 'freehold' | 'leasehold' | undefined,
      furnishing: req.query.furnishing as 'Fully' | 'Partially' | 'Unfurnished' | undefined,
      availability: req.query.availability as
        | 'Immediate'
        | 'Next month'
        | 'Under Construction'
        | undefined,
      cityName: req.query.cityName as string | undefined,
      state: req.query.state as string | undefined,
      status: req.query.status as string | undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined,
      maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms as string) : undefined,
      minBathrooms: req.query.minBathrooms
        ? parseInt(req.query.minBathrooms as string)
        : undefined,
      minArea: req.query.minArea ? parseFloat(req.query.minArea as string) : undefined,
      negotiable:
        req.query.negotiable === 'true' ? true : req.query.negotiable === 'false' ? false : undefined,
      swimmingPool: req.query.swimmingPool === 'true' ? true : undefined,
      gymnasium: req.query.gymnasium === 'true' ? true : undefined,
      coveredParking: req.query.coveredParking === 'true' ? true : undefined,
      security24h: req.query.security24h === 'true' ? true : undefined
    };

    const properties = await propertyService.getAllProperties(filters);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
};

export const getUserProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const properties = await propertyService.getUserProperties(userId);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user properties'
    });
  }
};

export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }

    if (!isValidUuid(propertyId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
      return;
    }

    const propertyData = buildPropertyPayload(req.body);
    const updatedProperty = await propertyService.updateProperty(propertyId, userId, propertyData);

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update property'
      });
    }
  }
};

export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const propertyId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }

    if (!isValidUuid(propertyId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
      return;
    }

    const property = await propertyService.deleteProperty(propertyId, userId);

    res.status(200).json({
      success: true,
      message: 'Property deactivated successfully',
      data: property
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate property'
      });
    }
  }
};

export const searchProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    const type = req.query.type as string | undefined;
    const city = req.query.city as string | undefined;
    const propertyName = req.query.propertyName as string | undefined;

    const filters = { q, type, city, propertyName };
    const hasFilter = q || type || city || propertyName;

    if (!hasFilter) {
      res.status(400).json({
        success: false,
        message: 'At least one filter (q, type, city, or propertyName) is required'
      });
      return;
    }

    const properties = await propertyService.searchProperties(filters);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to search properties'
      });
    }
  }
};
