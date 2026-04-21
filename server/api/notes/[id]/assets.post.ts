import { prisma } from '../../../utils/prisma'
import { createAuthError } from '../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../utils/notes'
import type { AssetKind, AssetSourceType, AssetStatus } from '../../../../generated/prisma/client'

type CreateNoteAssetBody = {
  kind?: AssetKind
  sourceType?: AssetSourceType
  storageKey?: string | null
  url?: string
  mimeType?: string
  fileName?: string | null
  fileExt?: string | null
  sizeBytes?: number
  width?: number | null
  height?: number | null
  durationMs?: number | null
  checksum?: string | null
  ocrText?: string | null
  status?: AssetStatus
  sortOrder?: number
}

const ASSET_KINDS: AssetKind[] = ['IMAGE', 'AUDIO', 'FILE']
const SOURCE_TYPES: AssetSourceType[] = ['UPLOAD', 'EXTERNAL']
const STATUS_TYPES: AssetStatus[] = ['PENDING', 'READY', 'FAILED']

function trimOptional(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return value
}

function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null
  }

  return value
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const body = await readBody<CreateNoteAssetBody>(event)

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

  if (!body.kind || !ASSET_KINDS.includes(body.kind)) {
    throw createAuthError(400, 'Invalid asset kind')
  }

  const sourceType =
    body.sourceType && SOURCE_TYPES.includes(body.sourceType) ? body.sourceType : 'UPLOAD'

  const status = body.status && STATUS_TYPES.includes(body.status) ? body.status : 'READY'
  const url = trimOptional(body.url)
  const mimeType = trimOptional(body.mimeType)
  const sizeBytes = parsePositiveNumber(body.sizeBytes)

  if (!url) {
    throw createAuthError(400, 'Asset url is required')
  }

  if (!mimeType) {
    throw createAuthError(400, 'Asset mimeType is required')
  }

  if (sizeBytes === null) {
    throw createAuthError(400, 'Asset sizeBytes must be a positive number')
  }

  const sortOrder = parseNonNegativeInt(body.sortOrder) ?? 0

  const asset = await prisma.noteAsset.create({
    data: {
      noteId,
      userId,
      kind: body.kind,
      sourceType,
      storageKey: trimOptional(body.storageKey),
      url,
      mimeType,
      fileName: trimOptional(body.fileName),
      fileExt: trimOptional(body.fileExt),
      sizeBytes,
      width: parseNonNegativeInt(body.width),
      height: parseNonNegativeInt(body.height),
      durationMs: parseNonNegativeInt(body.durationMs),
      checksum: trimOptional(body.checksum),
      ocrText: trimOptional(body.ocrText),
      status,
      sortOrder,
    },
  })

  return { asset }
})
