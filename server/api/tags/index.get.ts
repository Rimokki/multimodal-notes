import { getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireNoteOwner, normalizeKeyword } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const query = getQuery(event) as { q?: string }
  const keyword = normalizeKeyword(query.q)

  const where: any = { userId }

  if (keyword) {
    where.name = { contains: keyword }
  }

  const tags = await prisma.tag.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })

  return { tags }
})
