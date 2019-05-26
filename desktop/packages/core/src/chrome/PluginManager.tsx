/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"

import { spawn } from "child_process"

import * as path from "path"

import { remote } from "electron"
import styled from "../ui/styled"
import FlexBox from "../ui/components/FlexBox"
import LoadingIndicator from "../ui/components/LoadingIndicator"
import Glyph from "../ui/components/Glyph"
import FlexRow from "../ui/components/FlexRow"
import {SimpleThemeProps, withTheme} from "../ui/themes"
import FlexColumn from "../ui/components/FlexColumn"
import Button from "../ui/components/Button"
import ButtonGroup from "../ui/components/ButtonGroup"
import Searchable from "../ui/components/searchable/Searchable"
import Text from "../ui/components/Text"
import {IPackageJSON} from "package-json"

const {app, shell} = remote
const STATES_PLUGIN_PATH = path.join(app.getPath("home"), ".states")
const DYNAMIC_PLUGINS = JSON.parse(process.env.PLUGINS || "[]")
type NPMModule = IPackageJSON & {
  error?: any
}
type Status = "installed" | "outdated" | "install" | "remove" | "update" | "uninstalled" | "uptodate"
type PluginT = {
  name: string,
  version?: string,
  description?: string,
  status: Status,
  managed?: boolean,
  entry?: string,
  rootDir?: string
}
type Props = SimpleThemeProps & {
  searchTerm: string
}
type State = {
  plugins: {
    [name: string]: PluginT
  },
  restartRequired: boolean,
  searchCompleted: boolean
}
const Container = styled(FlexBox)(({theme:{colors}}:SimpleThemeProps) => ({
  width: "100%",
  flexGrow: 1,
  background: colors.background,
  overflowY: "scroll"
}))
const Title = styled(Text)({
  fontWeight: 500
})

const Plugin = styled(FlexColumn)(({theme:{colors}}:SimpleThemeProps) => ({
  backgroundColor: colors.backgroundStatus,
  borderRadius: 4,
  padding: 15,
  margin: "0 15px 25px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
}))
const SectionTitle = styled("span")({
  fontWeight: "bold",
  fontSize: 24,
  margin: 15,
  marginLeft: 20
})
const Loading = styled(FlexBox)({
  padding: 50,
  alignItems: "center",
  justifyContent: "center"
})
const RestartRequired = styled(FlexBox)(({theme:{colors}}:SimpleThemeProps) => ({
  textAlign: "center",
  justifyContent: "center",
  fontWeight: 500,
  color: colors.accentText,
  padding: 12,
  backgroundColor: colors.accent,
  cursor: "pointer"
}))
const TitleRow = styled(FlexRow)({
  alignItems: "center",
  marginBottom: 10,
  fontSize: "1.1em"
})
const Description = styled(FlexRow)({
  marginBottom: 15,
  lineHeight: "130%"
})
const PluginGlyph = styled(Glyph)({
  marginRight: 5
})
const PluginLoading = styled(LoadingIndicator)({
  marginLeft: 5,
  marginTop: 5
})

const getLatestVersion = (name: string): Promise<NPMModule> => {
  return fetch(`http://registry.npmjs.org/${name}/latest`).then(res => res.json())
}

const getPluginList = (): Promise<Array<NPMModule>> => {
  return fetch("http://registry.npmjs.org/-/v1/search?text=keywords:states&size=250")
    .then(res => res.json())
    .then(res => res.objects.map((o: any) => o.package))
}

const sortByName = (a: PluginT, b: PluginT): 1 | -1 => (a.name > b.name ? 1 : -1)

const INSTALLED = ["installed", "outdated", "uptodate"]

type ItemState = {
  working: boolean
}

type ItemProps = SimpleThemeProps & {
  plugin: PluginT,
  onChangeState: (action: Status) => void
}

