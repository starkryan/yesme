import { Home, User, LogOut, X } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';

type SidebarProps = {
  slideAnim: Animated.Value;
  toggleSidebar: () => void;
  onSignOutPress: () => void;
}

const navigationItems = [
  { label: 'Home', icon: Home, route: '/' },
  { label: 'Profile', icon: User, route: '/profile' },
];

export const Sidebar = ({ slideAnim, toggleSidebar, onSignOutPress }: SidebarProps) => {
  const router = useRouter();

  return (
    <Animated.View
      className="absolute left-0 top-0 h-full w-[280px] bg-[#40414F] border-r-2 border-gray-600 shadow-xl shadow-black/50"
      style={{ transform: [{ translateX: slideAnim }] }}
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-600">
          <Text className="text-lg font-semibold text-white">Menu</Text>
          <TouchableOpacity 
            onPress={toggleSidebar}
            className="p-1 active:opacity-70"
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-2">
          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                router.push(item.route as any);
                toggleSidebar();
              }}
              className="flex-row items-center px-4 py-3.5 rounded-lg active:bg-gray-800/50"
            >
              <item.icon size={22} color="#fff" />
              <Text className="ml-4 text-white text-base font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="p-2 border-t border-gray-600">
          <TouchableOpacity 
            className="flex-row items-center px-4 py-3.5 rounded-lg active:bg-red-500/10"
            onPress={onSignOutPress}
          >
            <LogOut size={22} color="#ef4444" />
            <Text className="ml-3 text-red-500 text-base font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}; 