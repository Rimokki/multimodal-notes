export function useMinimumDelay(ms = 700) {
  const ready = ref(false)

  const wait = (task: Promise<any>) =>
    Promise.all([task, new Promise((r) => setTimeout(r, ms))]).then(([result]) => {
      ready.value = true
      return result
    })

  return { ready, wait }
}
