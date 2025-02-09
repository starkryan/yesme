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
import NetInfo from '@react-native-community/netinfo';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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

function RootLayoutContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isOffline, setIsOffline] = React.useState(false);
  const wasOffline = useRef(false);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(false);
  const initializationAttempts = useRef(0);
  const maxInitAttempts = 3;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Add NetInfo subscription
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (mountedRef.current) {
        const isConnected = state.isConnected;
        setIsOffline(!isConnected);
        
        if (!isConnected && !wasOffline.current) {
          Toast.error('No internet connection');
          wasOffline.current = true;
        } else if (isConnected && wasOffline.current) {
          Toast.success('Back online');
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
      router.replace('/(app)');
    } catch (error) {
      if (initializationAttempts.current < maxInitAttempts) {
        initializationAttempts.current += 1;
        setTimeout(handleNavigation, 500);
      } else {
        Toast.error('Failed to initialize. Please restart the app.');
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
        setIsOffline(!isConnected);
        wasOffline.current = !isConnected;

        if (!isConnected) {
          Toast.error('No internet connection');
          await SplashScreen.hideAsync();
          return;
        }

        setIsReady(true);
        await SplashScreen.hideAsync();

        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        if (isLoaded && isReady && isSignedIn && mountedRef.current) {
          await handleNavigation();
        }
      } catch (error) {
        console.error('[App Initialization Error]:', error);
        Toast.error('Failed to initialize. Please try again.');
        await SplashScreen.hideAsync();
        setIsNavigating(false);
      }
    };

    initializeApp();

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
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
          No internet connection
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Please check your connection and try again
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
      <ToastProvider
        width={300}
        height="auto"
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