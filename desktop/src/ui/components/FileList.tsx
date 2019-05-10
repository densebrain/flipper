/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Component } from "react"

import * as Path from "path"
import * as Fs from "fs"
import {promises as FsAsync} from "fs"
import {getLogger} from "../../fb-interfaces/Logger"

const log = getLogger(__filename)

//const EMPTY_MAP = new Map()

export type FileListFileType = "file" | "folder"
export type FileListFile = {
  name: string,
  src: string,
  type: FileListFileType,
  size: number,
  mtime: number,
  atime: number,
  ctime: number,
  birthtime: number
}
export type FileListFiles = Array<FileListFile>
type FileListProps = {
  src: string,
  onError?: (err: Error) => React.ReactNode | null | undefined,
  onLoad?: () => void,
  onFiles: (files: FileListFiles) => React.ReactNode
}
type FileListState = {
  files: Map<string, FileListFile>,
  error: Error | null | undefined
}

function newFileList():Map<string, FileListFile> {
  return new Map<string, FileListFile>()
}
const EMPTY_FILE_LIST_STATE: FileListState = {
  error: null,
  files: newFileList()
}
/**
 * List the contents of a folder from the user's file system. The file system is watched for
 * changes and this list will automatically update.
 */

export default class FileList extends Component<FileListProps, FileListState> {
  constructor(props: FileListProps, context: Object) {
    super(props, context)
    this.state = {...EMPTY_FILE_LIST_STATE}
  }

  watcher: Fs.FSWatcher | null | undefined

  fetchFile(name: string): Promise<FileListFile> {
    return new Promise((resolve, reject) => {
      const loc = Path.join(this.props.src, name)
      Fs.lstat(loc, (err:Error | undefined, stat: Fs.Stats) => {
        if (err) {
          reject(err)
        } else {
          const details: FileListFile = {
            atime: Number(stat.atime),
            birthtime: typeof stat.birthtime === "object" ? Number(stat.birthtime) : 0,
            ctime: Number(stat.ctime),
            mtime: Number(stat.mtime),
            name,
            size: stat.size,
            src: loc,
            type: stat.isDirectory() ? "folder" : "file"
          }
          resolve(details)
        }
      })
    })
  }

  async fetchFiles(callback?: Function) {
    const { src } = this.props

    const setState = (state: FileListState) => {
      if (!hasChangedDir()) {
        this.setState(state)
      }
    }

    const hasChangedDir = () => this.props.src !== src
    try {
    const files = await FsAsync.readdir(src)
      

      const filesSet: Map<string, FileListFile> = new Map()

      const next = () => {
        if (hasChangedDir()) {
          return
        }

        if (!files.length) {
          setState({
            error: null,
            files: filesSet
          })

          if (callback) {
            callback()
          }

          return
        }

        const name = files.shift()
        this.fetchFile(name)
          .then(data => {
            filesSet.set(name, data)
            next()
          })
          .catch(err => {
            setState({
              error: err,
              files: newFileList()
            })
          })
      }

      next()
    } catch (err) {
      
        setState({
          error: err,
          files: newFileList()
        })
      
      
    }
  }

  componentWillReceiveProps(nextProps: FileListProps) {
    if (nextProps.src !== this.props.src) {
      this.initialFetch(nextProps)
    }
  }

  componentDidMount() {
    this.initialFetch(this.props)
  }

  componentWillUnmount() {
    this.removeWatcher()
  }

  async initialFetch(props: FileListProps) {
    this.removeWatcher()
    try {
    await FsAsync.access(props.src, Fs.constants.R_OK)
      
      await this.fetchFiles(props.onLoad)
      this.watcher = Fs.watch(props.src, async () => {
        try {
          this.fetchFiles()
        } catch (err) {
          log.error(`Unable to fetch files ${props.src}`, err)
        }
      })
      this.watcher.on("error", err => {
        this.setState({
          error: err,
          files: newFileList()
        })
        this.removeWatcher()
      })
    } catch (err) {
      this.setState({
        error: err,
        files: newFileList()
      })
    }
  }

  removeWatcher() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }

  render() {
    const { error, files } = this.state
    const { onError, onFiles } = this.props

    if (error && onError) {
      return onError(error)
    } else {
      return onFiles(Array.from(files.values()))
    }
  }
}
