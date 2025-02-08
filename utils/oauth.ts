import { useOAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { useWarmUpBrowser } from "./warmUpBrowser";
import * as WebBrowser from "expo-web-browser";
import { Toast } from "toastify-react-native";

export const useOAuthFlow = () => {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onSelectAuth = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (!createdSessionId) {
        Toast.error('No session was created');
        return null;
      }

      // Return the session ID instead of handling navigation here
      return { createdSessionId, setActive };
    } catch (err) {
      console.error("OAuth error:", err instanceof Error ? err.message : err);
      Toast.error('Failed to sign in with Google');
      return null;
    } finally {
      await WebBrowser.coolDownAsync();
    }
  }, [startOAuthFlow]);

  return onSelectAuth;
};
