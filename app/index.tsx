import { useAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import * as SplashScreen from 'expo-splash-screen';
import {
  View,
  ActivityIndicator,
  Text,
  Pressable,
  SafeAreaView,
  Image,
  Animated,
} from "react-native";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const GetStartedScreen = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  // Keep only the creative image animation
  const creativeImageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Reduce initial delay to 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      async function hideSplash() {
        try {
          await SplashScreen.hideAsync();
          if (isSignedIn) {
            router.replace("/(app)");
          } else if (!hasAnimated) {
            startAnimation();
            setHasAnimated(true);
          }
        } catch (e) {
          console.warn(e);
        }
      }
      hideSplash();
    }
  }, [appIsReady, isSignedIn, hasAnimated]);

  const startAnimation = () => {
    // Simplified animation focusing only on creative image
    Animated.spring(creativeImageAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 8, // Reduced damping for faster animation
      stiffness: 200, // Increased stiffness for faster animation
    }).start();
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <View className="flex-1">
        <Animated.View 
          className="w-full h-48 items-center justify-center mt-4"
          style={{
            opacity: creativeImageAnim,
            transform: [
              { scale: creativeImageAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1] // More dramatic scale effect
              })},
              { translateY: creativeImageAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0] // Add slide-up effect
              })}
            ]
          }}
        >
          <Image 
            source={require("../assets/creative.png")} 
            className="w-40 h-40 mt-8 object-contain"
            resizeMode="contain"
          />
        </Animated.View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Image
            source={require("../assets/icon.png")}
            className="w-36 h-36 object-contain"
            resizeMode="contain"
          />

          <Text className="mt-8 text-center text-2xl font-bold text-white mb-2">
            Welcome to Lemi
          </Text>

          <Text className="text-center text-lg text-gray-300 px-4 leading-7">
            Your AI-powered <Text className="text-red-400 font-semibold">YouTube</Text> script writing assistant. Create engaging <Text className="text-white font-semibold">content effortlessly.</Text>
          </Text>
        </View>

        {/* Buttons Section */}
        <View className="gap-5 px-8 pb-16 mb-8">
          <Link href="/(auth)/sign-up" asChild>
            <Pressable
              className="w-full rounded-xl bg-[#10a37f] py-4 shadow-lg"
              android_ripple={{ color: "#0e906f" }}
            >
              <Text className="text-center text-lg font-bold text-white">
                Get Started
              </Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              className="w-full rounded-xl border-2 border-gray-600 bg-transparent py-4"
              android_ripple={{ color: "rgba(255,255,255,0.1)" }}
            >
              <Text className="text-center text-lg font-bold text-white">
                I already have an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GetStartedScreen;
