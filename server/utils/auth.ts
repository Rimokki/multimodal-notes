import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

const scryptAsync = promisify(scrypt)

type JwtHeader = {
  alg: 'HS256'
  typ: 'JWT'
}

type JwtPayloadBase = {
  exp: number
  iat: number
}

export type AccessTokenPayload = JwtPayloadBase & {
  sub: number
  email: string
  sid: string
}

export type AuthRuntimeConfig = {
  authSecret: string
  authAccessTokenTtlSec: number
  authRefreshTokenTtlSec: number
  authRefreshCookieName: string
  authCookieSecure: boolean
}

export function getAuthConfig(): AuthRuntimeConfig {
  const runtimeConfig = useRuntimeConfig()

  return {
    authSecret: String(runtimeConfig.authSecret || 'dev-only-change-me'),
    authAccessTokenTtlSec: Number(runtimeConfig.authAccessTokenTtlSec || 900),
    authRefreshTokenTtlSec: Number(runtimeConfig.authRefreshTokenTtlSec || 60 * 60 * 24 * 30),
    authRefreshCookieName: String(runtimeConfig.authRefreshCookieName || 'mn_refresh_token'),
    authCookieSecure: Boolean(runtimeConfig.authCookieSecure),
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function decodeJsonPart<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex')
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [salt, savedHash] = passwordHash.split(':')
  if (!salt || !savedHash) {
    return false
  }

  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return safeEqual(derived.toString('hex'), savedHash)
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, keyof JwtPayloadBase>,
  secret: string,
  ttlSec: number,
): string {
  const now = Math.floor(Date.now() / 1000)
  const body: AccessTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSec,
  }

  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(body))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(data).digest('base64url')

  return `${data}.${signature}`
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [header, payload, signature] = parts
  if (!header || !payload || !signature) {
    return null
  }

  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  if (!safeEqual(expected, signature)) {
    return null
  }

  const decoded = decodeJsonPart<AccessTokenPayload>(payload)
  if (!decoded || !decoded.exp || !decoded.sub || !decoded.sid || !decoded.email) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (decoded.exp <= now) {
    return null
  }

  return decoded
}

export function createAuthError(statusCode: number, message: string) {
  return createError({ statusCode, message })
}
