/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import { type ComputedRef, type Slots, type VNode, type VNodeChild, computed } from 'vue'

import { isNil, isString } from 'lodash-es'

import { type VKey, flattenNode } from '@idux/cdk/utils'
import { type TableConfig } from '@idux/components/config'

import { tableColumnKey } from '../column'
import {
  type TableColumn,
  type TableColumnAlign,
  type TableColumnBase,
  type TableColumnExpandable,
  type TableColumnFixed,
  type TableColumnSelectable,
  type TableProps,
} from '../types'
import { getColumnKey } from '../utils'

export function useColumns(
  props: TableProps,
  slots: Slots,
  config: TableConfig,
  scrollBarSizeOnFixedHolder: ComputedRef<number>,
): ColumnsContext {
  const mergedColumns = computed(() => {
    const { columns } = props
    return mergeColumns(columns && columns.length > 0 ? columns : convertColumns(slots.default?.()), config)
  })
  const { flattedColumns, scrollBarColumn, flattedColumnsWithScrollBar } = useFlattedColumns(
    mergedColumns,
    scrollBarSizeOnFixedHolder,
  )
  const { fixedColumns, fixedColumnKeys } = useFixedColumns(flattedColumnsWithScrollBar)
  const hasEllipsis = computed(
    () => !!props.ellipsis || flattedColumns.value.some(column => (column as TableColumnBase).ellipsis),
  )
  const hasFixed = computed(() => flattedColumns.value.some(column => column.fixed))

  const mergedRows = computed(() => mergeRows(mergedColumns.value, scrollBarColumn.value))

  return {
    flattedColumns,
    scrollBarColumn,
    flattedColumnsWithScrollBar,
    fixedColumns,
    fixedColumnKeys,
    hasEllipsis,
    hasFixed,
    mergedRows,
  }
}

export interface ColumnsContext {
  flattedColumns: ComputedRef<TableColumnMerged[]>
  scrollBarColumn: ComputedRef<TableColumnScrollBar | undefined>
  flattedColumnsWithScrollBar: ComputedRef<(TableColumnMerged | TableColumnScrollBar)[]>
  fixedColumns: ComputedRef<{
    fixedStartColumns: (TableColumnMerged | TableColumnScrollBar)[]
    fixedEndColumns: (TableColumnMerged | TableColumnScrollBar)[]
    fixedColumnIndexMap: Record<VKey, number>
  }>
  fixedColumnKeys: ComputedRef<{
    lastStartKey: VKey | undefined
    firstEndKey: VKey | undefined
  }>
  hasEllipsis: ComputedRef<boolean>
  hasFixed: ComputedRef<boolean>
  mergedRows: ComputedRef<{
    rows: TableColumnMergedExtra[][]
    offsetIndexMap: Record<VKey, { colStart: number; colEnd: number }>
  }>
}

export type TableColumnMerged = (TableColumnMergedBase | TableColumnMergedExpandable | TableColumnMergedSelectable) & {
  type?: 'selectable' | 'expandable' | 'scroll-bar' | 'indexable'
}
export type TableColumnMergedExtra =
  | TableColumnMergedBaseExtra
  | TableColumnMergedExpandable
  | TableColumnMergedSelectable
  | TableColumnMergedScrollBar

export interface TableColumnMergedBase extends TableColumnBase {
  align: { title: TableColumnAlign; cell: TableColumnAlign }
  key: VKey
}
export interface TableColumnMergedBaseExtra extends TableColumnMergedBase {
  colStart: number
  colEnd: number
  hasChildren: boolean
  titleColSpan: number
  titleRowSpan?: number
}
export interface TableColumnMergedExpandable extends TableColumnMergedBaseExtra, TableColumnExpandable {
  align: { title: TableColumnAlign; cell: TableColumnAlign }
  key: VKey
  icon: string | VNodeChild | ((options: { expanded: boolean; record: unknown }) => string | VNodeChild)
  titleColSpan: number
}
export interface TableColumnMergedSelectable extends TableColumnMergedBaseExtra, TableColumnSelectable {
  align: { title: TableColumnAlign; cell: TableColumnAlign }
  key: VKey
  multiple: boolean
  titleColSpan: number

