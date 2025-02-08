import { tokenCache } from '~/utils/cache';
import '../global.css';
import 'react-native-url-polyfill/auto';
import { ClerkProvider } from '@clerk/clerk-expo';
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Stack } from 'expo-router';
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import ToastProvider, { Toast } from 'toastify-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, TouchableOpacity } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import { WifiOff } from 'lucide-react-native';

// Type for ErrorFallback props
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Ensure crypto polyfill
if (!global.crypto) {
  global.crypto = {
    getRandomValues: expoCryptoGetRandomValues,
  } as Crypto;
}

// Retrieve Clerk publishable key safely
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key - Ensure ENV variables are set correctly.');
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(console.warn);

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <View className="flex-1 items-center justify-center bg-[#343541] px-4">
      <Text className="text-white text-lg text-center mb-4">
        Something went wrong
      </Text>
      <Text className="text-gray-400 text-center mb-6">
        {error.message}
      </Text>
      <TouchableOpacity
        onPress={resetErrorBoundary}
        className="bg-[#10a37f] px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-medium">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const [isOffline, setIsOffline] = React.useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check initial connection state
        const state = await NetInfo.fetch();
        const isConnected = state.isConnected;
        setIsOffline(!isConnected);
        wasOffline.current = !isConnected;

        if (!isConnected) {
          Toast.error('No internet connection', 'top');
        }

        // Hide splash screen after connection check
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error during app initialization:', error);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected;
      setIsOffline(!isConnected);
      
      if (!isConnected && !wasOffline.current) {
        Toast.error('No internet connection', 'top');
        wasOffline.current = true;
      } else if (isConnected && wasOffline.current) {
        Toast.success('Connected to internet', 'top');
        wasOffline.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isOffline) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-[#343541] px-4">
          <WifiOff
            size={48}
            color="#ef4444"
            className="mb-4"
            strokeWidth={1.5}
          />
          <Text className="text-white text-lg text-center">
            No internet connection
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Please check your connection and try again
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey!}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#343541" />
          <SafeAreaView className="flex-1 bg-[#343541]">

            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#343541',
                },
                animation: 'none',
                presentation: 'modal',
                navigationBarColor: '#343541',
              }}
            >
              <Stack.Screen name="index" />
            </Stack>
          </SafeAreaView>
          <ToastProvider
            width={300}
            height="auto"
            offsetBottom={40}
            duration={3000}
            position="bottom"
            animationStyle="upInUpOut"
            animationInTiming={300}
            animationOutTiming={300}
            style={{
              backgroundColor: '#343541',
              borderRadius: 12,
              padding: 10,
              marginBottom: 10,
              maxWidth: '90%',
              borderWidth: 2,
              borderColor: '#4b5563',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
            textStyle={{
              color: '#ffffff',
              fontSize: 12,
              fontFamily: 'Inter',
              flexWrap: 'wrap',
              lineHeight: 16,
              textAlign: 'left',
              fontWeight: '500',
              maxWidth: '95%',
            }}
            successColor="#10a37f"
            errorColor="#ef4444"
            warningColor="#f59e0b"
            normalColor="#343541"
            showProgressBar={false}
            showCloseIcon={true}
            closeIconColor="#9ca3af"
            hasBackdrop={false}
          />
        </SafeAreaProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}