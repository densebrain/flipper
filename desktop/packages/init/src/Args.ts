import * as yargs from "yargs"

const StatoArgsGlobal = yargs
  .usage("$0 [args]")
  .option("file", {
    describe: "Define a file to open on startup.",
    type: "string"
  })
  .option("url", {
    describe: "Define a stato:// URL to open on startup.",
    type: "string"
  })
  .option("updater", {
    default: true,
    describe: "Toggle the built-in update mechanism.",
    type: "boolean"
  })
  .option("launcher", {
    default: true,
    describe: "Toggle delegating to the update launcher on startup.",
    type: "boolean"
  })
  .option("launcher-msg", {
    describe: "[Internal] Used to provide a user message from the launcher to the user.",
    type: "string"
  })
  .version((global as any).__VERSION__)
  .help()
  .parse(process.argv.slice(1))

declare global {
  type StatoOptions = typeof StatoArgsGlobal
  const StatoArgs:StatoOptions
}
Object.assign(global, {
 StatoArgs:StatoArgsGlobal
})
export {}