  customCell?: (data: unknown) => VNodeChild
}

export interface TableColumnScrollBar {
  key: string
  type: 'scroll-bar'
  fixed: TableColumnFixed | undefined
  width: number
}

export type TableColumnMergedScrollBar = TableColumnMergedBaseExtra & TableColumnScrollBar

function mergeColumns(columns: TableColumn[], config: TableConfig): TableColumnMerged[] {
  return columns.map(column => convertColumn(column, config))
}

export function convertColumns(nodes: VNode[] | undefined): TableColumn[] {
  const columns: Array<TableColumn> = []

  flattenNode(nodes, { key: tableColumnKey }).forEach((node, index) => {
    const { props, children } = node
    const { key = index, editable, ellipsis, ...newColumn } = props || {}
    newColumn.key = key
    newColumn.editable = editable || editable === ''
    newColumn.ellipsis = ellipsis || ellipsis === ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { default: defaultSlot, cell, title, expand, icon } = (children || {}) as any
    if (defaultSlot) {
      newColumn.children = convertColumns(defaultSlot())
    }
    if (cell) {
      newColumn.customCell = cell
    }
    if (title) {
      newColumn.customTitle = title
    }
    if (expand) {
      newColumn.customExpand = expand
    }
    if (icon) {
      newColumn.customIcon = icon
    }
    columns.push(newColumn as TableColumn)
  })

  return columns
}

function resolveColumnAlign(align: TableColumnAlign | { title: TableColumnAlign; cell: TableColumnAlign }): {
  title: TableColumnAlign
  cell: TableColumnAlign
} {
  if (isString(align)) {
    return { title: align, cell: align }
  }

  return align
}

function convertColumn(column: TableColumn, config: TableConfig): TableColumnMerged {
  const { columnBase, columnExpandable, columnSelectable, columnIndexable } = config
  const { align = columnBase.align } = column
  const key = getColumnKey(column)

  if ('type' in column) {
    const { type } = column
    if (type === 'expandable') {
      const { showLine = columnExpandable.showLine, icon = columnExpandable.icon } = column
      return { ...column, key, align: resolveColumnAlign(align), icon, showLine }
    }
    if (type === 'selectable') {
      // The default value for `multiple` is true
      const { multiple = true, showIndex = columnSelectable.showIndex } = column
      return { ...column, key, align: resolveColumnAlign(align), multiple, showIndex } as TableColumnMerged
    }
    if (type === 'indexable') {
      const align = column.align ?? columnIndexable.align ?? columnBase.align
      return { ...columnIndexable, ...column, align: resolveColumnAlign(align), key } as TableColumnMerged
    }
    // for ProTable to support more type
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { ...column, key, align: resolveColumnAlign(align) }
  } else {
    const { sortable, filterable, children } = column
    const newColumn = { ...column, key, align: resolveColumnAlign(align) }
    if (sortable) {
      newColumn.sortable = { ...columnBase.sortable, ...sortable }
    }
    if (filterable) {
      newColumn.filterable = { ...columnBase.filterable, ...filterable }
    }
    if (children?.length) {
      newColumn.children = mergeColumns(children, config)
    }
    return newColumn
  }
}

function useFlattedColumns(
  mergedColumns: ComputedRef<TableColumnMerged[]>,
  scrollBarSizeOnFixedHolder: ComputedRef<number>,
) {
  const flattedColumns = computed(() => flatColumns(mergedColumns.value))

  const scrollBarColumn = computed<TableColumnScrollBar | undefined>(() => {
    const scrollBarSize = scrollBarSizeOnFixedHolder.value
    const columns = flattedColumns.value
    if (scrollBarSize === 0 || columns.length === 0) {
      return undefined
    }
    const lastColumn = columns[columns.length - 1]
    return {
      key: '__IDUX_table_column_key_scroll-bar',
      type: 'scroll-bar',
      fixed: lastColumn && lastColumn.fixed,
      width: scrollBarSize,
    }
  })

  const flattedColumnsWithScrollBar = computed(() => {
    const columns = flattedColumns.value
    const scrollBar = scrollBarColumn.value
    return scrollBar ? [...columns, scrollBar] : columns
  })

  return { flattedColumns, scrollBarColumn, flattedColumnsWithScrollBar }
}

