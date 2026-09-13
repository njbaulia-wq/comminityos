import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  NotificationRepository,
} from '@/server/services/notification.service';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('In-App Notification Service', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const userId = 'usr-1';
  const otherUserId = 'usr-2';
  const notifId = 'notif-1';

  let mockRepo: NotificationRepository;

  beforeEach(() => {
    mockRepo = {
      createNotification: vi.fn().mockImplementation(async (d) => ({
        id: 'new-notif',
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        ...d,
      })),
      findNotificationById: vi.fn().mockImplementation(async (org, id) => {
        if (id === notifId) {
          return {
            id: notifId,
            organizationId: org,
            userId,
            title: 'Iuran Jatuh Tempo',
            message: 'Iuran September jatuh tempo dalam 3 hari',
            type: 'warning',
            link: '/finance',
            isRead: false,
            readAt: null,
            createdAt: new Date().toISOString(),
          };
        }
        return null;
      }),
      listUserNotifications: vi.fn().mockResolvedValue([
        {
          id: notifId,
          organizationId: orgId,
          userId,
          title: 'Iuran Jatuh Tempo',
          message: 'Iuran September jatuh tempo dalam 3 hari',
          type: 'warning',
          link: '/finance',
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ]),
      markNotificationAsRead: vi.fn().mockImplementation(async (org, id) => ({
        id,
        organizationId: org,
        userId,
        title: 'Iuran Jatuh Tempo',
        message: 'Iuran September jatuh tempo dalam 3 hari',
        type: 'warning',
        link: '/finance',
        isRead: true,
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })),
      markAllNotificationsAsRead: vi.fn().mockResolvedValue(3),
    };
  });

  describe('createNotification', () => {
    it('should create notification and record log', async () => {
      const notif = await createNotification(
        {
          input: {
            organizationId: orgId,
            userId,
            title: 'Tugas Baru Ditugaskan',
            message: 'Anda ditugaskan pada tugas: Bersihkan Pos',
            type: 'info',
            link: '/tasks',
          },
          repo: mockRepo,
        }
      );

      expect(notif.title).toBe('Tugas Baru Ditugaskan');
      expect(mockRepo.createNotification).toHaveBeenCalled();
    });
  });

  describe('listNotifications', () => {
    it('should fetch notifications only for the authenticated user', async () => {
      const list = await listNotifications({
        organizationId: orgId,
        userId,
        repo: mockRepo,
      });

      expect(list.length).toBe(1);
      expect(mockRepo.listUserNotifications).toHaveBeenCalledWith(orgId, userId, undefined);
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read when owned by user', async () => {
      const updated = await markAsRead({
        organizationId: orgId,
        notificationId: notifId,
        userId,
        repo: mockRepo,
      });

      expect(updated.isRead).toBe(true);
      expect(mockRepo.markNotificationAsRead).toHaveBeenCalledWith(orgId, notifId);
    });

    it('should reject when user attempts to mark another user notification', async () => {
      await expect(
        markAsRead({
          organizationId: orgId,
          notificationId: notifId,
          userId: otherUserId,
          repo: mockRepo,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      await expect(
        markAsRead({
          organizationId: orgId,
          notificationId: 'non-existent',
          userId,
          repo: mockRepo,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      const count = await markAllAsRead({
        organizationId: orgId,
        userId,
        repo: mockRepo,
      });

      expect(count).toBe(3);
      expect(mockRepo.markAllNotificationsAsRead).toHaveBeenCalledWith(orgId, userId);
    });
  });
});
