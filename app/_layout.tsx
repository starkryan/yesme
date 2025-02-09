import { tokenCache } from '@/utils/cache';
import '../global.css';
import 'react-native-url-polyfill/auto';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Slot, useRouter } from 'expo-router';
import * as React from 'react';

import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useCallback, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import ToastManager from './Toast/components/ToastManager';
import { Toast } from './Toast';




// Add after CONSTANTS


const ERROR_MESSAGES = {
  NO_INTERNET: 'No internet connection. Some features may be limited.',
  BACK_ONLINE: 'Back online',
  APP_ACCESS_ERROR: 'Unable to access the app. Please check your connection and try again.',
  APP_START_ERROR: 'Unable to start the app. Please try again.',
  CHECK_CONNECTION: 'Please check your connection and try again',
} as const;



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
SplashScreen.preventAutoHideAsync();

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

const RootLayoutContent = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  const wasOffline = useRef(false);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState<boolean>(false);
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(false);
  const initializationAttempts = useRef(0);
  const maxInitAttempts = 3;
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Add NetInfo subscription
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (mountedRef.current) {
        const isConnected = state.isConnected;
        setIsOffline(!isConnected);

        if (!isConnected && !wasOffline.current) {
          Toast.error(ERROR_MESSAGES.NO_INTERNET);
          wasOffline.current = true;
        } else if (isConnected && wasOffline.current) {
          Toast.success(ERROR_MESSAGES.BACK_ONLINE);
          wasOffline.current = false;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleNavigation = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsNavigating(true);
    try {
      await router.replace('/(app)');
    } catch (error) {
      console.error('[Navigation Error]:', error);
      if (initializationAttempts.current < maxInitAttempts) {
        initializationAttempts.current += 1;
        initTimeoutRef.current = setTimeout(handleNavigation, 1000);
      } else {
        Toast.error(ERROR_MESSAGES.APP_ACCESS_ERROR);
      }
    } finally {
      if (mountedRef.current) {
        setIsNavigating(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!mountedRef.current) return;

        const state = await NetInfo.fetch();
        const isConnected = state.isConnected;

        if (mountedRef.current) {
          setIsOffline(!isConnected);
          wasOffline.current = !isConnected;
        }

        if (!isConnected) {
          Toast.error(ERROR_MESSAGES.CHECK_CONNECTION);
          await SplashScreen.hideAsync().catch(console.error);
          return;
        }

        if (mountedRef.current) {
          setIsReady(true);
        }

        await SplashScreen.hideAsync().catch(console.error);

        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        if (isLoaded && isReady && isSignedIn && mountedRef.current) {
          await handleNavigation();
        }
      } catch (error) {
        console.error('[App Initialization Error]:', error);
        Toast.error(ERROR_MESSAGES.APP_START_ERROR);
        await SplashScreen.hideAsync().catch(console.error);
        if (mountedRef.current) {
          setIsNavigating(false);
        }
      }
    };

    initializeApp();

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isLoaded, isSignedIn, isReady, handleNavigation]);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        await Promise.all([
          // Add your resource loading here
          new Promise(resolve => setTimeout(resolve, 500)), // Minimum loading time
        ]);
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || !isLoaded || isNavigating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#343541" />
      <SafeAreaView className="flex-1 bg-[#343541]" onLayout={onLayoutRootView}>
        <Slot />
      </SafeAreaView>
      <ToastManager
      theme="dark"
      position="top"
      positionValue={50}
      width={320}
      duration={3000}
      showCloseIcon={true}
      showProgressBar={true}
      />
    </SafeAreaProvider>

  );
};

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey!}>
        <RootLayoutContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}