import { prisma } from '../../../utils/prisma'
import { createAuthError } from '../../../utils/auth'
import { parseNoteId, requireNoteOwner } from '../../../utils/notes'

type FavoriteBody = {
  isFavorite?: boolean
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const body = await readBody<FavoriteBody>(event)

  const existing = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
      isDeleted: false,
    },
  })

  if (!existing) {
    throw createAuthError(404, 'Note not found')
  }

  const nextFavorite = typeof body.isFavorite === 'boolean' ? body.isFavorite : !existing.isFavorite

  const note = await prisma.note.update({
    where: {
      id: noteId,
    },
    data: {
      isFavorite: nextFavorite,
    },
  })

  return { note }
})
