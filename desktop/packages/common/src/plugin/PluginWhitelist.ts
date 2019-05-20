export async function PluginModuleWhitelistRefs():Promise<{[id: string]: any}>  {
  const ids:Array<string> = process.env.PluginModuleWhitelist as any
  let
    refs: any = {},
    mods:any[] = await new Promise<Array<any>>((resolve) => {
      require(['react',
        'react-dom',
        'react-hot-loader',
        '@hot-loader/react-dom',
        '@material-ui/styles/ThemeContext',
        '@material-ui/styles/withStyles',
        '@material-ui/styles',
        '@material-ui/core',
        '@material-ui/core/styles/colorManipulator',
        '@material-ui/styles/jssPreset',
        '@material-ui/utils',
        'jss'],(...mods:any[]) => resolve(mods))
    })
  
  for (const index in ids) {
    const
      id = ids[index],
      mod = mods[index]
    
    refs[id] = mod
  }
  
  return refs
}



