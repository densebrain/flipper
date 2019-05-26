

const
  Fs = require("fs"),
  Path = require("path"),
  
  blacklistedPackages = ['dev','types'],
  packagesDir = Path.resolve(__dirname,'..'),
  devDir = Path.resolve(__dirname),
  modulesToTest = Fs.readdirSync(packagesDir)
    .filter(file => !file.startsWith(".") && !blacklistedPackages.includes(file))
    .map(file => Path.resolve(packagesDir, file))//,"src","__tests__"
    .filter(file => Fs.lstatSync(file).isDirectory()),
  log = console,
  _ = require("lodash")

log.info("Modules to test: ", modulesToTest.map(dir => Path.basename(dir)))

module.exports = {
  preset: 'ts-jest',
  verbose: true,
  projects: _.flatten(modulesToTest.map(dir => {
    
    const config = {
      preset: 'ts-jest',
  
      rootDir: dir,
  
      setupFilesAfterEnv: [
        `${devDir}/src/test-env/test-setup.ts`,
      ],
      "moduleNameMapper": {
        "\\@states\\/(.*)": "<rootDir>/../$1/src/index"
      },
      globals: {
        "ts-jest": {
          "tsConfig": "<rootDir>/tsconfig.json"
        }
      }
      
      
    }
    
    
    return [{
      ...config,
      displayName: `${dir} >>> node`,
      testMatch: ["**/src/**/__tests__/**/*.(node).ts"],
      runner: '@jest-runner/electron/main',
      testEnvironment: 'node',
    }
    // ,{
    //   ...config,
    //   displayName: `${dir} >>> electron`,
    //   testMatch: ["**/src/**/__tests__/**/*.(electron).ts"],
    //   runner: '@jest-runner/electron',
    //   testEnvironment: '@jest-runner/electron/environment',
    //   testRunner: require.resolve('jest-circus/runner')
    //
    // }
    ]
  })),
  
  
}
