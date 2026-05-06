import type { H3Event } from 'h3'
import { getRouterParam } from 'h3'
import { createAuthError } from './auth'
import { requireAccessUser } from './auth-session'

export type ParsedPagination = {
  page: number
  pageSize: number
  offset: number
  limit: number
}

export async function requireNoteOwner(event: H3Event) {
  const { user } = await requireAccessUser(event)
  return user.id
}

export function parseNoteId(event: H3Event): number {
  const rawId = getRouterParam(event, 'id')
  const noteId = Number(rawId)

  if (!rawId || !Number.isInteger(noteId) || noteId <= 0) {
    throw createAuthError(400, 'Invalid note id')
  }

  return noteId
}

export function normalizeKeyword(value: string | undefined): string | null {
  const keyword = value?.trim()
  if (!keyword) {
    return null
  }
  return keyword.slice(0, 100)
}

export function buildNoteExcerpt(content: string): string {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePositiveInt(value: unknown): number | null {
  const normalized = Array.isArray(value) ? value[0] : value
  const parsed = Number(normalized)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function parsePaginationParams(page?: unknown, pageSize?: unknown): ParsedPagination {
  const DEFAULT_PAGE = 1
  const DEFAULT_PAGE_SIZE = 5
  const MAX_PAGE_SIZE = 100

  const parsedPage = parsePositiveInt(page) ?? DEFAULT_PAGE
  const parsedPageSize = Math.min(parsePositiveInt(pageSize) ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const offset = (parsedPage - 1) * parsedPageSize
  const limit = parsedPageSize

  return { page: parsedPage, pageSize: parsedPageSize, offset, limit }
}
