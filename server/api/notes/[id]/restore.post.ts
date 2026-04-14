import { prisma } from '../../../utils/prisma'
import { createAuthError } from '../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../utils/notes'

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
    throw createAuthError(404, 'Note not found')
  }

  const note = await prisma.note.update({
    where: {
      id: noteId,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  })

  return { note }
})
