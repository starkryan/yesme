import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-[#343541]">
        <View className="flex-1 items-center justify-center p-8">
          <FontAwesome name="exclamation-circle" size={64} color="#10a37f" />
          <Text className="mt-6 text-center text-2xl font-bold text-white">
            This screen doesn't exist
          </Text>
          <Text className="mt-2 text-center text-base text-gray-300">
            The page you're looking for cannot be found
          </Text>
          <Link
            href="/"
            className="mt-8 w-full rounded-xl bg-[#10a37f] p-4 active:bg-[#0e906f]">
            <View className="flex-row items-center justify-center space-x-2">
              <FontAwesome name="home" size={20} color="white" />
              <Text className="ml-2 text-center text-lg font-semibold text-white">
                Go to Home Screen
              </Text>
            </View>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = {
  container: `items-center flex-1 justify-center p-5`,
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
