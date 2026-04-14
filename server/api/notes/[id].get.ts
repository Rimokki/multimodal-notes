import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  return { note }
})
