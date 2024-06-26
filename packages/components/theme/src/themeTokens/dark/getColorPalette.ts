/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/IDuxFE/idux/blob/main/LICENSE
 */

import type { ColorPalette } from '../shared'

import { getDarkColorPalette } from '../shared'

export const colors = {
  red: {
    l50: '#33151A',
    l40: '#4A1618',
    l30: '#821D1F',
    l20: '#A72122',
    l10: '#D42525',
    base: '#E8514C',
    d10: '#F37E75',
    d20: '#F8A89F',
    d30: '#FAC9C0',
    d40: '#FAD8D2',
  },
  orange: {
    l50: '#331C15',
    l40: '#4A2916',
    l30: '#7A3D16',
    l20: '#AB521B',
    l10: '#D8641B',
    base: '#E88641',
    d10: '#F3A76A',
    d20: '#F8C492',
    d30: '#FAD6AF',
    d40: '#FAE4CD',
  },
  brown: {
    l50: '#332515',
    l40: '#4A3616',
    l30: '#7A5517',
    l20: '#AD771C',
    l10: '#DB941D',
    base: '#FDAA1D',
    d10: '#F3CA6A',
    d20: '#F8DD92',
    d30: '#ECEBA1',
    d40: '#FAF2D7',
  },
  yellow: {
    l50: '#332C15',
    l40: '#4A4219',
    l30: '#736516',
    l20: '#A9941A',
    l10: '#D6BB1A',
    base: '#E8D43E',
    d10: '#F3E867',
    d20: '#F8F390',
    d30: '#FAF9AA',
    d40: '#FAFADC',
  },
  bud: {
    l50: '#243315',
    l40: '#364A16',
    l30: '#4C6B19',
    l20: '#649019',
    l10: '#7BB518',
    base: '#9ACA39',
    d10: '#B9E061',
    d20: '#D6F08E',
    d30: '#EAFAB4',
    d40: '#F3FADC',
  },
  green: {
    l50: '#153315',
    l40: '#1F4B16',
    l30: '#29641D',
    l20: '#2D8718',
    l10: '#34A917',
    base: '#56BD37',
    d10: '#7CD15D',
    d20: '#A3E288',
    d30: '#BCF1A1',
    d40: '#DAF1CF',
  },
  turquoise: {
    l50: '#153330',
    l40: '#164A3C',
    l30: '#0F694E',
    l20: '#1D8D69',
    l10: '#1FB182',
    base: '#40C695',
    d10: '#6ADCAE',
    d20: '#97EBC7',
    d30: '#B6FADB',
    d40: '#D9FAEB',
  },
  cyan: {
    l50: '#152B33',
    l40: '#16464A',
    l30: '#15686E',
    l20: '#189197',
    l10: '#19B6BE',
    base: '#3BD0D3',
    d10: '#65EAE7',
    d20: '#92F8F3',
    d30: '#B4FAF5',
    d40: '#CAFAF7',
  },
  glacier: {
    l50: '#162433',
    l40: '#16354A',
    l30: '#17547B',
    l20: '#1A70A6',
    l10: '#1A8BD2',
    base: '#40ADE8',
    d10: '#6AC8F4',
    d20: '#92DBF8',
    d30: '#A8E6FA',
    d40: '#C3EDFA',
  },
  blue: {
    l50: '#151D33',
    l40: '#16274A',
    l30: '#173B7A',
    l20: '#1A50AF',
    l10: '#1B61DD',
    base: '#4083E8',
    d10: '#6AA6F4',
    d20: '#92C2F8',
    d30: '#A7D1FA',
    d40: '#C3DEFA',
  },
  indigo: {
    l50: '#1E1533',
    l40: '#29164A',
    l30: '#3D177A',
    l20: '#561FAF',
    l10: '#6922DD',
    base: '#4852E8',
    d10: '#AB70F4',
    d20: '#C89AF8',
    d30: '#DAB6FA',
    d40: '#E7D2FA',
  },
  purple: {
    l50: '#2D132E',
    l40: '#451541',
    l30: '#66135D',
    l20: '#931885',
    l10: '#B919A5',
    base: '#8A48E8',
    d10: '#E565CC',
    d20: '#F593DF',
    d30: '#FAB6E9',
    d40: '#FAD0EF',
  },
  magenta: {
    l50: '#2D132E',
    l40: '#451541',
    l30: '#66135D',
    l20: '#931885',
    l10: '#B919A5',
    base: '#CF3CB7',
    d10: '#E565CC',
    d20: '#F593DF',
    d30: '#FAB6E9',
    d40: '#FAD0EF',
  },
  gold: {
    l50: '#472D06',
    l40: '#674109',
    l30: '#75460F',
    l20: '#9C641C',
    l10: '#C2862D',
    base: '#E7AA40',
    d10: '#F5C76C',
    d20: '#FFE099',
    d30: '#FFEFC2',
    d40: '#FFFCF0',
  },
  silver: {
    l50: '#222731',
    l40: '#2C303E',
    l30: '#3A4154',
    l20: '#5B647A',
    l10: '#7F8AA1',
    base: '#A9B4C8',
    d10: '#C7CCD4',
    d20: '#D3D9E0',
    d30: '#DFE5ED',
    d40: '#EBF2FA',
  },
  bronze: {
    l50: '#24100D',
    l40: '#30140C',
    l30: '#572919',
    l20: '#7D422A',
    l10: '#A35F40',
    base: '#C97F58',
    d10: '#D6A181',
    d20: '#E3C3AC',
    d30: '#F0E5DD',
    d40: '#FCF5ED',
  },
}

export function getColorPalette(color: string, bgColor?: string): ColorPalette {
  const baseColors = Object.keys(colors).map(name => ({ name, base: colors[name as keyof typeof colors].base }))

  const baseColor = baseColors.find(c => c.base === color)

  if (baseColor) {
    return colors[baseColor.name as keyof typeof colors] as ColorPalette
  }

  return getDarkColorPalette(color, bgColor)
}
