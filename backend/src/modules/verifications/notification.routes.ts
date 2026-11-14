import { Router } from 'express';
import { notificationController } from './notification.controller';
import { optionalAuthenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/', optionalAuthenticate, notificationController.listNotifications);
router.patch('/read-all', optionalAuthenticate, notificationController.markAllAsRead);
router.patch('/:id/read', optionalAuthenticate, notificationController.markAsRead);

export default router;
