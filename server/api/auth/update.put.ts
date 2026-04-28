import { prisma } from '../../utils/prisma'
import { createAuthError, hashPassword, verifyPassword } from '../../utils/auth'
import { requireAccessUser, toUserInfo } from '../../utils/auth-session'

type UpdateProfileBody = {
  email?: string
  username?: string | null
  avatarUrl?: string | null
  password?: string
  oldPassword?: string
  newPassword?: string
}

function isPrismaUniqueError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)
  const body = await readBody<UpdateProfileBody>(event)

  const updateData: {
    email?: string
    username?: string | null
    avatarUrl?: string | null
    passwordHash?: string
  } = {}

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase()
    if (!email || !isValidEmail(email)) {
      throw createAuthError(400, 'Invalid email format')
    }
    updateData.email = email
  }

  if (body.username !== undefined) {
    const normalized = body.username?.trim() || null
    if (normalized && !isValidUsername(normalized)) {
      throw createAuthError(400, 'Username must be 3-20 chars of letters, numbers, or underscore')
    }
    updateData.username = normalized
  }

  if (body.avatarUrl !== undefined) {
    const normalized = body.avatarUrl?.trim() || null
    if (normalized) {
      try {
        // Keep validation minimal: require a parseable absolute URL.
        new URL(normalized)
      } catch {
        throw createAuthError(400, 'Invalid avatar URL')
      }
    }
    updateData.avatarUrl = normalized
  }

  if (body.password !== undefined) {
    const password = body.password.trim()
    if (password.length < 8) {
      throw createAuthError(400, 'Password must be at least 8 characters')
    }
    updateData.passwordHash = await hashPassword(password)
  }

  if (body.newPassword !== undefined || body.oldPassword !== undefined) {
    const oldPassword = body.oldPassword?.trim() || ''
    const newPassword = body.newPassword?.trim() || ''

    if (!oldPassword || !newPassword) {
      throw createAuthError(400, 'Old password and new password are required')
    }

    if (newPassword.length < 8) {
      throw createAuthError(400, 'Password must be at least 8 characters')
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!dbUser) {
      throw createAuthError(404, 'User not found')
    }

    const matched = await verifyPassword(oldPassword, dbUser.passwordHash)
    if (!matched) {
      throw createAuthError(400, 'Old password is incorrect')
    }

    updateData.passwordHash = await hashPassword(newPassword)
  }

  if (Object.keys(updateData).length === 0) {
    throw createAuthError(400, 'No valid fields to update')
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })

    return {
      user: toUserInfo(updatedUser),
    }
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      throw createAuthError(409, 'Email or username already exists')
    }
    throw error
  }
})
