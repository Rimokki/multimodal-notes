import { rotateRefreshSession } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  return rotateRefreshSession(event)
})
