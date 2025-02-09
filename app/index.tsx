import { useAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from 'expo-router';
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
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isLoaded) {
      if (isSignedIn) {
        router.replace('/(app)');
      }
      // Don't navigate if not signed in - let GetStartedScreen show
    }
  }, [isLoaded, isSignedIn, mounted]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541] p-4">
        <Text className="text-white text-center">Something went wrong. Please try again.</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  // Show GetStartedScreen if not signed in
  if (!isSignedIn) {
    return <GetStartedScreen />;
  }

  // Loading state while navigation happens
  return (
    <View className="flex-1 items-center justify-center bg-[#343541]">
      <ActivityIndicator size="large" color="#10a37f" />
    </View>
  );
}

const GetStartedScreen = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Keep only the creative image animation
  const creativeImageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      creativeImageAnim.setValue(0);
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error('Error preparing app:', e);
      } finally {
        await SplashScreen.hideAsync();
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && mounted && isSignedIn) {
      router.replace("/(app)");
    } else if (appIsReady && !hasAnimated) {
      startAnimation();
      setHasAnimated(true);
    }
  }, [appIsReady, isSignedIn, hasAnimated, mounted]);

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
            onError={() => setImageLoadError(true)}
            accessible={true}
            accessibilityLabel="Creative illustration"
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
            onError={() => setImageLoadError(true)}
            accessible={true}
            accessibilityLabel="App icon"
          />

          <Text className="mt-8 text-center text-2xl font-bold text-white mb-2">
            Welcome to Lemi
          </Text>

          <Text className="text-center text-lg text-gray-300 px-4 leading-7">
            <Text>Your AI-powered </Text>
            <MaterialCommunityIcons 
              name="youtube" 
              size={24} 
              color="red" 
              style={{ verticalAlign: 'middle' }}
            />
            <Text className="text-red-500 font-semibold"> YouTube </Text>
            <Text>script writing assistant. Create engaging </Text>
            <Text className="text-white font-semibold">content effortlessly.</Text>
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

          <Text className="text-center text-sm text-gray-400">
            By continuing, you agree to our{' '}
            <Text 
              className="text-[#10a37f]" 
              onPress={() => setPrivacyModalVisible(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      <Modal
        isVisible={isPrivacyModalVisible}
        onBackdropPress={() => setPrivacyModalVisible(false)}
        onBackButtonPress={() => setPrivacyModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        accessible={true}
        accessibilityLabel="Privacy Policy"
        accessibilityRole="alert"
        useNativeDriver={true}
      >
        <View className="bg-[#343541] rounded-2xl p-6" style={{ maxHeight: '80%' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">Terms & Privacy Policy</Text>
            <Pressable onPress={() => setPrivacyModalVisible(false)}>
              <FontAwesome name="times" size={24} color="#9ca3af" />
            </Pressable>
          </View>
          
          <ScrollView 
            className="flex-grow"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text className="text-gray-300 mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </Text>

            <Text className="text-gray-300 mb-4">
              Welcome to Lemi. By using our services, you agree to these terms and our privacy practices.
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">1. Information Collection</Text>
            <Text className="text-gray-300 mb-4">
              • Personal Information: Email, name, and authentication details{'\n'}
              • Usage Data: App interaction patterns and preferences{'\n'}
              • Generated Content: Scripts and creative materials{'\n'}
              • Device Information: OS, device type, and app version{'\n'}
              • Analytics: Performance and crash reports
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">2. Data Usage & Processing</Text>
            <Text className="text-gray-300 mb-4">
              • Service Delivery: Providing and improving AI script generation{'\n'}
              • Personalization: Customizing content recommendations{'\n'}
              • Analytics: Understanding user behavior and preferences{'\n'}
              • Communication: Updates, support, and marketing (with consent){'\n'}
              • Legal Compliance: Meeting regulatory requirements
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">3. Content Rights & AI Usage</Text>
            <Text className="text-gray-300 mb-4">
              • You retain ownership of your generated content{'\n'}
              • Grant us license to process and store your content{'\n'}
              • AI models are trained on anonymized data{'\n'}
              • Content moderation policies apply{'\n'}
              • Fair usage limits may be implemented
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">4. Security Measures</Text>
            <Text className="text-gray-300 mb-4">
              • SSL/TLS encryption for data transmission{'\n'}
              • Regular security audits and penetration testing{'\n'}
              • Access controls and authentication protocols{'\n'}
              • Data backup and disaster recovery plans{'\n'}
              • Incident response procedures
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">5. User Rights & Controls</Text>
            <Text className="text-gray-300 mb-4">
              • Access and download your data{'\n'}
              • Request data modification or deletion{'\n'}
              • Opt-out of non-essential data collection{'\n'}
              • Cancel subscription and export content{'\n'}
              • Lodge privacy complaints
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">6. Third-Party Services</Text>
            <Text className="text-gray-300 mb-4">
              • Authentication providers{'\n'}
              • Analytics services{'\n'}
              • Cloud storage providers{'\n'}
              • Payment processors
            </Text>

            <Text className="text-lg font-semibold mb-2 text-white">7. Contact Information</Text>
            <Text className="text-gray-300 mb-4">
              For privacy inquiries:{'\n'}
              Email: privacy@lemi.ai{'\n'}
              Support: support@lemi.ai{'\n'}
              Address: [Your Company Address]
            </Text>

            <Text className="text-gray-300 mt-4 italic">
              This policy is subject to changes. Users will be notified of significant updates.
            </Text>
          </ScrollView>
          
          <Pressable
            className="w-full rounded-xl bg-[#10a37f] p-4 mt-4 shadow-sm active:bg-[#0e906f]"
            onPress={() => setPrivacyModalVisible(false)}
          >
            <Text className="text-center text-lg font-semibold text-white">I Understand</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
