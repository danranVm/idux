/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import type { CertainThemeTokens, GlobalThemeTokens } from '@idux/components/theme'
export function getDefaultThemeTokens(tokens: GlobalThemeTokens): CertainThemeTokens<'modal'> {
  const { fontSizeMd, fontWeightMd, colorTextTitle, colorTextInfo } = tokens

  return {
    titleFontSize: fontSizeMd,
    titleFontWeight: fontWeightMd,
    titleColor: colorTextTitle,
    titleWordBreak: 'break-word',

    contentColor: colorTextInfo,
    iconSize: 40,
  }
}
