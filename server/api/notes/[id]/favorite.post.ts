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

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      isDeleted: false,
      OR: [
        { userId },
        { isPublic: true },
      ],
    },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const isOwnNote = note.userId === userId

  if (isOwnNote) {
    const nextFavorite = typeof body.isFavorite === 'boolean' ? body.isFavorite : !note.isFavorite

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { isFavorite: nextFavorite },
    })

    return { note: updated }
  }

  // Public note not owned by current user — toggle Favorite record
  const existing = await prisma.favorite.findUnique({
    where: { userId_noteId: { userId, noteId } },
  })

  let isFavorite: boolean
  if (typeof body.isFavorite === 'boolean') {
    isFavorite = body.isFavorite
    if (isFavorite && !existing) {
      await prisma.favorite.create({ data: { userId, noteId } })
    } else if (!isFavorite && existing) {
      await prisma.favorite.delete({ where: { userId_noteId: { userId, noteId } } })
    }
  } else {
    if (existing) {
      await prisma.favorite.delete({ where: { userId_noteId: { userId, noteId } } })
      isFavorite = false
    } else {
      await prisma.favorite.create({ data: { userId, noteId } })
      isFavorite = true
    }
  }

  return { note: { ...note, isFavorite } }
})
