import {getLogger} from "@flipper/common"
import * as Fs from "fs"
import {IDependencyMap, IPackageJSON} from "package-json"
import * as Path from "path"
import webpack from "webpack"
import {appDir, coreDir, pluginDirs} from "./dirs"
import makeElectronBuilderConfig from "./electron-builder-config"
import {compileBasePackages} from "./package-compiler"
import generateWebpackConfig from "./webpack/webpack.config"
import {Packager} from "electron-builder"
import * as Sh from "shelljs"
import * as _ from 'lodash'

const
  log = getLogger(__filename),
  outDir = Path.resolve(__dirname, "dist", "package")

async function run() {
  
  // Compile base packages
  await compileBasePackages(true)
  
  // Get webpack config
  log.info("Starting webpack config")
  
  const
    webpackConfig = await generateWebpackConfig("production"), multiCompiler = webpack(webpackConfig),
    compilers = multiCompiler.compilers.sortBy(c => c.name)
  
  log.info("Webpack compiling", compilers.map(({name}) => name))
  
  // Run all required webpacks
  await Promise.all(compilers.map(compiler => {
    const {name} = compiler
    log.info(`>>> Starting Webpack: ${name}`)
    
    return new Promise<webpack.Stats>((resolve, reject) => {
      compiler.run((err:Error | undefined, stats:webpack.Stats | undefined) => {
        if (stats) {
          const args = [
            `>>> Compiled ${name}`, stats.toString({
              colors: true,
              assets: true,
              source: false,
              errors: true,
              
              // Add details to errors (like resolving log)
              errorDetails: true
            })
          ]
          if (err) {
            log.error(...args, err)
          } else {
            log.info(...args)
          }
        }
        
        if (err) {
          reject(err)
        } else {
          resolve(stats)
        }
      })
    })
  }))
  
  
  log.info("Completed all packages: ", compilers.map(c => c.name))
  
  log.info("Assembling files for electron-builder")
  
  // TODO: Assemble for builder
  if (Fs.existsSync(outDir))
    Sh.rm("-Rf", outDir)
  
  const
    appOutDir = `${outDir}/app`,
    coreOutDir = `${outDir}/core`,
    pluginsOutDir = `${outDir}/plugins`
  
  Sh.mkdir("-p", appOutDir)
  Sh.mkdir("-p", coreOutDir)
  Sh.mkdir("-p", pluginsOutDir)
  
  Sh.cp("-R", `${appDir}/dist/*`, appOutDir)
  Sh.cp("-R", `${coreDir}/dist/*`, coreOutDir)
  
  pluginDirs.forEach(pluginDir => {
    const pluginOutDir = Path.resolve(pluginsOutDir, Path.basename(pluginDir))
    Sh.cp("-R", `${pluginDir}/dist/*`, pluginOutDir)
  })
  
  // TODO: Create merged package.json
  const
    appPkgJson = require(Path.resolve(appDir, "package.json")) as IPackageJSON,
    corePkgJson = require(Path.resolve(coreDir, "package.json")) as IPackageJSON,
    pkgJson = {
      ...appPkgJson,
      main: "app/bundle.js",
      dependencies: _.uniqBy(
        Object.entries({
          ...appPkgJson.dependencies,
          ...corePkgJson.dependencies
        }),
        ([name]) => name
      ).reduce((acc, [name, version]) => {
        acc[name] = version
        return acc
      }, {} as IDependencyMap)
    }
  
  Fs.writeFileSync(Path.resolve(outDir, "package.json"), JSON.stringify(pkgJson, null, 2))
  
  
  log.info("Starting electron-builder")
  const
    packager = new Packager({
      projectDir: outDir,
      config: await makeElectronBuilderConfig()
    }),
    result = await packager.build()
  
  log.info("Completed electron-builder", result)
}

run()
  .catch(err => {
    log.error("Unable to build package", err)
  })

export {}
