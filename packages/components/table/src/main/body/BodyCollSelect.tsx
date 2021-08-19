import type { ComputedRef } from 'vue'
import type { TableBodyColSelectProps } from '../../types'
import type { TableColumnSelectableMerged } from '../../composables/useColumns'

import { computed, defineComponent, inject } from 'vue'
import { IxCheckbox } from '@idux/components/checkbox'
import { IxRadio } from '@idux/components/radio'
import { tableToken } from '../../token'
import { tableBodyColSelectProps } from '../../types'

export default defineComponent({
  props: tableBodyColSelectProps,
  setup(props) {
    const { bodyColTag, selectable, selectedRowKeys, indeterminateRowKeys } = inject(tableToken)!

    const selected = computed(() => selectedRowKeys.value.includes(props.rowKey))
    const indeterminate = computed(() => indeterminateRowKeys.value.includes(props.rowKey))
    const classes = useClasses(selectable, selected)

    return () => {
      const { colSpan, rowSpan } = props
      const mergedProps = {
        colSpan: colSpan === 1 ? undefined : colSpan,
        rowSpan: rowSpan === 1 ? undefined : rowSpan,
        class: classes.value,
      }
      const children = renderChildren(props, selectable, selected, indeterminate)

      const BodyColTag = bodyColTag.value as any
      return (
        <BodyColTag {...mergedProps} {...selectable.value!.additional}>
          {children}
        </BodyColTag>
      )
    }
  },
})

function useClasses(selectable: ComputedRef<TableColumnSelectableMerged | undefined>, selected: ComputedRef<boolean>) {
  return computed(() => {
    const { align } = selectable.value!
    const prefixCls = 'ix-table-td'
    return {
      [prefixCls]: true,
      [`${prefixCls}-align-${align}`]: true,
      [`${prefixCls}-selected`]: selected.value,
    }
  })
}

function renderChildren(
  props: TableBodyColSelectProps,
  selectable: ComputedRef<TableColumnSelectableMerged | undefined>,
  selectedRef: ComputedRef<boolean>,
  indeterminateRef: ComputedRef<boolean>,
) {
  const checked = selectedRef.value
  const indeterminate = indeterminateRef.value
  const { disabled, handleSelect: onChange } = props
  const { multiple } = selectable.value!
  if (multiple) {
    const checkboxProps = { checked, disabled, indeterminate, onChange }
    return <IxCheckbox {...checkboxProps}></IxCheckbox>
  } else {
    const radioProps = { checked, disabled, onChange }
    return <IxRadio {...radioProps}></IxRadio>
  }
}
