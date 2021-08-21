import type { ComputedRef, Ref } from 'vue'
import type { TableProps } from '../types'
import type { TableColumnExpandableMerged, TableColumnFlatted } from './useColumns'

import { computed, ref, watch } from 'vue'
import { callEmit } from '@idux/cdk/utils'

export function useExpandable(props: TableProps, flattedColumns: ComputedRef<TableColumnFlatted[]>): ExpandableContext {
  const expandable = computed(() =>
    flattedColumns.value.find(column => 'type' in column && column.type === 'expandable'),
  ) as ComputedRef<TableColumnExpandableMerged | undefined>

  const expandedRowKeys = ref(props.expandedRowKeys)
  watch(
    () => props.expandedRowKeys,
    value => (expandedRowKeys.value = value),
  )

  const handleExpandChange = (key: string | number, record: unknown) => {
    const { onChange, onExpand } = expandable.value || {}
    const index = expandedRowKeys.value.indexOf(key)
    const expanded = index >= 0
    if (expanded) {
      expandedRowKeys.value.splice(index, 1)
    } else {
      expandedRowKeys.value.push(key)
    }
    callEmit(onExpand, expanded, record)
    callEmit(onChange, expandedRowKeys.value)
    callEmit(props['onUpdate:expandedRowKeys'], expandedRowKeys.value)
  }

  return { expandable, expandedRowKeys, handleExpandChange }
}

export interface ExpandableContext {
  expandable: ComputedRef<TableColumnExpandableMerged | undefined>
  expandedRowKeys: Ref<(string | number)[]>
  handleExpandChange: (key: string | number, record: unknown) => void
}
