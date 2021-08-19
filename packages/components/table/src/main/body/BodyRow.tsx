import type { ComputedRef, Slots, VNodeTypes } from 'vue'
import type { TableBodyRowProps, TableColumnExpandable, TableProps } from '../../types'
import type {
  TableColumnBaseFlatted,
  TableColumnExpandableMerged,
  TableColumnFlatted,
} from '../../composables/useColumns'

import { computed, defineComponent, inject } from 'vue'
import { isFunction, isString } from 'lodash-es'
import { tableToken } from '../../token'
import { tableBodyRowProps } from '../../types'
import BodyCol from './BodyCol'
import BodyColExpand from './BodyColExpand'
import BodyRowSingle from './BodyRowSingle'

export default defineComponent({
  props: tableBodyRowProps,
  setup(props) {
    const { props: tableProps, slots, flattedColumns, expandable, handleExpandChange, bodyRowTag } = inject(tableToken)!

    const classes = useClasses(props, tableProps)

    const expendType = useExpendType(props, expandable)
    const handleExpend = () => {
      const { rowKey, record } = props
      handleExpandChange(rowKey, record)
    }
    const clickEvents = useClickEvents(expandable, expendType, handleExpend)

    return () => {
      const children = renderChildren(props, flattedColumns.value, handleExpend, expendType.value)

      const BodyRowTag = bodyRowTag.value as any
      const nodes = [
        <BodyRowTag class={classes.value} {...clickEvents.value}>
          {children}
        </BodyRowTag>,
      ]

      if (props.expanded && expendType.value === 'render') {
        const expandedContext = renderExpandedContext(expandable.value, props, slots)
        expandedContext && nodes.push(expandedContext)
      }
      return nodes
    }
  },
})

function useClasses(props: TableBodyRowProps, tableProps: TableProps) {
  const rowClassName = computed(() => tableProps.rowClassName?.(props.record, props.index))
  const classes = computed(() => {
    const prefixCls = 'ix-table-tr'
    const computeRowClassName = rowClassName.value
    const { level } = props
    return {
      [prefixCls]: true,
      [computeRowClassName as string]: !!computeRowClassName,
      [`${prefixCls}-level-${level}`]: level > 0,
    }
  })
  return classes
}

function useExpendType(props: TableBodyRowProps, expandable: ComputedRef<TableColumnExpandable | undefined>) {
  return computed(() => {
    const { customExpand, disabled } = expandable.value || {}
    const { record, index } = props
    if (disabled && disabled(record, index)) {
      return 'none'
    }
    return customExpand ? 'render' : record.children ? 'nest' : 'none'
  })
}

function useClickEvents(
  expandable: ComputedRef<TableColumnExpandable<unknown> | undefined>,
  expendType: ComputedRef<'render' | 'nest' | 'none'>,
  handleExpend: () => void,
) {
  const noop = {}
  return computed(() => {
    if (expendType.value === 'none' || !expandable.value?.trigger) {
      return noop
    }
    if (expandable.value.trigger === 'click') {
      return { onClick: handleExpend }
    }
    return { onDblclick: handleExpend }
  })
}

function renderChildren(
  props: TableBodyRowProps,
  flattedColumns: TableColumnFlatted[],
  handleExpend: () => void,
  expendType: 'render' | 'nest' | 'none',
) {
  const children: VNodeTypes[] = []
  const { record, index } = props
  flattedColumns.forEach((column, colIndex) => {
    const colSpan = column.colSpan?.(record, index)
    const rowSpan = column.rowSpan?.(record, index)
    if (colSpan === 0 || rowSpan === 0) {
      return
    }
    if ('type' in column) {
      if (column.type === 'expandable') {
        children.push(renderExpandCol(props, column, handleExpend, colSpan, rowSpan, expendType === 'none'))
      }
    } else {
      children.push(renderCol(props, column, colIndex, colSpan, rowSpan))
    }
  })
  return children
}

function renderCol(
  props: TableBodyRowProps,
  column: TableColumnBaseFlatted,
  defaultKey: number,
  colSpan: number | undefined,
  rowSpan: number | undefined,
) {
  const { index, record } = props
  const { key = defaultKey, additional, align, dataKey, ellipsis, customRender } = column
  const colProps = { index, record, key, colSpan, rowSpan, additional, align, dataKey, ellipsis, customRender }
  return <BodyCol {...colProps}></BodyCol>
}

function renderExpandCol(
  props: TableBodyRowProps,
  column: TableColumnExpandableMerged,
  handleExpend: () => void,
  colSpan: number | undefined,
  rowSpan: number | undefined,
  disabled: boolean,
) {
  const { index, expanded, record, rowKey } = props
  const key = `${rowKey}-EXPAND`
  const { additional, icon, customIcon } = column
  const colProps = {
    index,
    expanded,
    key,
    record,
    colSpan,
    rowSpan,
    additional,
    icon,
    customIcon,
    handleExpend,
    disabled,
  }
  return <BodyColExpand {...colProps}></BodyColExpand>
}

function renderExpandedContext(expandable: TableColumnExpandable | undefined, props: TableBodyRowProps, slots: Slots) {
  const { customExpand } = expandable || {}
  const { record, index } = props
  let expandedContext: VNodeTypes | null = null
  if (isFunction(customExpand)) {
    expandedContext = customExpand({ record, index })
  } else if (isString(customExpand) && slots[customExpand]) {
    expandedContext = slots[customExpand]!({ record, index })
  }
  return expandedContext ? <BodyRowSingle>{expandedContext}</BodyRowSingle> : null
}
