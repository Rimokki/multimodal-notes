import { prisma } from './prisma'

export async function createBroadcastNotification(
  title: string,
  content: string,
  senderId: number,
) {
  return prisma.notification.create({
    data: {
      type: 'BROADCAST',
      title,
      content,
      senderId,
      userId: null,
    },
  })
}

export async function createTargetedNotification(
  title: string,
  content: string,
  senderId: number,
  targetUserId: number,
) {
  return prisma.notification.create({
    data: {
      type: 'TARGETED',
      title,
      content,
      senderId,
      userId: targetUserId,
    },
  })
}
