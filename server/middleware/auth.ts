import { getCookie } from 'h3'
import { prisma } from '../utils/prisma'
import { getAuthConfig, hashRefreshToken } from '../utils/auth'
import { toUserInfo } from '../utils/auth-session'

export default defineEventHandler(async (event) => {
  // 检查是否已有 Authorization header（客户端 API 调用走这个路径）
  // 如果有，跳过 cookie 解析，交给 requireAccessUser 处理
  const authHeader = event.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return
  }

  const config = getAuthConfig()
  const refreshToken = getCookie(event, config.authRefreshCookieName)
  if (!refreshToken) {
    return
  }

  try {
    const refreshTokenHash = hashRefreshToken(refreshToken)
    const now = new Date()

    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    })

    if (!session || session.revokedAt || session.expiresAt <= now) {
      return
    }

    if (!session.user.isActive) {
      return
    }

    event.context.auth = {
      user: toUserInfo(session.user),
      sessionId: session.id,
    }
  } catch {
    // 静默失败 — 用户仅保持未认证状态
  }
})
