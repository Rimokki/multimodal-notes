import type { ServerFile } from 'nuxt-file-storage'
import { prisma } from '../../../../utils/prisma'
import { createAuthError } from '../../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../../utils/notes'
import type { AssetKind } from '~~/generated/prisma/enums'

type UploadAssetBody = {
  file?: ServerFile
}

const FILE_MIME_WHITELIST = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
])

const MAX_SIZE_BY_KIND: Record<AssetKind, number> = {
  IMAGE: 10 * 1024 * 1024,
  AUDIO: 30 * 1024 * 1024,
  FILE: 20 * 1024 * 1024,
}

function resolveAssetKind(mimeType: string): AssetKind {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE'
  }

  if (mimeType.startsWith('audio/')) {
    return 'AUDIO'
  }

  if (FILE_MIME_WHITELIST.has(mimeType)) {
    return 'FILE'
  }

  throw createAuthError(400, 'Unsupported file type')
}

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

function getFileExt(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase().trim()
  return ext || null
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const body = await readBody<UploadAssetBody>(event)

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
      isDeleted: false,
    },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const file = body.file
  if (!file) {
    throw createAuthError(400, 'File is required')
  }

  const mimeType = file.type?.trim()
  if (!mimeType) {
    throw createAuthError(400, 'File type is required')
  }

  const fileType = resolveAssetKind(mimeType)

  if (typeof file.content !== 'string') {
    throw createAuthError(400, 'Invalid file payload')
  }

  if (!isValidDataUrlPayload(file.content, mimeType)) {
    throw createAuthError(400, 'Invalid file payload')
  }

  const sizeBytes = parseFileSize(file.size)
  if (sizeBytes === null) {
    throw createAuthError(400, 'Invalid file size')
  }

  if (sizeBytes > MAX_SIZE_BY_KIND[fileType]) {
    throw createAuthError(400, 'File size exceeds limit')
  }

  const fileName = file.name?.trim() || 'file'
  const fileExt = getFileExt(fileName)
  const fileLocation = `users/${userId}/notes/${noteId}`
  const storedFileName = await storeFileLocally(file, 16, fileLocation)
  const storageKey = `${fileLocation}/${storedFileName}`

  const maxOrder = await prisma.noteAsset.aggregate({
    where: {
      noteId,
      userId,
      deletedAt: null,
    },
    _max: {
      sortOrder: true,
    },
  })

  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1

  const created = await prisma.noteAsset.create({
    data: {
      noteId,
      userId,
      kind: fileType,
      sourceType: 'UPLOAD',
      storageKey,
      url: '',
      mimeType,
      fileName,
      fileExt,
      sizeBytes,
      status: 'READY',
      sortOrder,
    },
  })

  const url = `/api/notes/${noteId}/assets/${created.id}/file`

  const asset = await prisma.noteAsset.update({
    where: { id: created.id },
    data: { url },
  })

  return { asset }
})
