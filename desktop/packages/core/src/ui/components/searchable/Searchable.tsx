/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {TableColumns} from "../table/types"
import * as React from 'react'
import {HTMLAttributes, PureComponent} from "react"
import Toolbar from "../Toolbar"
import FlexRow from "../FlexRow"
import Input from "../Input"
import Text from "../Text"
import FlexBox from "../FlexBox"
import Glyph, {GlyphProps} from "../Glyph"
import FilterToken from "./FilterToken"
import {Transparent} from "../../styled"
import {PropsOf, Theme, ThemedClassNames, ThemeProps, withStyles, withTheme} from "../../themes"
import {lighten} from "@material-ui/core/styles/colorManipulator"
import {makeRootView} from "../RootView"
import {Filter, isFilterPersistent, isFilterType} from "../filter/types"
import * as _ from "lodash"

type FocusProps = {
  focused?:boolean | undefined
  focus?:boolean | undefined
}

const SearchBar = makeRootView(
  () => ({
    height: 42,
    padding: 6
  }),
  Toolbar
)
export const SearchBox = makeRootView(
  theme => ({
    backgroundColor: theme.colors.background,
    borderRadius: "10px",
    border: `1px solid ${theme.colors.border}`,
    height: "100%",
    width: "100%",
    alignItems: "center",
    paddingLeft: 4
  }),
  FlexBox
)
export const SearchInput = makeRootView(
  ({colors}:Theme) => ({
    border: ({focus}:FocusProps) => (focus ? `1px solid ${colors.border}` : 0),
    padding: 0,
    fontSize: "1em",
    flexGrow: 1,
    height: "auto",
    lineHeight: "100%",
    marginLeft: 2,
    width: "100%",
    backgroundColor: Transparent,
    "&::-webkit-input-placeholder": {
      color: lighten(colors.textInput, 0.2),
      fontWeight: 300
    }
  }),
  Input
)
const Clear = withStyles((theme:Theme) => ({
  root: {
    position: "absolute",
    right: 6,
    top: "50%",
    marginTop: -9,
    fontSize: 16,
    width: 17,
    height: 17,
    borderRadius: 999,
    lineHeight: "15.5px",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    color: theme.colors.text,
    display: "block",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.15)"
    }
  }
}))(function Clear({classes, focused, style, className, ...other}:ThemeProps<HTMLAttributes<any>, "root"> & FocusProps) {
  return <Text style={style} className={`${classes.root} ${className}`} {...other} />
})


const SearchIconStyles = {
  root: {
    marginRight: 3,
    marginLeft: 3,
    marginTop: -1,
    minWidth: 16
  }
}

type SearchIconClassMap = { classes:ThemedClassNames<keyof typeof SearchIconStyles> }

export const SearchIcon = withStyles(SearchIconStyles)(
  React.forwardRef<Glyph, GlyphProps>(({classes, className, ...other}:GlyphProps & SearchIconClassMap, ref) => {
    return <Glyph
      ref={ref} className={`${classes.root} ${className}`} {...other} />
  })
)
const Actions = makeRootView(
  () => ({
    marginLeft: 8,
    flexShrink: 0
  }),
  FlexRow
)
export type SearchableProps = {
  addFilter:(filter:Filter) => void,
  searchTerm:string,
  filters:Array<Filter>
  virtual?: boolean
}

type OwnProps = {
  placeholder?:string,
  actions?:React.ReactNode,
  tableKey:string,
  columns?:TableColumns,
  onFilterChange:(filters:Array<Filter>) => void,
  defaultFilters:Array<Filter>
}

type Props = ThemeProps<OwnProps,string,true>

type SavedState = {
  searchTerm:string
  filters:Array<Filter>
}

type State = SavedState & {
  focusedToken:number
  hasFocus:boolean
}


