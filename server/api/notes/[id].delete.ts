import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../utils/notes'

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

  await prisma.note.delete({
    where: {
      id: noteId,
    },
  })

  return { success: true }
})
