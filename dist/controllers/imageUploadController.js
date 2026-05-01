import * as imageUploadService from '../services/imageUploadService.js';
export const uploadImages = async (req, res) => {
    try {
        console.log('Request files:', req.files);
        console.log('Request body:', req.body);
        const files = req.files;
        if (!files || files.length === 0) {
            console.log('No files found in request');
            res.status(400).json({
                success: false,
                message: 'No images provided'
            });
            return;
        }
        if (files.length > 10) {
            res.status(400).json({
                success: false,
                message: 'Maximum 10 images allowed'
            });
            return;
        }
        const imageUrls = await imageUploadService.uploadMultipleToSpaces(files);
        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: {
                imageUrls
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload images'
        });
    }
};
export const uploadSingleImage = async (req, res) => {
    try {
        console.log('Request file:', req.file);
        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                message: 'No image provided'
            });
            return;
        }
        const imageUrl = await imageUploadService.uploadToSpaces(file);
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
};
export const deleteImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
            return;
        }
        await imageUploadService.deleteFromSpaces(imageUrl);
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete image'
        });
    }
};
//# sourceMappingURL=imageUploadController.js.map