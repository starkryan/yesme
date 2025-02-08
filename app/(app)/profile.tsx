import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import React, { useState } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-expo';


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
    <View className="flex-1 bg-[#343541]">
      {/* Header
      <View className="bg-[#2A2B32] px-6 py-6">
        <Text className="text-2xl font-bold text-white">Profile</Text>
        <Text className="text-gray-400 mt-1">Manage your account settings</Text>
      </View> */}

      {/* Content */}
      <View className="flex-1 px-6 py-8">
        {/* Profile Picture */}
        <View className="items-center">
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
          <View className="mt-6 items-center space-y-2">
            <Text className="text-2xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-base text-gray-300">{user?.emailAddresses[0].emailAddress}</Text>
            <Text className="text-sm text-[#10a37f] font-medium">
              Status: Active
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-12 space-y-4">
          <TouchableOpacity
            onPress={() => alert("Edit Profile feature coming soon!")}
            className="w-full rounded-lg bg-[#10a37f] py-3.5 active:bg-[#0e906f] mt-4"
          >
            <Text className="text-white text-center font-semibold">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSignOutModal(true)}
            className="w-full rounded-lg bg-transparent border border-red-500 py-3.5 active:bg-red-950/30 mt-4"
          >
            <Text className="text-red-500 text-center font-semibold">Sign Out</Text>
          </TouchableOpacity>

        </View>

        {/* Sign Out Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSignOutModal}
          onRequestClose={() => setShowSignOutModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-[#2A2B32] p-6 rounded-xl w-[85%] max-w-sm">
              <Text className="text-xl font-bold text-white text-center">Sign Out</Text>
              <Text className="text-gray-300 text-center mt-3">
                Are you sure you want to sign out?
              </Text>
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={() => setShowSignOutModal(false)}
                  className="flex-1 rounded-lg border border-gray-600 py-3 active:bg-gray-800"
                >
                  <Text className="text-center font-semibold text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowSignOutModal(false);
                    signOut();
                  }}
                  className="flex-1 rounded-lg bg-red-500 py-3 active:bg-red-600"
                >
                  <Text className="text-center font-semibold text-white">Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default Profile;
