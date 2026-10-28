import { Text, type TextProps } from 'react-native';

import { colors, typography, type TextVariant } from '@/theme/tokens';

type Props = TextProps & { variant?: TextVariant; color?: keyof typeof colors };

/** All app text goes through this so fonts, scaling and (later) tests stay consistent. Font scaling is NOT disabled. */
export function AppText({ variant = 'body', color = 'ink', style, ...rest }: Props) {
  return <Text {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
