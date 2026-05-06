import { prisma } from '../../utils/prisma'
import { requireAdminUser } from '../../utils/auth-session'

function getDateRange() {
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function groupByDate(records: { createdAt: Date }[]) {
  const map = new Map<string, number>()
  for (const r of records) {
    const key = r.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const now = new Date()
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)

  const [totalUsers, totalNotes, activeUsers, recentUsers, recentUserRecords, recentNoteRecords] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.note.count(),
    prisma.user.count({
      where: { role: 'USER', lastLoginAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: { role: 'USER', createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.findMany({
      where: { role: 'USER', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.note.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  const dates = getDateRange()
  const userMap = groupByDate(recentUserRecords)
  const noteMap = groupByDate(recentNoteRecords)

  const userTrend = dates.map(d => userMap.get(d) ?? 0)
  const noteTrend = dates.map(d => noteMap.get(d) ?? 0)

  return { totalUsers, totalNotes, activeUsers, recentUsers, dates, userTrend, noteTrend }
})
