import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../utils/notes'

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

  const existing = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
      isDeleted: true,
    },
  })

  if (!existing) {
    throw createAuthError(404, 'Note not found in recycle bin')
  }

  const assets = await prisma.noteAsset.findMany({
    where: {
      noteId,
      userId,
      storageKey: {
        not: null,
      },
    },
    select: {
      storageKey: true,
    },
  })

  for (const asset of assets) {
    if (!asset.storageKey) {
      continue
    }

    const target = splitStorageKey(asset.storageKey)
    if (!target) {
      continue
    }

    try {
      await deleteFile(target.filename, target.filelocation)
    } catch {
      // Keep purge flow resilient even if local file has been removed already.
    }
  }

  const noteTags = await prisma.noteTag.findMany({
    where: { noteId },
    select: { tagId: true },
  })
  const tagIds = noteTags.map((nt) => nt.tagId)

  await prisma.noteTag.deleteMany({ where: { noteId } })
  await prisma.note.delete({
    where: {
      id: noteId,
    },
  })

  for (const tagId of tagIds) {
    const count = await prisma.noteTag.count({ where: { tagId } })
    if (count === 0) {
      await prisma.tag.delete({ where: { id: tagId } })
    }
  }

  return { success: true }
})
