import type { H3Event } from 'h3'
import { getRouterParam } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { createAuthError } from '../../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../../utils/notes'

function parseAssetId(event: H3Event): number {
  const rawId = getRouterParam(event, 'assetId')
  const assetId = Number(rawId)

  if (!rawId || !Number.isInteger(assetId) || assetId <= 0) {
    throw createAuthError(400, 'Invalid asset id')
  }

  return assetId
}

function splitStorageKey(storageKey: string): { filelocation: string; filename: string } | null {
  const normalized = storageKey.replace(/\\/g, '/').replace(/^\/+/, '')
  const segments = normalized.split('/').filter(Boolean)
  const filename = segments.pop()

  if (!filename) {
    return null
  }

  return {
    filelocation: segments.join('/'),
    filename,
  }
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const assetId = parseAssetId(event)

  const existing = await prisma.noteAsset.findFirst({
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

  if (!existing) {
    throw createAuthError(404, 'Asset not found')
  }

  if (existing.storageKey) {
    const target = splitStorageKey(existing.storageKey)
    if (target) {
      try {
        await deleteFile(target.filename, target.filelocation)
      } catch {
        // Ignore missing file or IO failure and keep DB state consistent.
      }
    }
  }

  const asset = await prisma.noteAsset.update({
    where: {
      id: assetId,
    },
    data: {
      deletedAt: new Date(),
      storageKey: null,
    },
  })

  return { asset }
})
