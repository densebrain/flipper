import {getLogger, LogLevel, setLoggerThreshold} from "@states/common"
import {Arch, Packager, Platform} from "app-builder-lib"
import * as Fs from "fs"
import * as _ from 'lodash'
import {IDependencyMap, IPackageJSON} from "package-json"
import * as Path from "path"
import * as Sh from "shelljs"
import webpack from "webpack"
import Yargs from "yargs"
import {appDir, commonDir, coreDir, pluginDirs} from "./dirs"
import makeElectronBuilderConfig from "./electron-builder-config"
import {compileBasePackages} from "./package-compiler"
import {attachProvidedPackagesAssembler} from "./provided-package-assembler"
import generateWebpackConfig from "./webpack/webpack.config"

const
  log = getLogger(__filename),
  outDir = Path.resolve(__dirname, "..", "dist", "package")

const argv = Yargs
  .scriptName("package-app")
  .usage("package-app [args]")
  .option("verbose", {
    type: "boolean",
    default: false,
    desc: "Set log level to `debug`"
  })
  .option("parallel",{
    alias: "p",
    desc: "Run initial builds in parallel",
    type: "boolean",
    default: false
  })
  .option("noPlugins", {
    type: "boolean",
    default: false,
    desc: "Build without plugins"
  })
  .option("pkgTest", {
    type: "boolean",
    default: false,
    desc: "Package test, enables little helpers for debugging"
  })
  .help()
  .argv

async function run() {
  
  log.info("Attaching provided package compiler")
  attachProvidedPackagesAssembler()
  
  const {parallel, verbose, noPlugins, "pkgTest":isPkgTest } = argv
  
  // Log Threshold
  setLoggerThreshold(verbose ? LogLevel.debug : LogLevel.info)
  
  log.info("Build plugins: ", !noPlugins)
  
  // Compile base packages
  await compileBasePackages(true, parallel)
  
  // Get webpack config
  log.info("Starting webpack config")
  
  const
    webpackConfig = await generateWebpackConfig("production",undefined, (config) => {
      return !isPkgTest ? config : {
        ...config,
        plugins: [
          ...config.plugins,
          new webpack.DefinePlugin({
            "process.env.TEST_PKG": JSON.stringify(true)
          })
        ]
      }
    }),
    
    multiCompiler = webpack(webpackConfig),
    compilers = multiCompiler.compilers
      .filter(c => !noPlugins || !c.name.includes("plugin"))
      .sortBy(c => c.name)
      
  
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
    pluginsOutDir = `${outDir}/plugins`,
    pluginDeps = Array<[string,unknown]>()
  
  Sh.mkdir("-p", appOutDir)
  Sh.mkdir("-p", coreOutDir)
  Sh.mkdir("-p", pluginsOutDir)
  
  
  Sh.cp("-R", `${appDir}/dist/*`, appOutDir)
  Sh.cp("-R", `${coreDir}/dist/*`, coreOutDir)
  
  pluginDirs.forEach(pluginDir => {
    const
      pluginOutDir = Path.resolve(pluginsOutDir, Path.basename(pluginDir)),
      pluginPkgFile = Path.resolve(pluginDir,'package.json')
  
    pluginDeps.push(...(Object.entries(JSON.parse(Fs.readFileSync(pluginPkgFile,'utf-8')).dependencies || {})))
    Sh.mkdir("-p",pluginOutDir)
    Sh.cp("-R", `${pluginDir}/dist`, Path.resolve(pluginOutDir,'dist'))
    Sh.cp(pluginPkgFile, Path.resolve(pluginOutDir,'package.json'))
  })
  
  // TODO: Create merged package.json
  const
    appPkgJson = require(Path.resolve(appDir, "package.json")) as IPackageJSON,
    corePkgJson = require(Path.resolve(coreDir, "package.json")) as IPackageJSON,
    commonPkgJson = require(Path.resolve(commonDir, "package.json")) as IPackageJSON,
    pkgJson = {
      ...appPkgJson,
      main: "app/bundle.js",
      devDependencies: {},
      dependencies: _.uniqBy(
        [
          ...pluginDeps,
          ...Object.entries({
            ...commonPkgJson.dependencies,
            ...appPkgJson.dependencies,
            ...corePkgJson.dependencies
          })
        ],
        ([name]) => name
      ).filter(([name]) =>
        !name.startsWith("@states"))
        .reduce((acc, [name, version]) => {
          acc[name] = version as any
          return acc
        }, {} as IDependencyMap)
    }
  
  Fs.writeFileSync(Path.resolve(outDir, "package.json"), JSON.stringify(pkgJson, null, 2))
  
  const buildDir = Path.resolve(outDir,"build")
  Sh.mkdir("-p",buildDir)
  Sh.cp("-R", Path.resolve(appDir,"static","*"), buildDir)
  
  log.info("Starting electron-builder")
  const
    packager = new Packager({
      projectDir: outDir,
      targets: new Map<Platform,Map<Arch,Array<string>>>([[Platform.current(),new Map<Arch,Array<string>>([[Arch.x64,Array<string>()]])]]),
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
