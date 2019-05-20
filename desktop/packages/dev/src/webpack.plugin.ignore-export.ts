import webpack from "webpack"

const ModuleDependencyWarning = require('webpack/lib/ModuleDependencyWarning')

// ↓ Based on https://github.com/sindresorhus/escape-string-regexp
const escapeStringForRegExp = (str:string) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

export default class IgnoreNotFoundExportPlugin {
  constructor(private exportsToIgnore: Array<string> | RegExp | null = null) {
  }
  
  getMessageRegExp() {
    let pattern: RegExp
    if (!this.exportsToIgnore) {
      pattern = new RegExp(`export '.*'(.+?)was not found in (.+)`)
    } else if (Array.isArray(this.exportsToIgnore)) {
      const exportsPattern = `(${this.exportsToIgnore.map(escapeStringForRegExp).join('|')})`
      pattern = new RegExp(`export '${exportsPattern}'(.+?)was not found in (.+)`)
    } else {
      pattern = this.exportsToIgnore
    }
    
    return pattern
  }
  
  apply(compiler: webpack.Compiler) {
    const messageRegExp = this.getMessageRegExp()
    
    const doneHook = (stats: webpack.Stats) => {
      // eslint-disable-next-line no-param-reassign
      stats.compilation.warnings = stats.compilation.warnings.filter(
        warn => !(
          warn instanceof ModuleDependencyWarning
          && messageRegExp.test(warn.message)
        ),
      )
    }
    
    if (compiler.hooks) {
      compiler.hooks.done.tap('IgnoreNotFoundExportPlugin', doneHook)
    } else {
      compiler.plugin('done', doneHook)
    }
  }
}
