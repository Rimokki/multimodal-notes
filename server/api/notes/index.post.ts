import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { buildNoteExcerpt, requireNoteOwner } from '../../utils/notes'

type CreateNoteBody = {
  title?: string
  content?: string
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const body = await readBody<CreateNoteBody>(event)

  const title = body.title?.trim() || '无标题笔记'
  const content = body.content?.trim() || ''

  if (title.length > 120) {
    throw createAuthError(400, 'Title is too long')
  }

  const note = await prisma.note.create({
    data: {
      userId,
      title,
      content,
      rawText: buildNoteExcerpt(content),
    },
  })

  return { note }
})
