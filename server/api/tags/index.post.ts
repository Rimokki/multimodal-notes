import { readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireNoteOwner } from '../../utils/notes'
import { createAuthError } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const body = await readBody(event) as { name?: string }

  const name = body.name?.trim()

  if (!name || name.length > 50) {
    throw createAuthError(400, '标签名不能为空且不超过50个字符')
  }

  const tag = await prisma.tag.upsert({
    where: {
      userId_name: { userId, name },
    },
    update: {},
    create: { userId, name },
  })

  return { tag }
})
