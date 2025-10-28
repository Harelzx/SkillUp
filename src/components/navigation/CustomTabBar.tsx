import { View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/tokens';
import { Typography } from '@/ui/Typography';
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic bottom padding - moderate safe area
  const bottomPadding = Math.max(insets.bottom || 0, 7);
  const minHeight = 56;
  const totalHeight = minHeight + bottomPadding;

  // Translucent background
  const backgroundColor = 'rgba(255, 255, 255, 0.85)';
  const borderColor = 'rgba(0, 0, 0, 0.08)';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor,
        borderTopWidth: 1,
        borderTopColor: borderColor,
        paddingTop: 4,
        paddingBottom: bottomPadding,
        minHeight: totalHeight,
        ...Platform.select({
          ios: {
            shadowColor: colors.gray[900],
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
          },
          android: {
            elevation: 18,
            borderTopWidth: 0.5,
          },
        }),
      }}
    >
      <View
        style={{
          flexDirection: 'row', // LTR layout for tab bar
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 8,
          gap: 4,
        }}
      >
        {state.routes
          .filter((route) => {
            // Hide routes with no tabBarIcon or when tabBarButton is a function (custom button = hidden)
            const { options } = descriptors[route.key];
            return options.tabBarIcon && !options.tabBarButton;
          })
          .map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconColor = isFocused ? colors.primary[600] : colors.gray[500];
          const Icon = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 50,
                paddingVertical: 4,
                paddingHorizontal: 4,
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {/* Icon and Label */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {Icon && (
                  <View style={{ marginBottom: 1 }}>
                    {Icon({
                      focused: isFocused,
                      color: iconColor,
                      size: isFocused ? 24 : 22,
                    })}
                  </View>
                )}
                <Typography
                  variant="caption"
                  style={{
                    color: iconColor,
                    fontSize: 11,
                    fontWeight: isFocused ? '700' : '600',
                    textAlign: 'center',
                    letterSpacing: 0,
                  }}
                  numberOfLines={1}
                >
                  {String(label)}
                </Typography>
              </View>
            </TouchableOpacity>
          );
          })
        }
      </View>
    </View>
  );
}

