import { requireAccessUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)

  return {
    user,
  }
})
