import { describe, it, expect, vi } from 'vitest';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  listUserNotificationsAction,
} from '@/server/actions/notification.actions';
import { NotificationRepository } from '@/server/services/notification.service';

describe('Notification Server Actions', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const userId = 'usr-1';
  const otherUserId = 'usr-2';
  const notifId = 'notif-1';

  const mockRepo: NotificationRepository = {
    createNotification: vi.fn(),
    findNotificationById: vi.fn().mockImplementation(async (org, id) => {
      if (id === notifId) {
        return {
          id: notifId,
          organizationId: org,
          userId,
          title: 'Iuran Jatuh Tempo',
          message: 'Segera bayar',
          type: 'warning',
          isRead: false,
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
        message: 'Segera bayar',
        type: 'warning',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]),
    markNotificationAsRead: vi.fn().mockImplementation(async (org, id) => ({
      id,
      organizationId: org,
      userId,
      title: 'Iuran Jatuh Tempo',
      message: 'Segera bayar',
      type: 'warning',
      isRead: true,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })),
    markAllNotificationsAsRead: vi.fn().mockResolvedValue(4),
  };

  const userContext = {
    userId,
    roleName: 'Member',
    repo: mockRepo,
    requestId: 'req-notif-act',
  };

  const otherContext = {
    userId: otherUserId,
    roleName: 'Member',
    repo: mockRepo,
    requestId: 'req-notif-other',
  };

  describe('markNotificationAsReadAction', () => {
    it('should mark notification as read and return successful ActionResult', async () => {
      const res = await markNotificationAsReadAction(
        { organizationId: orgId, notificationId: notifId },
        userContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.isRead).toBe(true);
      }
    });

    it('should return error ActionResult on unauthorized ownership', async () => {
      const res = await markNotificationAsReadAction(
        { organizationId: orgId, notificationId: notifId },
        otherContext
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN');
      }
    });

    it('should return NOT_FOUND error when notification does not exist', async () => {
      const res = await markNotificationAsReadAction(
        { organizationId: orgId, notificationId: 'non-existent' },
        userContext
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('markAllNotificationsAsReadAction', () => {
    it('should mark all notifications as read and return count', async () => {
      const res = await markAllNotificationsAsReadAction(
        { organizationId: orgId },
        userContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.count).toBe(4);
      }
    });
  });

  describe('listUserNotificationsAction', () => {
    it('should return user notifications', async () => {
      const res = await listUserNotificationsAction(
        { organizationId: orgId },
        userContext
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.length).toBe(1);
      }
    });
  });
});
