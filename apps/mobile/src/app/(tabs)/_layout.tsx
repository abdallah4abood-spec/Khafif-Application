import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { CartTabIcon } from '@/features/cart/CartTabIcon';
import { colors, fonts, typography } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Feather>['name'];
const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} size={size} color={typeof color === 'string' ? color : colors.muted} />;
  };

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: typography.caption.fontSize },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceAlt },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), headerTitle: t('app.name'), tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: t('tabs.cart'), tabBarIcon: ({ color, size }) => <CartTabIcon color={color} size={size} /> }}
      />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
