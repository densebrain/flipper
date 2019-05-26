import {writeFile} from "./FileUtil"


declare global {
  interface String {
    toFile(file: string): Promise<void>
  }
}

Object.assign(String.prototype,{
  toFile: function (file: string) {
    return writeFile(file, this)
  }
})

export {

}
