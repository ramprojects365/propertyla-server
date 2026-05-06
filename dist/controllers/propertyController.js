import * as propertyService from '../services/propertyService.js';
import { AppError } from '../utils/errors.js';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (value) => UUID_REGEX.test(value);
export const createProperty = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const body = req.body;
        // Explicitly parse numeric fields so they arrive as proper types
        // even if the client sends them as strings.
        const amenities = body.amenities &&
            typeof body.amenities === 'object' &&
            !Array.isArray(body.amenities)
            ? body.amenities
            : { lifestyle: [], facilities: [], security: [] };
        const propertyData = {
            title: body.title,
            description: body.description,
            listingType: body.listingType,
            propertyType: body.propertyType,
            tenure: body.tenure,
            propertyName: body.propertyName,
            streetName: body.streetName,
            cityName: body.cityName,
            state: body.state,
            county: body.county,
            pincode: body.pincode,
            landmark: body.landmark,
            furnishing: body.furnishing,
            availability: body.availability,
            floorLevel: body.floorLevel,
            status: body.status ?? 'active',
            negotiable: typeof body.negotiable === 'boolean' ? body.negotiable : body.negotiable === true || body.negotiable === 'true',
            images: Array.isArray(body.images) ? body.images : undefined,
            amenities,
            // Parse numeric fields explicitly
            price: body.price !== undefined ? parseFloat(body.price) : undefined,
            buildupArea: body.buildupArea !== undefined ? parseFloat(body.buildupArea) : undefined,
            bedrooms: body.bedrooms !== undefined ? parseInt(body.bedrooms, 10) : undefined,
            bathrooms: body.bathrooms !== undefined ? parseInt(body.bathrooms, 10) : undefined,
            yearOfBuild: body.yearOfBuild !== undefined ? parseInt(body.yearOfBuild, 10) : undefined,
            userId,
        };
        const property = await propertyService.createProperty(propertyData);
        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: property
        });
    }
    catch (error) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to create property'
            });
        }
    }
};
export const getPropertyById = async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch property'
            });
        }
    }
};
export const getAllProperties = async (req, res) => {
    try {
        const filters = {
            listingType: req.query.listingType,
            propertyType: req.query.propertyType,
            tenure: req.query.tenure,
            furnishing: req.query.furnishing,
            availability: req.query.availability,
            cityName: req.query.cityName,
            state: req.query.state,
            status: req.query.status,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms) : undefined,
            maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms) : undefined,
            minBathrooms: req.query.minBathrooms
                ? parseInt(req.query.minBathrooms)
                : undefined,
            minArea: req.query.minArea ? parseFloat(req.query.minArea) : undefined,
            negotiable: req.query.negotiable === 'true' ? true : req.query.negotiable === 'false' ? false : undefined,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch properties'
        });
    }
};
export const getUserProperties = async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user properties'
        });
    }
};
export const updateProperty = async (req, res) => {
    try {
        const userId = req.user?.id;
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
        const updatedProperty = await propertyService.updateProperty(propertyId, userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Property updated successfully',
            data: updatedProperty
        });
    }
    catch (error) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to update property'
            });
        }
    }
};
export const deleteProperty = async (req, res) => {
    try {
        const userId = req.user?.id;
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
    }
    catch (error) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to deactivate property'
            });
        }
    }
};
export const searchProperties = async (req, res) => {
    try {
        const q = req.query.q;
        const type = req.query.type;
        const city = req.query.city;
        const propertyName = req.query.propertyName;
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
    }
    catch (error) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to search properties'
            });
        }
    }
};
//# sourceMappingURL=propertyController.js.map