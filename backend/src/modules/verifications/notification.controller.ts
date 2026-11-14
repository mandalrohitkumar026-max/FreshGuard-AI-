import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { NotificationModel } from '../../models/Notification';
import { isMongoConnected } from '../../services/sessionStore';
import { freshnessWatchService } from './freshnessWatchService';
import mongoose from 'mongoose';

export class NotificationController {
  listNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    if (isMongoConnected() && userId && mongoose.Types.ObjectId.isValid(userId)) {
      const dbNotifications = await NotificationModel.find({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await NotificationModel.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false,
      });

      return ApiResponse.ok(
        res,
        {
          total: dbNotifications.length,
          unreadCount,
          notifications: dbNotifications,
        },
        'Notifications retrieved',
      );
    }

    // In-memory fallback
    const memoryAlerts = freshnessWatchService.getAllAlerts(userId);
    return ApiResponse.ok(
      res,
      {
        total: memoryAlerts.length,
        unreadCount: memoryAlerts.filter((a) => !a.read).length,
        notifications: memoryAlerts.map((a) => ({
          id: a.id,
          title: `Drift Alert: ${a.type}`,
          message: a.message,
          type: a.type,
          read: a.read,
          createdAt: a.timestamp,
        })),
      },
      'Notifications retrieved',
    );
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const query: any = { _id: id };
      if (req.userId && req.userId !== '000000000000000000000001' && req.userRole !== 'admin') {
        query.userId = new mongoose.Types.ObjectId(req.userId);
      }
      await NotificationModel.findOneAndUpdate(query, {
        read: true,
        readAt: new Date(),
      });
    }

    return ApiResponse.ok(res, { success: true }, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    if (isMongoConnected() && userId && mongoose.Types.ObjectId.isValid(userId)) {
      await NotificationModel.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), read: false },
        { read: true, readAt: new Date() },
      );
    }

    return ApiResponse.ok(res, { success: true }, 'All notifications marked as read');
  });
}

export const notificationController = new NotificationController();