const Searchable = <C extends React.ComponentType<any> = any>(Component:C):React.ComponentType<Partial<PropsOf<C>> & Partial<OwnProps>> => {
  const AnyComponent = Component as any
  return withTheme()(class extends PureComponent<Props, State> {
    static defaultProps = {
      placeholder: "Search..."
    }
    
    constructor(props:Props) {
      super(props)
      this.state = {
        filters: this.props.defaultFilters || [],
        focusedToken: -1,
        searchTerm: "",
        hasFocus: false
      }
    }
    
    
    _inputRef:HTMLInputElement | null | undefined
    
    componentDidMount() {
      window.document.addEventListener("keydown", this.onKeyDown)
      const
        {defaultFilters} = this.props,
        {filters} = this.state,
        defaultKeys = defaultFilters.map(f => f.key)
      
      let savedState:SavedState | null = null
      
      if (this.getTableKey()) {
        try {
          savedState = JSON.parse(window.localStorage.getItem(this.getPersistKey()) || "null")
        } catch (e) {
          window.localStorage.removeItem(this.getPersistKey())
        }
      }
      
      const patch = {} as Partial<SavedState>
      
      
      if (savedState) {
        const {searchTerm = this.state.searchTerm, filters: savedFilters} = (savedState || {} as SavedState)
        if (!!defaultFilters) {
          // merge default filter with persisted filters
          const newSavedFilters = savedFilters.map(f => {
            if (isFilterType(f, "enum") && defaultKeys.includes(f.key)) {
              const
                defaultFilter = defaultFilters.find(f2 => f.key === f2.key)!! as Filter<"enum">,
                newEnum = [...defaultFilter.enum]
              
              return {
                ...f,
                enum: newEnum,
                value: (f.value || []).filter(value => !!newEnum.find(opt => opt.value === value))
              }
            }
            
            return f
          })
          
          if (!filters || (newSavedFilters.length && !newSavedFilters.every(f => _.isEqual(filters.find(f2 => f2.key === f.key), f)))) {
            patch.filters = filters
              .map(f => newSavedFilters.find(f2 => f2.key === f.key) || f)
              .concat(newSavedFilters.filter(f => !filters.find(f2 => f2.key === f.key)))
          }
          //
          //
          // defaultFilters.forEach(defaultFilter => {
          //   const filterIndex = savedFilters.findIndex(f => f.key === defaultFilter.key)
          //
          //   if (filterIndex > -1) {
          //     const savedFilter = savedFilters[filterIndex]
          //     if (isFilterType(defaultFilter, "enum")) {
          //       savedFilter.enum = defaultFilter.enum
          //     }
          //
          //     const filters = new Set(savedFilters[filterIndex].enum.map(filter => filter.value))
          //     savedFilters[filterIndex].value = savedFilters[filterIndex].value.filter(value =>
          //       filters.has(value)
          //     )
          //   }
          
        }
        
        if (!_.isEmpty(patch)) {
          this.setState(state => ({
            ...state,
            ...patch,
            searchTerm
          }))
        }
      }
    }
    
    componentDidUpdate(prevProps:Props, prevState:State) {
      if (
        this.getTableKey() &&
        (prevState.searchTerm !== this.state.searchTerm || prevState.filters !== this.state.filters)
      ) {
        window.localStorage.setItem(
          this.getPersistKey(),
          JSON.stringify({
            searchTerm: this.state.searchTerm,
            filters: this.state.filters
          })
        )
        
        if (this.props.onFilterChange != null) {
          this.props.onFilterChange(this.state.filters)
        }
      } else if (prevProps.defaultFilters !== this.props.defaultFilters) {
        const mergedFilters = [...this.state.filters]
        this.props.defaultFilters.forEach((defaultFilter:Filter<any>) => {
          const filterIndex = mergedFilters.findIndex((f:Filter<any>) => f.key === defaultFilter.key)
          
          if (filterIndex > -1) {
            mergedFilters[filterIndex] = defaultFilter
          } else {
            mergedFilters.push(defaultFilter)
          }
        })
        this.setState({
          filters: mergedFilters
        })
      }
    }
    
    componentWillUnmount() {
      window.document.removeEventListener("keydown", this.onKeyDown)
    }
    
    getTableKey = ():string | null | undefined => {
      if (this.props.tableKey) {
        return this.props.tableKey
      } else if (this.props.columns) {
        // if we have a table, we are using it's colums to uniquely identify
        // the table (in case there is more than one table rendered at a time)
        return (
          "TABLE_COLUMNS_" +
          Object.keys(this.props.columns)
            .join("_")
            .toUpperCase()
        )
      }
    }
    onKeyDown = (e:KeyboardEvent) => {
      const ctrlOrCmd = (e.metaKey && process.platform === "darwin") || (e.ctrlKey && process.platform !== "darwin")
      
      if (e.key === "f" && ctrlOrCmd && this._inputRef) {
        e.preventDefault()
        
        if (this._inputRef) {
          this._inputRef.focus()
        }
      } else if (e.key === "Escape" && this._inputRef) {
        this._inputRef.blur()
        
        this.setState({
          searchTerm: ""
        })
      } else if (e.key === "Backspace" && this.hasFocus()) {
        if (
          this.state.focusedToken === -1 &&
          this.state.searchTerm === "" &&
          this._inputRef &&
          !isFilterPersistent(this.state.filters[this.state.filters.length - 1])
        ) {
          this._inputRef.blur()
          
          this.setState({
            focusedToken: this.state.filters.length - 1
          })
        } else {
          this.removeFilter(this.state.focusedToken)
        }
      } else if (e.key === "Delete" && this.hasFocus() && this.state.focusedToken > -1) {
        this.removeFilter(this.state.focusedToken)
      } else if (e.key === "Enter" && this.hasFocus() && this._inputRef) {
        this.matchTags(this._inputRef.value, true)
      }
    }
    onChangeSearchTerm = (e:React.ChangeEvent<HTMLInputElement>) => this.matchTags(e.target.value, false)
    matchTags = (searchTerm:string, matchEnd:boolean) => {
      const filterPattern = matchEnd ? /([a-z][a-z0-9]*[!]?[:=][^\s]+)($|\s)/gi : /([a-z][a-z0-9]*[!]?[:=][^\s]+)\s/gi
      const match = searchTerm.match(filterPattern)
      
      if (match && match.length > 0) {
        match.forEach((filter:string) => {
          const separator = filter.indexOf(":") > filter.indexOf("=") ? ":" : "="
          let
            [key, ...values] = filter.split(separator),
            value = values.join(separator).trim(),
            type = "include" // if value starts with !, it's an exclude filter
          
          if (value.indexOf("!") === 0) {
            type = "exclude"
            value = value.substring(1)
          } // if key ends with !, it's an exclude filter
          
          if (key.indexOf("!") === key.length - 1) {
            type = "exclude"
            key = key.slice(0, -1)
          }
          
          this.addFilter({
            type,
            key,
            value
          })
        })
        searchTerm = searchTerm.replace(filterPattern, "")
      }
      
      this.setState({
        searchTerm
      })
    }
    setInputRef = (ref:HTMLInputElement | null | undefined) => {
      this._inputRef = ref
    }
    addFilter = (filter:Filter<any>) => {
      const filterIndex = this.state.filters.findIndex(f => f.key === filter.key)
      let
        filters = [...this.state.filters],
        patch = {} as Partial<State>
      
      if (filterIndex > -1) {
        const
          defaultFilter:Filter<any> = this.props.defaultFilters[filterIndex]
        
        let
          filter = filters[filterIndex]
        
        
        if (defaultFilter != null && isFilterType(defaultFilter, "enum") && isFilterType(filter, "enum")) {
          filter = {...filter, enum: [...defaultFilter.enum]}
          
          patch.filters = filters.map(f => f.key === filter.key ? filter : f)
        }
      } else {// persistent filters are always at the front
        patch.filters = isFilterPersistent(filter) ? [filter, ...filters] : [...filters, filter]
        patch.focusedToken = -1
      }
      
      if (!_.isEmpty(patch)) {
        this.setState(state => ({
          ...state,
          ...patch
        }))
      }
    }
    removeFilter = (index:number) => {
      const filters = this.state.filters.filter((_, i) => i !== index)
      const focusedToken = -1
      this.setState(
        {
          filters,
          focusedToken,
          hasFocus: true
        },
        () => {
          if (this._inputRef) {
            this._inputRef.focus()
          }
        }
      )
    }
    replaceFilter = (index:number, filter:Filter) => {
      const filters = [...this.state.filters]
      filters.splice(index, 1, filter)
      this.setState({
        filters
      })
    }
    onInputFocus = () => {
      if (this.state.hasFocus) return
      this.setState({
        focusedToken: -1,
        hasFocus: true
      })
    }
    onInputBlur = () =>
      setTimeout(
        () =>
          this.setState({
            hasFocus: false
          }),
        100
      )
    onTokenFocus = (focusedToken:number) =>
      this.setState({
        focusedToken
      })
    onTokenBlur = () =>
      this.setState({
        focusedToken: -1
      })
    hasFocus = ():boolean => {
      return this.state.focusedToken !== -1 || this.state.hasFocus
    }
    clear = () =>
      this.setState({
        filters: this.state.filters.filter(f => !isFilterPersistent(f)),
        searchTerm: ""
      })
    getPersistKey = () => `SEARCHABLE_STORAGE_KEY_${this.getTableKey() || ""}`
    
    render() {
      const
        {theme: {colors}, placeholder, actions, ...props} = this.props,
        {filters, searchTerm, focusedToken} = this.state
      return (
        <>
          <SearchBar position="top" key="searchbar">
            <SearchBox tabIndex={-1}>
              <SearchIcon name="magnifying-glass" color={colors.text} size={16}/>
              {filters.map((filter, i) => (
                <FilterToken
                  key={`${filter.key}:${filter.type}`}
                  index={i}
                  filter={filter}
                  focused={i === focusedToken}
                  onDelete={this.removeFilter}
                  onFocus={this.onTokenFocus}
                  onReplace={this.replaceFilter}
                  onBlur={this.onTokenBlur}
                />
              ))}
              <SearchInput
                placeholder={placeholder}
                onChange={this.onChangeSearchTerm}
                value={searchTerm}
                innerRef={this.setInputRef}
                onFocus={this.onInputFocus}
                onBlur={this.onInputBlur}
              />
              {(searchTerm || filters.length > 0) && <Clear onClick={this.clear}>&times;</Clear>}
            </SearchBox>
            {actions != null && <Actions>{actions}</Actions>}
          </SearchBar>
          ,
          <AnyComponent
            {...props}
            key="table"
            addFilter={this.addFilter}
            searchTerm={searchTerm}
            filters={filters}
          />
          ,
        </>
      )
    }
  }) as React.ComponentType<Partial<PropsOf<C>> & Partial<OwnProps>>
}

/**
 * Higher-order-component that allows adding a searchbar on top of the wrapped
 * component. See SearchableManagedTable for usage with a table.
 */

export default Searchable
