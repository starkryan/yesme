import { useOAuth } from "@clerk/clerk-expo";
import { useCallback, useRef } from "react";
import { useWarmUpBrowser } from "~/utils/warmUpBrowser";
import * as WebBrowser from "expo-web-browser";
import { Toast } from "@/app/Toast";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

export const useOAuthFlow = () => {
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();
  const browserInstance = useRef<WebBrowser.WebBrowserResult | null>(null);
  const navigationAttempts = useRef(0);
  const maxAttempts = 3;

  const cleanupBrowser = useCallback(async () => {
    try {
      if (browserInstance.current) {
        await WebBrowser.dismissBrowser();
      }
      await WebBrowser.coolDownAsync();
    } catch (error) {
      console.error('Browser cleanup error:', error);
    }
  }, []);

  const navigateToApp = useCallback(async () => {
    if (navigationAttempts.current >= maxAttempts) {
      Toast.error('Navigation failed. Please try again.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await router.replace('/(app)');
    } catch (error) {
      navigationAttempts.current += 1;
      console.error('Navigation attempt failed:', error);
      
      if (navigationAttempts.current < maxAttempts) {
        setTimeout(() => navigateToApp(), 800);
      }
    }
  }, [router]);

  const onSelectAuth = useCallback(async () => {
    try {
      navigationAttempts.current = 0;
      await cleanupBrowser();

      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (!createdSessionId) {
        Toast.error('Authentication failed. Please try again.');
        return null;
      }

      if (setActive) {
        try {
          await setActive({ session: createdSessionId });
          Toast.success('Successfully signed in!');
          
          if (Platform.OS === 'web') {
            window.location.href = '/(app)';
            return;
          }

          await navigateToApp();
        } catch (error) {
          console.error('Session activation error:', error);
          Toast.error('Failed to complete sign in. Please try again.');
        }
      }

      return { createdSessionId, setActive };
    } catch (err) {
      console.error("OAuth error:", err);
      Toast.error('Sign in failed. Please check your connection and try again.');
      return null;
    } finally {
      await cleanupBrowser();
    }
  }, [startOAuthFlow, navigateToApp, cleanupBrowser]);

  return onSelectAuth;
};
