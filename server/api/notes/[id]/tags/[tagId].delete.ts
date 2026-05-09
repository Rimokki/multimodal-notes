import { getRouterParam } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseNoteId, requireNoteOwner } from '../../../../utils/notes'
import { createAuthError } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const rawTagId = getRouterParam(event, 'tagId')
  const tagId = Number(rawTagId)

  if (!rawTagId || !Number.isInteger(tagId) || tagId <= 0) {
    throw createAuthError(400, 'Invalid tag id')
  }

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { id: true },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  await prisma.noteTag.deleteMany({
    where: { noteId, tagId },
  })

  const remaining = await prisma.noteTag.count({ where: { tagId } })
  if (remaining === 0) {
    await prisma.tag.delete({ where: { id: tagId } })
  }

  return { success: true }
})