export function flatColumns<Col extends TableColumnMerged>(columns: Col[]): Col[] {
  const result: Col[] = []
  columns.forEach(column => {
    const { fixed, children: subColumns } = column as TableColumnBase
    if (subColumns?.length) {
      let subFlattedColumns = flatColumns(subColumns as Col[])
      if (fixed) {
        subFlattedColumns = subFlattedColumns.map(item => ({ fixed, ...item }))
      }
      result.push(...subFlattedColumns)
    } else {
      result.push(column)
    }
  })
  return result
}

function useFixedColumns(flattedColumnsWithScrollBar: ComputedRef<(TableColumnMerged | TableColumnScrollBar)[]>) {
  const fixedColumns = computed(() => {
    const fixedStartColumns: (TableColumnMerged | TableColumnScrollBar)[] = []
    const fixedEndColumns: (TableColumnMerged | TableColumnScrollBar)[] = []
    const fixedColumnIndexMap: Record<VKey, number> = {}

    flattedColumnsWithScrollBar.value.forEach((column, index) => {
      const { key, fixed } = column
      if (fixed === 'start') {
        fixedStartColumns.push(column)
        fixedColumnIndexMap[key] = index
      } else if (fixed === 'end') {
        fixedEndColumns.push(column)
        fixedColumnIndexMap[key] = index
      }
    })

    return { fixedStartColumns, fixedEndColumns, fixedColumnIndexMap }
  })
  const fixedColumnKeys = computed(() => {
    const { fixedStartColumns, fixedEndColumns } = fixedColumns.value

    return { lastStartKey: fixedStartColumns[fixedStartColumns.length - 1]?.key, firstEndKey: fixedEndColumns[0]?.key }
  })

  return { fixedColumns, fixedColumnKeys }
}

function mergeRows(mergedColumns: TableColumnMerged[], scrollBarColumn: TableColumnScrollBar | undefined) {
  const rows: TableColumnMergedExtra[][] = []
  const offsetIndexMap: Record<VKey, { colStart: number; colEnd: number }> = {}

  function calculateColSpans(columns: TableColumnMerged[], colIndex: number, rowIndex: number) {
    rows[rowIndex] ??= []

    let colStart = colIndex
    const titleColSpans = columns.map(column => {
      let titleColSpan = (column as TableColumnMergedBase).titleColSpan ?? 1

      let hasChildren = false
      const subColumns = (column as TableColumnMergedBase).children as TableColumnMerged[] | undefined
      if (subColumns?.length) {
        hasChildren = true
        const subColumnSpans = calculateColSpans(subColumns, colStart, rowIndex + 1)
        if (isNil((column as TableColumnMergedBase).titleColSpan)) {
          titleColSpan = subColumnSpans.reduce((total, count) => total + count)
        }
      }

      const colEnd = colStart + titleColSpan - 1
      rows[rowIndex].push({ ...column, titleColSpan, colStart, colEnd, hasChildren } as TableColumnMergedExtra)
      offsetIndexMap[column.key] = { colStart, colEnd }

      colStart += titleColSpan

      return titleColSpan
    })

    return titleColSpans
  }

  const rootColumns = scrollBarColumn
    ? [...mergedColumns, scrollBarColumn as unknown as TableColumnMerged]
    : mergedColumns
  calculateColSpans(rootColumns, 0, 0)

  const rowCount = rows.length
  rows.forEach((columns, rowIndex) => {
    columns.forEach(col => {
      if (!col.hasChildren) {
        col.titleRowSpan = rowCount - rowIndex
      }
    })
  })

  return { rows, offsetIndexMap }
}
