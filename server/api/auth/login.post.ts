import { prisma } from '../../utils/prisma'
import { createAuthError, verifyPassword } from '../../utils/auth'
import { createSessionAndTokens, toUserInfo } from '../../utils/auth-session'

type LoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()

  if (!email || !password) {
    throw createAuthError(400, 'Email and password are required')
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw createAuthError(401, 'Invalid credentials')
  }

  if (!user.isActive) {
    throw createAuthError(403, '用户已被禁用，请联系管理员')
  }

  const matched = await verifyPassword(password, user.passwordHash)
  if (!matched) {
    throw createAuthError(401, 'Invalid credentials')
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const tokenBundle = await createSessionAndTokens(event, updatedUser)

  return {
    user: toUserInfo(updatedUser),
    accessToken: tokenBundle.accessToken,
    accessTokenExpiresInSec: tokenBundle.accessTokenExpiresInSec,
  }
})
