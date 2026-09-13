import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export type NotificationType = 'info' | 'warning' | 'success' | 'urgent';

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export interface NotificationRepository {
  createNotification(data: any): Promise<NotificationItem>;
  findNotificationById(organizationId: string, id: string): Promise<NotificationItem | null>;
  listUserNotifications(
    organizationId: string,
    userId: string,
    unreadOnly?: boolean
  ): Promise<NotificationItem[]>;
  markNotificationAsRead(organizationId: string, id: string): Promise<NotificationItem>;
  markAllNotificationsAsRead(organizationId: string, userId: string): Promise<number>;
}

export async function createNotification(params: {
  input: CreateNotificationInput;
  repo: NotificationRepository;
  requestId?: string;
}): Promise<NotificationItem> {
  const { input, repo, requestId } = params;

  const notif = await repo.createNotification({
    organizationId: input.organizationId,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type || 'info',
    link: input.link || null,
  });

  logger.info({
    module: 'notification',
    action: 'notification.created',
    requestId,
    organizationId: input.organizationId,
    userId: input.userId,
    message: `Notifikasi terkirim ke pengguna: ${input.title}`,
    context: {
      notificationId: notif.id,
      type: notif.type,
    },
  });

  return notif;
}

export async function listNotifications(params: {
  organizationId: string;
  userId: string;
  unreadOnly?: boolean;
  repo: NotificationRepository;
  requestId?: string;
}): Promise<NotificationItem[]> {
  const { organizationId, userId, unreadOnly, repo } = params;
  return repo.listUserNotifications(organizationId, userId, unreadOnly);
}

export async function markAsRead(params: {
  organizationId: string;
  notificationId: string;
  userId: string;
  repo: NotificationRepository;
  requestId?: string;
}): Promise<NotificationItem> {
  const { organizationId, notificationId, userId, repo, requestId } = params;

  const notif = await repo.findNotificationById(organizationId, notificationId);
  if (!notif) {
    throw new NotFoundError(`Notifikasi dengan ID "${notificationId}" tidak ditemukan`);
  }

  if (notif.userId !== userId) {
    throw new ForbiddenError('Anda tidak memiliki akses ke notifikasi ini');
  }

  const updated = await repo.markNotificationAsRead(organizationId, notificationId);

  logger.info({
    module: 'notification',
    action: 'notification.marked_read',
    requestId,
    organizationId,
    userId,
    message: 'Notifikasi ditandai telah dibaca',
    context: {
      notificationId,
    },
  });

  return updated;
}

export async function markAllAsRead(params: {
  organizationId: string;
  userId: string;
  repo: NotificationRepository;
  requestId?: string;
}): Promise<number> {
  const { organizationId, userId, repo, requestId } = params;

  const count = await repo.markAllNotificationsAsRead(organizationId, userId);

  logger.info({
    module: 'notification',
    action: 'notification.marked_all_read',
    requestId,
    organizationId,
    userId,
    message: `Semua notifikasi pengguna ditandai dibaca (${count} item)`,
    context: {
      count,
    },
  });

  return count;
}
