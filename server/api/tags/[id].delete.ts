import { getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireNoteOwner } from '../../utils/notes'
import { createAuthError } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const rawId = getRouterParam(event, 'id')
  const tagId = Number(rawId)

  if (!rawId || !Number.isInteger(tagId) || tagId <= 0) {
    throw createAuthError(400, 'Invalid tag id')
  }

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  })

  if (!tag) {
    throw createAuthError(404, 'Tag not found')
  }

  await prisma.noteTag.deleteMany({ where: { tagId } })
  await prisma.tag.delete({ where: { id: tagId } })

  return { success: true }
})
