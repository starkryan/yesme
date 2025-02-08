import { useOAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { useWarmUpBrowser } from "./warmUpBrowser";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { Toast } from "toastify-react-native";

export const useOAuthFlow = () => {
  useWarmUpBrowser();
  const router = useRouter();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onSelectAuth = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)');
        Toast.success('Successfully signed in with Google!');
      }
    } catch (err) {
      console.error("OAuth error:", err);
      Toast.error('Failed to sign in with Google');
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }, []);

  return onSelectAuth;
};
