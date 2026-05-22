import { prisma } from '../../../../utils/prisma'
import { createAuthError } from '../../../../utils/auth'
import { requireNoteOwner } from '../../../../utils/notes'
import { getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const rawId = getRouterParam(event, 'id')
  const noteId = Number(rawId)

  if (!rawId || !Number.isInteger(noteId) || noteId <= 0) {
    throw createAuthError(400, 'Invalid note id')
  }

  const note = await prisma.note.findFirst({
    where: { id: noteId, isPublic: true, isDeleted: false },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const existingLike = await prisma.like.findUnique({
    where: { userId_noteId: { userId, noteId } },
  })

  if (existingLike) {
    await prisma.like.delete({
      where: { userId_noteId: { userId, noteId } },
    })
  } else {
    await prisma.like.create({
      data: { userId, noteId },
    })
  }

  const likeCount = await prisma.like.count({ where: { noteId } })

  return { liked: !existingLike, likeCount }
})
