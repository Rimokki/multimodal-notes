import type { H3Event } from 'h3'
import { getCookie, getRouterParam, sendStream } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { createAuthError, getAuthConfig, hashRefreshToken } from '../../../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../../../utils/notes'

function parseAssetId(event: H3Event): number {
  const rawId = getRouterParam(event, 'assetId')
  const assetId = Number(rawId)

  if (!rawId || !Number.isInteger(assetId) || assetId <= 0) {
    throw createAuthError(400, 'Invalid asset id')
  }

  return assetId
}

function splitStorageKey(storageKey: string): { filelocation: string; filename: string } {
  const normalized = storageKey.replace(/\\/g, '/').replace(/^\/+/, '')
  const segments = normalized.split('/').filter(Boolean)
  const filename = segments.pop()

  if (!filename) {
    throw createAuthError(404, 'Asset file not found')
  }

  return {
    filelocation: segments.join('/'),
    filename,
  }
}

async function resolveUserId(event: H3Event): Promise<number> {
  try {
    return await requireNoteOwner(event)
  } catch {
    const config = getAuthConfig()
    const refreshToken = getCookie(event, config.authRefreshCookieName)

    if (!refreshToken) {
      throw createAuthError(401, 'Missing access token')
    }

    const refreshTokenHash = hashRefreshToken(refreshToken)
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    })

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw createAuthError(401, 'Invalid session')
    }

    return session.user.id
  }
}

export default defineEventHandler(async (event) => {
  const userId = await resolveUserId(event)
  const noteId = parseNoteId(event)
  const assetId = parseAssetId(event)

  const asset = await prisma.noteAsset.findFirst({
    where: {
      id: assetId,
      noteId,
      userId,
      deletedAt: null,
      note: {
        isDeleted: false,
      },
    },
  })

  if (!asset || !asset.storageKey) {
    throw createAuthError(404, 'Asset not found')
  }

  const { filelocation, filename } = splitStorageKey(asset.storageKey)
  const stream = await retrieveFileLocally(event, filename, filelocation)
  return sendStream(event, stream as any)
})
