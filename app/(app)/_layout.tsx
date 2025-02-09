import { useAuth, useClerk } from '@clerk/clerk-expo';
import { Redirect, Stack, useRouter } from 'expo-router';
import { PenSquare, AlignLeft } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, SafeAreaView } from 'react-native';
import Modal from 'react-native-modal';
import Sidebar from '../components/Sidebar';


const LayoutGroup = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const sidebarOpenRef = useRef(false);

  // Memoize authentication state
  const authState = React.useMemo(() => ({
    isLoaded,
    isSignedIn
  }), [isLoaded, isSignedIn]);

  // Handle loading state with splash screen
  if (!authState.isLoaded) {
    return null; // Keep splash screen visible
  }

  if (!authState.isSignedIn) {
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

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="h-14 flex-row items-center justify-between px-4 bg-[#343541] border-b border-gray-600">
        <TouchableOpacity
          onPress={toggleSidebar}
          className="w-10 h-10 items-center justify-center active:opacity-70"
        >
          <AlignLeft size={24} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-10 h-10 items-center justify-center active:opacity-70"
        >
          <PenSquare size={24} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Stack Navigator */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#343541' },
          animation: 'none',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Stack>

      {/* Sidebar Component */}
      <Sidebar
        slideAnim={slideAnim}
        toggleSidebar={toggleSidebar}
        onSignOutPress={() => setShowModal(true)}
      />

      {/* Modal */}
      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        backdropOpacity={0.7}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={{ margin: 0 }}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View className="w-[90%] max-w-md rounded-2xl bg-[#40414F] p-6 border-2 border-gray-600 shadow-2xl shadow-black/50">
            <View className="pb-4 mb-4">
              <Text className="text-xl font-bold text-white text-center">Confirm Sign Out</Text>
            </View>
            <Text className="text-gray-300 text-center text-base mb-8 px-4">
              Are you sure you want to sign out of your account?
            </Text>
            <View className="flex-row justify-center gap-4">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 px-6 py-3.5 border border-gray-600 rounded-full active:bg-gray-800"
              >
                <Text className="text-white text-base font-medium text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSignOut}
                disabled={loading}
                className="flex-1 px-6 py-3.5 rounded-full bg-red-500 active:bg-red-600"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-medium text-center">Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LayoutGroup;
