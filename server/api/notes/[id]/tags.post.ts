import { readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { parseNoteId, requireNoteOwner } from '../../../utils/notes'
import { createAuthError } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const body = await readBody(event) as { tagId?: number }

  if (!body.tagId || !Number.isInteger(body.tagId)) {
    throw createAuthError(400, 'Invalid tag id')
  }

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { id: true },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const tag = await prisma.tag.findFirst({
    where: { id: body.tagId, userId },
  })

  if (!tag) {
    throw createAuthError(404, 'Tag not found')
  }

  await prisma.noteTag.upsert({
    where: {
      noteId_tagId: { noteId, tagId: tag.id },
    },
    update: {},
    create: { noteId, tagId: tag.id },
  })

  return { tag }
})
