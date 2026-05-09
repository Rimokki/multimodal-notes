import { prisma } from '../../../utils/prisma'
import { parseNoteId, requireNoteOwner } from '../../../utils/notes'
import { createAuthError } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { id: true },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const noteTags = await prisma.noteTag.findMany({
    where: { noteId },
    include: { tag: true },
    orderBy: { createdAt: 'asc' },
  })

  return { tags: noteTags.map((nt) => nt.tag) }
})
