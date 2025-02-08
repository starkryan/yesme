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
import ToastProvider  from 'toastify-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Ensure crypto polyfill
if (!global.crypto) {
  global.crypto = {
    getRandomValues: expoCryptoGetRandomValues,
  } as Crypto;
}

// Retrieve Clerk publishable key safely
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  console.warn('Missing Clerk Publishable Key - Ensure ENV variables are set correctly.');
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const toastRef = useRef<Toast>(null);


  useEffect(() => {
    const hideSplash = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey || ''}>
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
      {/* ToastProvider at Root Level */}
      <ToastProvider ref={toastRef}
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
    </ClerkProvider>
  );
}