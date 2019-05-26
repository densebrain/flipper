import * as yargs from "yargs"

const StatesArgsGlobal = yargs
  .usage("$0 [args]")
  .option("file", {
    describe: "Define a file to open on startup.",
    type: "string"
  })
  .option("url", {
    describe: "Define a states:// URL to open on startup.",
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
  type StatesOptions = typeof StatesArgsGlobal
  const StatesArgs: StatesOptions
}
Object.assign(global, {
  StatesArgs: StatesArgsGlobal
})
export {}
