import { getLogger } from "@stato/common"

const log = getLogger(__filename)

process.on("uncaughtException", err => {
  log.error("Uncaught exception", err)
})

process.on("unhandledRejection", err => {
  log.error("Unhandled rejection", err)
})

export { }
