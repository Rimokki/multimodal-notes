import { revokeCurrentSessionByCookie } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await revokeCurrentSessionByCookie(event)

  return {
    success: true,
  }
})
