import { useAuth, useClerk } from '@clerk/clerk-expo';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Home, User, Menu, LogOut, X } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LayoutGroup = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const sidebarOpenRef = useRef(false);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpenRef.current ? -280 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    sidebarOpenRef.current = !sidebarOpenRef.current;
  };

  const confirmSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { label: 'Home', icon: Home, route: '/' },
    { label: 'Profile', icon: User, route: '/profile' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      {/* Header - ChatGPT style */}
      <View className="flex-row items-center h-[40px] border-b border-gray-700">
        <TouchableOpacity onPress={toggleSidebar} className="px-2">
          <Menu size={20} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center absolute w-full">
          <Text className="text-sm font-semibold text-white">Lemi</Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {/* Sidebar */}
      <Animated.View
        className="absolute left-0 top-0 h-full w-[280px] bg-[#444654] shadow-xl"
        style={{ transform: [{ translateX: slideAnim }] }}
      >
        <View className="flex-row items-center justify-between border-b border-gray-600/30 p-5">
          <Text className="text-lg font-bold text-white">Menu</Text>
          <TouchableOpacity onPress={toggleSidebar} className="p-2 rounded-lg active:bg-gray-600/20">
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          {navigationItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                router.push(item.route);
                toggleSidebar();
              }}
              className="flex-row items-center px-4 py-3 rounded-lg active:bg-gray-600/30 mb-2"
            >
              <item.icon size={24} color="#fff" />
              <Text className="ml-4 text-white text-base font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity className="flex-row items-center px-4 py-3 mt-6 rounded-lg active:bg-gray-600/30" onPress={() => setShowModal(true)}>
            <LogOut size={24} color="#ef4444" />
            <Text className="ml-4 text-red-500 text-base font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logout Confirmation Modal */}
      <Modal animationType="fade" transparent visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 p-4">
          <View className="w-[90%] max-w-md rounded-xl bg-[#444654] p-6 shadow-lg">
            <Text className="text-lg font-semibold text-white mb-3 text-center">Sign Out</Text>
            <Text className="text-gray-300 text-center text-base mb-6">
              Are you sure you want to sign out?
            </Text>
            <View className="flex-row justify-center gap-4">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-500 rounded-lg"
              >
                <Text className="text-gray-300 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSignOut}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-[#10a37f] disabled:opacity-50"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base">Sign Out</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LayoutGroup;
