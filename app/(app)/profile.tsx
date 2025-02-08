import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import React, { useState } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const defaultImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      {/* Header */}
      <View className="bg-[#2A2B32] px-6 py-4 border-b border-gray-700">
        <Text className="text-2xl font-bold text-white">Profile</Text>
        <Text className="text-gray-400 mt-1">Manage your account settings</Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center space-y-8 px-4 py-10">
        {/* Profile Picture */}
        <View className="relative">
          <Image 
            source={{ uri: user?.imageUrl || defaultImage }} 
            style={{ width: 120, height: 120, borderRadius: 60 }} 
            className="border-4 border-[#10a37f] shadow-md"
          />
          <TouchableOpacity 
            className="absolute bottom-0 right-0 bg-[#10a37f] p-2 rounded-full"
            onPress={() => alert("Change photo coming soon!")}
          >
            <Text className="text-white text-xs">Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* User Info */}
        <View className="items-center space-y-3">
          <Text className="text-3xl font-bold text-white">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-lg text-gray-300">{user?.emailAddresses[0].emailAddress}</Text>
          <Text className="text-sm text-[#10a37f]">
            Status: Active
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-3 px-4 mt-4">
          <TouchableOpacity
            onPress={() => alert("Edit Profile feature coming soon!")}
            className="w-full rounded-lg mt-4 bg-[#10a37f] py-4 active:bg-[#0e906f]"
          >
            <Text className="text-white text-center font-semibold">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSignOutModal(true)}
            className="w-full rounded-lg mt-4 border border-red-600 bg-[#ff1100] py-4 active:bg-[#900e0e]"
          >
            <Text className="text-white text-center font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSignOutModal}
          onRequestClose={() => setShowSignOutModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-[#343541] p-6 rounded-2xl w-[80%] items-center space-y-4">
              <Text className="text-xl font-bold text-red-500">Sign Out</Text>
              <Text className="text-gray-300 text-center">
                Are you sure you want to sign out?
              </Text>
              <View className="flex-row gap-4 w-full mt-2">
                <TouchableOpacity
                  onPress={() => setShowSignOutModal(false)}
                  className="flex-1 rounded-lg border border-gray-600 bg-transparent py-4 active:bg-gray-800"
                >
                  <Text className="text-center font-semibold text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowSignOutModal(false);
                    signOut();
                  }}
                  className="flex-1 rounded-lg bg-[#ff1100] py-4 active:bg-[#900e0e]"
                >
                  <Text className="text-center font-semibold text-white">Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
