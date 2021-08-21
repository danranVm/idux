import type { ComputedRef, Ref } from 'vue'
import type { TableProps, TablePagination } from '../types'
import type { GetRowKey } from './useGetRowKey'

import { computed } from 'vue'

export function useDataSource(
  props: TableProps,
  getRowKey: ComputedRef<GetRowKey>,
  expandedRowKeys: Ref<(string | number)[]>,
  mergedPagination: ComputedRef<TablePagination | null>,
): DataSourceContext {
  const mergedData = computed(() => props.dataSource.map(record => covertMergeData(record, getRowKey.value)))
  const mergedMap = computed(() => {
    const map = new Map<string | number, MergedData>()
    covertDataMap(mergedData.value, map)
    return map
  })
  // TODO
  const filteredData = computed(() => mergedData.value)
  // TODO
  const sortedData = computed(() => filteredData.value)
  const paginatedData = computed(() => {
    const pagination = mergedPagination.value
    if (pagination === null) {
      return sortedData.value
    } else {
      const pageSize = pagination.pageSize!
      const startIndex = (pagination.pageIndex! - 1) * pageSize
      return sortedData.value.slice(startIndex, startIndex + pageSize)
    }
  })
  const paginatedMap = computed(() => {
    const map = new Map<string | number, MergedData>()
    covertDataMap(paginatedData.value, map)
    return map
  })

  const flattedData = computed(() => {
    const expandedKeys = expandedRowKeys.value
    if (expandedKeys.length > 0) {
      const data: FlattedData[] = []
      paginatedData.value.forEach(item => data.push(...flattenData(item, 0, expandedKeys)))
      return data
    }
    return paginatedData.value.map(item => ({ ...item, expanded: false, level: 0 }))
  })

  return { filteredData, flattedData, mergedMap, paginatedMap }
}

export interface DataSourceContext {
  filteredData: ComputedRef<MergedData[]>
  flattedData: ComputedRef<FlattedData[]>
  mergedMap: ComputedRef<Map<string | number, MergedData>>
  paginatedMap: ComputedRef<Map<string | number, MergedData>>
}

export interface MergedData {
  children?: MergedData[]
  parentKey?: string | number
  record: unknown
  rowKey: string | number
}

export interface FlattedData extends MergedData {
  expanded: boolean
  level: number
}

function covertMergeData(record: unknown, getRowKey: GetRowKey, parentKey?: string | number) {
  const rowKey = getRowKey(record)
  const result: MergedData = { record, rowKey, parentKey }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children = (record as any).children as any[]
  if (children) {
    result.children = children.map(subRecord => covertMergeData(subRecord, getRowKey, rowKey))
  }
  return result
}

function covertDataMap(mergedData: MergedData[], map: Map<string | number, MergedData>) {
  mergedData.forEach(item => {
    const { rowKey, children } = item
    map.set(rowKey, item)
    if (children) {
      covertDataMap(children, map)
    }
  })
}

function flattenData(data: MergedData, level: number, expandedRowKeys: (string | number)[]) {
  const { children, parentKey, record, rowKey } = data
  const expanded = expandedRowKeys.includes(rowKey)
  const result: FlattedData[] = [{ children, parentKey, record, rowKey, level, expanded }]

  if (expanded && children) {
    children.forEach(subRecord => result.push(...flattenData(subRecord, level + 1, expandedRowKeys)))
  }

  return result
}