const PluginItem = withTheme()(class PluginItem extends React.PureComponent<
  ItemProps,
  ItemState
> {
  constructor(props: ItemProps) {
    super(props)
    this.state = {
      working: false
    }
  }
  
  npmAction = (action: Status) => {
    const { name, status: initialStatus } = this.props.plugin
    this.setState({
      working: true
    })
    const npm = spawn("npm", [action, name], {
      cwd: STATES_PLUGIN_PATH
    })
    npm.stderr.on("data", e => {
      console.error(e.toString())
    })
    npm.on("close", code => {
      this.setState({
        working: false
      })
      const newStatus = action === "remove" ? "uninstalled" : "uptodate"
      this.props.onChangeState(code !== 0 ? initialStatus : newStatus)
    })
  }

  render() {
    const
      { plugin, theme:{colors}} =   this.props,
      { working } = this.state,
      { entry, status, version, description, managed, name, rootDir } = plugin
    return (
      <Plugin>
        <TitleRow>
          <PluginGlyph name="apps" size={24} variant="outline" color={colors.text} />
          <Title>{name}</Title>
          &nbsp;
          <Text code={true}>{version}</Text>
        </TitleRow>
        {description && <Description>{description}</Description>}
        <FlexRow>
          {managed ? (
            <Text size="0.9em" color={colors.text}>
              This plugin is not managed by States, but loaded from{" "}
              <Text size="1em" code={true}>
                {rootDir}
              </Text>
            </Text>
          ) : (
            <ButtonGroup>
              {status === "outdated" && (
                <Button disabled={working} onClick={() => this.npmAction("update")}>
                  Update
                </Button>
              )}
              {INSTALLED.includes(status) ? (
                <Button
                  disabled={working}
                  title={
                    managed === true && entry != null ? `This plugin is dynamically loaded from ${entry}` : undefined
                  }
                  onClick={() => this.npmAction("remove")}
                >
                  Remove
                </Button>
              ) : (
                <Button disabled={working} onClick={() => this.npmAction("install")}>
                  Install
                </Button>
              )}
              <Button onClick={() => shell.openExternal(`https://www.npmjs.com/package/${name}`)}>Info</Button>
            </ButtonGroup>
          )}
          {working && <PluginLoading size={18} />}
        </FlexRow>
      </Plugin>
    )
  }
})

const PluginManager = withTheme()(class PluginManager extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
  
    this.state = {
      plugins: DYNAMIC_PLUGINS.reduce((acc: any, plugin: PluginT) => {
        acc[plugin.name] = {
          ...plugin,
          managed: !(plugin.entry || "").startsWith(STATES_PLUGIN_PATH),
          status: "installed"
        }
        return acc
      }, {} as any),
      restartRequired: false,
      searchCompleted: false
    }
  }
  
  

  componentDidMount() {
    Promise.all(
      Object.keys(this.state.plugins)
        .filter(name => this.state.plugins[name].managed)
        .map(getLatestVersion)
    ).then((res: Array<NPMModule>) => {
      const updates = {} as any
      res.forEach(plugin => {
        if (plugin.error == null && this.state.plugins[plugin.name].version !== plugin.version) {
          updates[plugin.name] = { ...plugin, ...this.state.plugins[plugin.name], status: "outdated" }
        }
      })
      this.setState({
        plugins: { ...this.state.plugins, ...updates }
      })
    })
    getPluginList().then(pluginList => {
      const plugins = { ...this.state.plugins }
      pluginList.forEach(plugin => {
        if (plugins[plugin.name] != null) {
          plugins[plugin.name] = {
            ...plugin,
            ...plugins[plugin.name],
            status: plugin.version === plugins[plugin.name].version ? "uptodate" : "outdated"
          }
        } else {
          plugins[plugin.name] = { ...plugin, status: "uninstalled" }
        }
      })
      this.setState({
        plugins,
        searchCompleted: true
      })
    })
  }

  onChangePluginState = (name: string, status: Status) => {
    this.setState({
      plugins: { ...this.state.plugins, [name]: { ...this.state.plugins[name], status } },
      restartRequired: true
    })
  }

  relaunch() {
    app.relaunch()
    app.exit(0)
  }

  render() {
    const {theme:{colors}} = this.props
    // $FlowFixMe
    const plugins: Array<PluginT> = Object.values(this.state.plugins)
    const availablePlugins = plugins.filter(({ status }) => !INSTALLED.includes(status))
    return (
      <Container>
        <FlexColumn grow={true}>
          {this.state.restartRequired && (
            <RestartRequired onClick={this.relaunch}>
              <Glyph name="arrows-circle" size={12} color={colors.text} />
              &nbsp; Restart Required: Click to Restart
            </RestartRequired>
          )}
          <SectionTitle>Installed Plugins</SectionTitle>
          {plugins
            .filter(({ status, name }) => INSTALLED.includes(status) && name.indexOf(this.props.searchTerm) > -1)
            .sort(sortByName)
            .map((plugin: PluginT) => (
              <PluginItem
                plugin={plugin}
                key={plugin.name}
                onChangeState={(action: any) => this.onChangePluginState(plugin.name, action)}
              />
            ))}
          <SectionTitle>Available Plugins</SectionTitle>
          {availablePlugins
            .filter(({ name }) => name.indexOf(this.props.searchTerm) > -1)
            .sort(sortByName)
            .map((plugin: PluginT) => (
              <PluginItem
                plugin={plugin}
                key={plugin.name}
                onChangeState={(action: any) => this.onChangePluginState(plugin.name, action)}
              />
            ))}
          {!this.state.searchCompleted && (
            <Loading>
              <LoadingIndicator size={32} />
            </Loading>
          )}
        </FlexColumn>
      </Container>
    )
  }
})

const SearchablePluginManager = Searchable(PluginManager)
export default class extends React.PureComponent<{}> {
  render() {
    return (
      <FlexColumn grow={true}>
        <SearchablePluginManager />
      </FlexColumn>
    )
  }
}
