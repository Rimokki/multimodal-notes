import type { ServerFile } from 'nuxt-file-storage'
import { readdir, unlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { requireAccessUser, toUserInfo } from '../../utils/auth-session'

type UploadAvatarBody = {
  file?: ServerFile
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024

function isValidDataUrlPayload(content: string, mimeType: string): boolean {
  const prefix = `data:${mimeType};base64,`
  return content.startsWith(prefix)
}

function parseFileSize(size: unknown): number | null {
  const parsed = Number(size)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

function resolveStorageMountPath() {
  return process.env.FILE_STORAGE_MOUNT || resolve(process.cwd(), 'server/userFiles')
}

async function clearAvatarFolder(userId: number) {
  const avatarFolder = `users/${userId}/avatar`
  const absoluteFolder = join(resolveStorageMountPath(), avatarFolder)

  try {
    const files = await readdir(absoluteFolder, { withFileTypes: true })
    for (const entry of files) {
      if (!entry.isFile()) {
        continue
      }

      try {
        await unlink(join(absoluteFolder, entry.name))
      } catch {
        // Keep flow resilient if old file has been removed concurrently.
      }
    }
  } catch {
    // Folder may not exist before first upload.
  }
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)
  const body = await readBody<UploadAvatarBody>(event)

  const file = body.file
  if (!file) {
    throw createAuthError(400, 'File is required')
  }

  const mimeType = file.type?.trim()
  if (!mimeType || !mimeType.startsWith('image/')) {
    throw createAuthError(400, 'Only image file is supported')
  }

  if (typeof file.content !== 'string' || !isValidDataUrlPayload(file.content, mimeType)) {
    throw createAuthError(400, 'Invalid file payload')
  }

  const sizeBytes = parseFileSize(file.size)
  if (sizeBytes === null) {
    throw createAuthError(400, 'Invalid file size')
  }

  if (sizeBytes > MAX_AVATAR_SIZE) {
    throw createAuthError(400, 'Avatar file size exceeds 2MB')
  }

  await clearAvatarFolder(user.id)

  const avatarLocation = `users/${user.id}/avatar`
  const storedFileName = await storeFileLocally(file, 16, avatarLocation)
  const avatarUrl = `/api/auth/avatar/${storedFileName}`

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  })

  return {
    user: toUserInfo(updatedUser),
  }
})
