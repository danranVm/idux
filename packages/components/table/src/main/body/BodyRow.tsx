import type { ComputedRef, Slots, VNodeTypes } from 'vue'
import type { TableBodyRowProps, TableColumnExpandable, TableProps } from '../../types'
import type {
  TableColumnBaseFlatted,
  TableColumnExpandableMerged,
  TableColumnFlatted,
  TableColumnSelectableMerged,
} from '../../composables/useColumns'

import { computed, defineComponent, inject } from 'vue'
import { isFunction, isString } from 'lodash-es'
import { tableToken } from '../../token'
import { tableBodyRowProps } from '../../types'
import BodyCol from './BodyCol'
import BodyColExpand from './BodyColExpand'
import BodyRowSingle from './BodyRowSingle'
import BodyCollSelect from './BodyCollSelect'

export default defineComponent({
  props: tableBodyRowProps,
  setup(props) {
    const {
      props: tableProps,
      slots,
      flattedColumns,
      expandable,
      handleExpandChange,
      selectable,
      handleSelectChange,
      currentPageRowKeys,
      bodyRowTag,
    } = inject(tableToken)!

    const classes = useClasses(props, tableProps)
    const { expendDisabled, handleExpend, selectDisabled, handleSelect, clickEvents } = useEvents(
      props,
      expandable,
      handleExpandChange,
      selectable,
      handleSelectChange,
      currentPageRowKeys,
    )

    return () => {
      const children = renderChildren(
        props,
        flattedColumns.value,
        expendDisabled,
        handleExpend,
        selectDisabled,
        handleSelect,
      )

      const BodyRowTag = bodyRowTag.value as any
      const nodes = [
        <BodyRowTag class={classes.value} {...clickEvents.value}>
          {children}
        </BodyRowTag>,
      ]

      if (props.expanded) {
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

function useExpandDisabled(
  props: TableBodyRowProps,
  mergedColumn: ComputedRef<TableColumnExpandableMerged | undefined>,
) {
  return computed(() => {
    const column = mergedColumn.value
    if (!column) {
      return true
    }
    const { disabled, customExpand } = column
    const { record, index } = props
    if (disabled?.(record, index)) {
      return true
    }
    return !(customExpand || record.children?.length > 0)
  })
}

function useEvents(
  props: TableBodyRowProps,
  expandable: ComputedRef<TableColumnExpandableMerged | undefined>,
  handleExpandChange: (key: string | number, record: unknown) => void,
  selectable: ComputedRef<TableColumnSelectableMerged | undefined>,
  handleSelectChange: (key: string | number, record: unknown) => void,
  currentPageRowKeys: ComputedRef<{ enabledRowKeys: (string | number)[]; disabledRowKeys: (string | number)[] }>,
) {
  const expendDisabled = useExpandDisabled(props, expandable)
  const expendTrigger = computed(() => expandable.value?.trigger)
  const handleExpend = () => {
    const { rowKey, record } = props
    handleExpandChange(rowKey, record)
  }

  const selectDisabled = computed(() => currentPageRowKeys.value.disabledRowKeys.includes(props.rowKey))
  const selectTrigger = computed(() => selectable.value?.trigger)
  const handleSelect = () => {
    const { rowKey, record } = props
    handleSelectChange(rowKey, record)
  }

  const handleClick = () => {
    if (expendTrigger.value === 'click' && !expendDisabled.value) {
      handleExpend()
    }
    if (selectTrigger.value === 'click' && !selectDisabled.value) {
      handleSelect()
    }
  }

  const handleDblclick = () => {
    if (expendTrigger.value === 'dblclick' && !expendDisabled.value) {
      handleExpend()
    }
    if (selectTrigger.value === 'dblclick' && !selectDisabled.value) {
      handleSelect()
    }
  }

  const clickEvents = computed(() => {
    const onClick = expendTrigger.value === 'click' || selectTrigger.value === 'click' ? handleClick : undefined
    const onDblclick =
      expendTrigger.value === 'dblclick' || selectTrigger.value === 'dblclick' ? handleDblclick : undefined
    return { onClick, onDblclick }
  })

  return { expendDisabled, handleExpend, selectDisabled, handleSelect, clickEvents }
}

function renderChildren(
  props: TableBodyRowProps,
  flattedColumns: TableColumnFlatted[],
  expendDisabled: ComputedRef<boolean>,
  handleExpend: () => void,
  selectDisabled: ComputedRef<boolean>,
  handleSelect: () => void,
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
        children.push(renderExpandCol(props, colSpan, rowSpan, expendDisabled.value, handleExpend))
      } else {
        children.push(renderSelectCol(props, colSpan, rowSpan, selectDisabled.value, handleSelect))
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
  colSpan: number | undefined,
  rowSpan: number | undefined,
  disabled: boolean,
  handleExpend: () => void,
) {
  const { index, expanded, record, rowKey } = props
  const key = `${rowKey}-EXPAND`
  const colProps = { index, expanded, key, record, colSpan, rowSpan, handleExpend, disabled }
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

function renderSelectCol(
  props: TableBodyRowProps,
  colSpan: number | undefined,
  rowSpan: number | undefined,
  disabled: boolean,
  handleSelect: () => void,
) {
  const { rowKey } = props
  const key = `${rowKey}-SELECT`
  const colProps = { key, colSpan, rowSpan, rowKey, disabled, handleSelect }
  return <BodyCollSelect {...colProps}></BodyCollSelect>
}
