import TscWatch from  "tsc-watch/client"
import * as Path from "path"
import {packageDir} from "./dirs"

export class ProjectCompiler {
  
  watch = new TscWatch()
  
  static for(name:string) {
    return new ProjectCompiler(name)
  }
  
  protected constructor(public name: string) {
  }
  
  on(event: 'first_success' | 'subsequent_success' | 'compile_errors', fn: () => void) {
    this.watch.on(event,fn)
    return this
  }
  
  start() {
    this.watch.start('--noClear', '--project', Path.resolve(packageDir,this.name))
    return this
  }
  
  kill() {
    this.watch.kill()
    return this
  }
  
  
  
}

export function makeProjectCompiler(name: string): ProjectCompiler {
  return ProjectCompiler.for(name)
  
}
