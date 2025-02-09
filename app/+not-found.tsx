import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View className="flex-1 bg-[#343541]">
        <View className="flex-1 items-center justify-center p-8">
          {/* Error Icon with animated pulse effect */}
          <View className="animate-pulse">
            <AlertCircle size={80} color="#10a37f" strokeWidth={1.5} />
          </View>

          {/* Error Messages */}
          <Text className="mt-8 text-center text-3xl font-bold text-white">
            Oops!
          </Text>
          <Text className="mt-6 text-center text-xl font-bold text-white">
            Page Not Found
          </Text>
          <Text className="mt-3 text-center text-base text-gray-400">
            The page you're looking for doesn't exist or has been moved
          </Text>

          {/* Navigation Buttons */}
          <View className="mt-12 w-full space-y-4">
            <Link
              href="/"
              className="rounded-xl bg-[#10a37f] p-4 active:bg-[#0e906f]">
              <View className="flex-row items-center justify-center space-x-2">
                <Home size={24} color="white" strokeWidth={2} />
                <Text className="ml-2 text-center text-lg font-semibold text-white">
                  Back to Home
                </Text>
              </View>
            </Link>

            <Link
              href=".."
              className="rounded-xl border border-[#10a37f] p-4">
              <View className="flex-row items-center justify-center space-x-2">
                <ArrowLeft size={24} color="#10a37f" strokeWidth={2} />
                <Text className="ml-2 text-center text-lg font-semibold text-[#10a37f]">
                  Go Back
                </Text>
              </View>
            </Link>
          </View>
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
