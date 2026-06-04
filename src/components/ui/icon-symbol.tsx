// Android ve web için MaterialIcons kullanan simge bileşeni.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'book.fill': 'menu-book',
  'chart.bar.fill': 'insert-chart',
  'sun.max.fill': 'wb-sunny',
  'star.fill': 'star',
  'medal.fill': 'emoji-events',
  'person.fill': 'person',
} as const;

type IconSymbolName = keyof typeof MAPPING;

/**
 * Android ve web üzerinde Material Icons kullanan bir simge bileşeni.
 * Bu, platformlar arasında tutarlı bir görünüm sağlar.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
