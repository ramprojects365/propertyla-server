import AWS from 'aws-sdk';
import crypto from 'crypto';
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;
if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
}
/**
 * Generate a unique file identifier
 */
const generateUniqueIdentifier = () => {
    return crypto.randomBytes(8).toString('hex');
};
/**
 * Upload a single image to S3
 */
export const uploadImageToS3 = async (file, folderPath = 'uploads') => {
    const fileExtension = file.originalname.split('.').pop();
    const timestamp = Date.now();
    const uniqueId = generateUniqueIdentifier();
    const key = `${folderPath}/${timestamp}-${uniqueId}.${fileExtension}`;
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read'
    };
    try {
        const result = await s3.upload(params).promise();
        // Return CloudFront URL if configured, otherwise S3 URL
        return result.Location.replace(`https://${BUCKET_NAME}.s3.amazonaws.com`, AWS_CLOUDFRONT_URL);
    }
    catch (error) {
        console.error('S3 upload error:', error);
        throw new Error(`Failed to upload image to S3: ${error}`);
    }
};
/**
 * Upload multiple images to S3
 */
export const uploadMultipleImagesToS3 = async (files, folderPath = 'uploads') => {
    if (files.length > 10) {
        throw new Error('Maximum 10 images allowed');
    }
    const uploadPromises = files.map(file => uploadImageToS3(file, folderPath));
    try {
        const urls = await Promise.all(uploadPromises);
        return urls;
    }
    catch (error) {
        console.error('Bulk S3 upload error:', error);
        throw new Error(`Failed to upload images to S3: ${error}`);
    }
};
/**
 * Delete a single image from S3
 */
export const deleteImageFromS3 = async (imageUrl) => {
    try {
        // Extract S3 key from URL
        const urlParts = new URL(imageUrl);
        const key = urlParts.pathname.substring(1); // Remove leading slash
        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };
        await s3.deleteObject(params).promise();
    }
    catch (error) {
        console.error('S3 delete error:', error);
        throw new Error(`Failed to delete image from S3: ${error}`);
    }
};
/**
 * Delete multiple images from S3
 */
export const deleteMultipleImagesFromS3 = async (imageUrls) => {
    const deletePromises = imageUrls.map(url => deleteImageFromS3(url));
    try {
        await Promise.all(deletePromises);
    }
    catch (error) {
        console.error('Bulk S3 delete error:', error);
        throw new Error(`Failed to delete images from S3: ${error}`);
    }
};
/**
 * Get S3 signed URL (for private files)
 */
export const getSignedUrl = async (imageUrl, expiresIn = 3600) => {
    try {
        const urlParts = new URL(imageUrl);
        const key = urlParts.pathname.substring(1);
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: expiresIn
        });
        return signedUrl;
    }
    catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error(`Failed to generate signed URL: ${error}`);
    }
};
//# sourceMappingURL=s3UploadService.js.map