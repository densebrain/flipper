

const hooks = Array<() => void>()

export function addShutdownHook(fn: () => void) {
  hooks.push(fn)
}

Array("beforeExit", "exit")
  .forEach(event =>
    process.on(event as any, () =>
      hooks.forEach(fn => fn())
    )
  )
