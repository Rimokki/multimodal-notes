import { prisma } from '../../utils/prisma'
import { createAuthError, hashPassword } from '../../utils/auth'
import { createSessionAndTokens, toUserInfo } from '../../utils/auth-session'

function isPrismaUniqueError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

type RegisterBody = {
  email?: string
  password?: string
  username?: string
  displayName?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const username = body.username?.trim() || null
  const displayName = body.displayName?.trim() || null

  if (!email || !password) {
    throw createAuthError(400, 'Email and password are required')
  }

  if (password.length < 8) {
    throw createAuthError(400, 'Password must be at least 8 characters')
  }

  const passwordHash = await hashPassword(password)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
      },
    })

    const tokenBundle = await createSessionAndTokens(event, user)

    return {
      user: toUserInfo(user),
      accessToken: tokenBundle.accessToken,
      accessTokenExpiresInSec: tokenBundle.accessTokenExpiresInSec,
    }
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw createAuthError(409, 'Email or username already exists')
    }
    throw error
  }
})
