import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { parsePaginationParams } from '../../../utils/notes'
import type { AdminAction } from '../../../../generated/prisma/enums'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const query = getQuery(event)
  const { page, pageSize, offset, limit } = parsePaginationParams(query.page, query.pageSize)
  const keyword = query.keyword ? String(query.keyword).trim() : ''
  const action = query.action ? (String(query.action).trim() as AdminAction) : undefined

  const where: Record<string, unknown> = {}
  if (action) {
    where.action = action
  }
  if (keyword) {
    where.admin = {
      OR: [{ email: { contains: keyword } }, { username: { contains: keyword } }],
    }
  }

  const [total, logs] = await Promise.all([
    prisma.adminLog.count({ where }),
    prisma.adminLog.findMany({
      where,
      include: {
        admin: {
          select: { id: true, email: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
  ])

  return { total, page, pageSize, logs }
})
