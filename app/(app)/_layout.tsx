import { useAuth, useClerk } from '@clerk/clerk-expo';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Home, User, Menu, LogOut, X } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { AlignLeft } from 'lucide-react-native';

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
    <>
      {/* Header */}
      <View className="h-11 flex-row items-center justify-between px-4 bg-[#343541]">
        <TouchableOpacity 
          onPress={toggleSidebar}
          className="w-8 h-8 items-center justify-center"
        >
          <AlignLeft size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        

        <TouchableOpacity 
          className="w-8 h-8 items-center justify-center"
        >
          <AntDesign name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 bg-[#1E1E1E]">
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#1E1E1E' },
            animation: 'none',
          }} 


        />
      </View>

      {/* Sidebar */}
      <Animated.View
        className="absolute left-0 top-0 h-full w-[280px] bg-[#1E1E1E] border-r border-gray-800"
        style={{ transform: [{ translateX: slideAnim }] }}
      >
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
            <Text className="text-base font-medium text-white">Menu</Text>
            <TouchableOpacity onPress={toggleSidebar}>
              <X size={22} color="#fff" />
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
                className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-800"
              >
                <item.icon size={20} color="#fff" />
                <Text className="ml-3 text-white text-base">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="p-2 border-t border-gray-800">
            <TouchableOpacity 
              className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-800" 
              onPress={() => setShowModal(true)}
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="ml-3 text-red-500 text-base">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Modal */}
      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        backdropOpacity={0.5}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-[90%] max-w-md rounded-xl bg-[#1E1E1E] p-6 border border-gray-800">
            <Text className="text-lg font-medium text-white mb-3 text-center">Sign Out</Text>
            <Text className="text-gray-400 text-center text-base mb-6">
              Are you sure you want to sign out?
            </Text>
            <View className="flex-row justify-center space-x-3">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-700 rounded-lg active:bg-gray-800"
              >
                <Text className="text-white text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSignOut}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-red-500 active:bg-red-600"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base">Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};


export default LayoutGroup;
