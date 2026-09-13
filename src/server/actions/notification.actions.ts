import {
  ActionResult,
  successResult,
  handleServiceError,
} from '@/lib/errors/result';
import {
  markAsRead,
  markAllAsRead,
  listNotifications,
  NotificationRepository,
  NotificationItem,
} from '@/server/services/notification.service';

export interface NotificationActionContext {
  userId: string;
  roleName: string;
  requestId?: string;
  repo?: NotificationRepository;
}

const fallbackRepo: NotificationRepository = {
  createNotification: async (d) => ({
    id: 'notif-' + Date.now(),
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...d,
  }),
  findNotificationById: async () => null,
  listUserNotifications: async () => [],
  markNotificationAsRead: async (org, id) => ({
    id,
    organizationId: org,
    userId: 'unknown',
    title: '',
    message: '',
    type: 'info',
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }),
  markAllNotificationsAsRead: async () => 0,
};

export async function markNotificationAsReadAction(
  params: {
    organizationId: string;
    notificationId: string;
  },
  context: NotificationActionContext
): Promise<ActionResult<NotificationItem>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const updated = await markAsRead({
      organizationId: params.organizationId,
      notificationId: params.notificationId,
      userId: context.userId,
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(updated);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'notification',
      action: 'action.mark_read',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function markAllNotificationsAsReadAction(
  params: {
    organizationId: string;
  },
  context: NotificationActionContext
): Promise<ActionResult<{ count: number }>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const count = await markAllAsRead({
      organizationId: params.organizationId,
      userId: context.userId,
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult({ count });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'notification',
      action: 'action.mark_all_read',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}

export async function listUserNotificationsAction(
  params: {
    organizationId: string;
    unreadOnly?: boolean;
  },
  context: NotificationActionContext
): Promise<ActionResult<NotificationItem[]>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const items = await listNotifications({
      organizationId: params.organizationId,
      userId: context.userId,
      unreadOnly: params.unreadOnly,
      repo: context.repo || fallbackRepo,
      requestId,
    });

    return successResult(items);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'notification',
      action: 'action.list_notifications',
      requestId,
      organizationId: params.organizationId,
      userId: context.userId,
    });
  }
}
