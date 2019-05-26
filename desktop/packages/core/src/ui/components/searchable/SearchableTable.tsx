/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { ManagedTableProps, TableBodyRowGetter } from "../table/ManagedTable"
import { TableBodyRow } from "../table/types"
import { Filter } from "../filter/types"
import { PureComponent } from "react"
import ManagedTable from "../table/ManagedTable"
//import { ManagedTableDebounced } from "../table/ManagedTable"
import textContent from "../../../utils/textContent"
import Searchable, { SearchableProps } from "./Searchable"
import deepEqual from "deep-equal"
import { ManagedTableDataPage } from "../table/types"
import { getValue, guard } from "typeguard"
type Props = ManagedTableProps &
  SearchableProps & {
    tableRef?: (ref: ManagedTable) => void
    defaultFilters: Array<Filter<any>>
  }
type State = {
  filterRows: (row: TableBodyRow) => boolean
  filteredItems: Array<TableBodyRow | ManagedTableDataPage<any>>
  tableRef?: ManagedTable | null | undefined
}

const filterRowsFactory = (
  filters: Array<Filter<any>>,
  searchTerm: string,
  rowGetter: TableBodyRowGetter<any> | null | undefined = null
) => (rowHolder: any): boolean => {
  // const row:TableBodyRow = !!filter.rowGetter ? filter.rowGetter(rowHolder) : rowHolder;
  const row: TableBodyRow = !!rowGetter ? rowGetter(rowHolder) : rowHolder
  const match = filters.every((filter: Filter<any>) => {
    const { value } = filter

    if (filter.type === "enum" && row.type != null) {
      return value.length === 0 || value.indexOf(row.type) > -1
    } else if (filter.type === "include") {
      const { value } = filter
      return (
        typeof value === "string" &&
        textContent(row.columns[filter.key].value).toLowerCase() ===
          value.toLowerCase()
      )
    } else if (filter.type === "exclude") {
      const { value } = filter
      return (
        typeof value === "string" &&
        textContent(row.columns[filter.key].value).toLowerCase() !==
          value.toLowerCase()
      )
    } else {
      return true
    }
  }) //const row = ((results[0]: any): TableBodyRow);

  return (
    match &&
    (searchTerm != null && searchTerm.length > 0
      ? Object.keys(row.columns)
          .map(key => textContent(row.columns[key].value))
          .join("~~") // prevent from matching text spanning multiple columns
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true)
  )
}

class SearchableManagedTable extends PureComponent<Props, State> {
  static defaultProps = {
    defaultFilters: [],
    rowType: "other"
  } as Props

  constructor(props: Props) {
    super(props)
    const { filters, searchTerm, rowGetter } = this.props,
      filterRows = filterRowsFactory(filters, searchTerm, rowGetter)
    this.state = {
      filterRows,
      filteredItems: this.makeFilteredRows(props, filterRows)
    }
  }

  setTableRef = (tableRef: ManagedTable | null) =>
    this.setState(
      {
        tableRef
      },
      () => guard(() => this.props.tableRef(tableRef))
    )

  isPageRowType(props: Props = this.props) {
    return props.rowType === "page"
  }

  makeFilteredRows(
    props: Props = this.props,
    filterRows: (row: TableBodyRow) => boolean = this.state.filterRows
  ): Array<ManagedTableDataPage<any> | TableBodyRow> {
    return this.isPageRowType(props)
      ? asType<Array<ManagedTableDataPage<any>>>(props.items).map(page =>
          page.filter(filterRows)
        )
      : (asType<Array<TableBodyRow>>(props.items).filter(filterRows) as any)
  }

  componentDidMount() {
    this.props.defaultFilters.map(this.props.addFilter)
  }

  componentWillReceiveProps(nextProps: Props) {
    const pagesChanged = nextProps.items !== this.props.items,
      filterChanged =
        nextProps.searchTerm !== this.props.searchTerm ||
        !deepEqual(this.props.filters, nextProps.filters),
      patch: Partial<State> = {}
    let filterRows = this.state.filterRows

    if (filterChanged) {
      filterRows = patch.filterRows = filterRowsFactory(
        nextProps.filters,
        nextProps.searchTerm,
        nextProps.rowGetter
      )
    }

    if (pagesChanged || filterChanged) {
      if (!getValue(() => nextProps.items.length, 0)) {
        patch.filteredItems = []
      } else {
        patch.filteredItems = this.makeFilteredRows(nextProps, filterRows)
      }
    }
    
    if (Object.keys(patch).length) {
      this.setState(
        state => ({ ...state, ...patch }),
        () =>
          patch.filteredItems && guard(() => this.state.tableRef.resetTable())
      )
    }
  }

  render() {
    const {
        addFilter,
        searchTerm: _searchTerm,
        filters: _filters,
        tableRef,
        items,
        ...props
      } = this.props,
      { filteredItems, filterRows } = this.state
    return (
      //<ManagedTableDebounced
      <ManagedTable
        {...props}
        filter={filterRows}
        items={filteredItems}
        onAddFilter={addFilter}
        tableRef={this.setTableRef}
      />
    )
  }
}

function asType<T>(o: any): T {
  return o as T
}
/**
 * Table with filter and searchbar, supports all properties a ManagedTable
 * and Searchable supports.
 */

export default Searchable(SearchableManagedTable)
