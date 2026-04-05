import { prisma } from '../../utils/prisma'
import { requireAccessUser, clearRefreshCookie } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)

  await prisma.userSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  clearRefreshCookie(event)

  return {
    success: true,
  }
})
