import { tokenCache } from '~/utils/cache';
import '../global.css';
import 'react-native-url-polyfill/auto';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Slot, useRouter } from 'expo-router';
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import ToastProvider, { Toast } from 'toastify-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import { WifiOff } from 'lucide-react-native';

// At the top of the file, after imports
const CONSTANTS = {
  BACKGROUND_COLOR: '#343541',
  ACCENT_COLOR: '#10a37f',
  ERROR_COLOR: '#ef4444',
  WARNING_COLOR: '#f59e0b',
  TOAST_DURATION: 3000,
  MAX_INIT_ATTEMPTS: 3,
} as const;

// Add this before RootLayoutContent
const TOAST_CONFIG = {
  width: 300,
  height: 'auto',
  duration: CONSTANTS.TOAST_DURATION,
  position: 'bottom' as const,
  animationStyle: 'upInUpOut',
  animationInTiming: 300,
  animationOutTiming: 300,
  style: {
    backgroundColor: CONSTANTS.BACKGROUND_COLOR,
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
  },
  textStyle: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter',
    flexWrap: 'wrap',
    lineHeight: 16,
    textAlign: 'left',
    fontWeight: '500',
    maxWidth: '95%',
  },
} as const;

// Add after CONSTANTS
const ERROR_MESSAGES = {
  NO_INTERNET: 'No internet connection',
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

function RootLayoutContent() {
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

  if (!isReady || !isLoaded || isNavigating) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  if (isOffline) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541] px-4">
        <WifiOff
          size={48}
          color="#ef4444"
          className="mb-4"
          strokeWidth={1.5}
        />
        <Text className="text-white text-lg text-center">
          {ERROR_MESSAGES.NO_INTERNET}
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          {ERROR_MESSAGES.CHECK_CONNECTION}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#343541" />
      <SafeAreaView className="flex-1 bg-[#343541]">
        <Slot />
      </SafeAreaView>
      <ToastProvider {...TOAST_CONFIG} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey!}>
        <RootLayoutContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}