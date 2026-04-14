import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { buildNoteExcerpt, parseNoteId, requireNoteOwner } from '../../utils/notes'

type UpdateNoteBody = {
  title?: string
  content?: string
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const noteId = parseNoteId(event)
  const body = await readBody<UpdateNoteBody>(event)

  const title = typeof body.title === 'string' ? body.title.trim() : undefined
  const content = typeof body.content === 'string' ? body.content : undefined

  if (title !== undefined && title.length > 120) {
    throw createAuthError(400, 'Title is too long')
  }

  if (title === undefined && content === undefined) {
    throw createAuthError(400, 'Nothing to update')
  }

  const existing = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
  })

  if (!existing) {
    throw createAuthError(404, 'Note not found')
  }

  const nextContent = content !== undefined ? content : existing.content

  const note = await prisma.note.update({
    where: {
      id: noteId,
    },
    data: {
      title: title ?? existing.title,
      content: nextContent,
      rawText: buildNoteExcerpt(nextContent),
    },
  })

  return { note }
})
