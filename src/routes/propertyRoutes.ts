import { Router } from 'express';
import * as propertyController from '../controllers/propertyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/search', propertyController.searchProperties);

router.get('/', propertyController.getAllProperties);

router.get('/my-properties', authenticateToken, propertyController.getUserProperties);

router.get('/:id', propertyController.getPropertyById);

router.post('/', authenticateToken, propertyController.createProperty);

router.put('/:id', authenticateToken, propertyController.updateProperty);

router.delete('/:id', authenticateToken, propertyController.deleteProperty);

export default router;
