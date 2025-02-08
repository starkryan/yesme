import { useSignIn } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { Link, Redirect, useRouter } from 'expo-router';
import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { Toast } from 'toastify-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRef } from 'react';
import { debounce } from 'lodash';


import { useOAuthFlow } from '../../utils/oauth';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const handleOAuth = useOAuthFlow();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showOTPModal, setShowOTPModal] = React.useState(false);
  const [isValidEmail, setIsValidEmail] = React.useState(true);
  const passwordInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);

  // Add email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add debounce for email validation
  const debouncedValidateEmail = React.useCallback(
    debounce((email: string) => {
      setIsValidEmail(validateEmail(email));
    }, 500),
    []
  );

  // Update email handling with better feedback
  const handleEmailChange = (text: string) => {
    const lowerText = text.toLowerCase();
    setEmailAddress(lowerText);
    debouncedValidateEmail(lowerText);
  };

  const onEmailSubmit = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    // Perform immediate validation check
    const isValid = validateEmail(emailAddress);
    if (!emailAddress || !isValid) {
      Toast.error('Please enter a valid email address', 'top');
      setIsValidEmail(isValid);
      return;
    }

    setIsLoading(true);

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: emailAddress,
      });

      const passwordFactor = supportedFirstFactors?.find((factor) => factor.strategy === 'password');

      if (passwordFactor) {
        setShowPasswordModal(true);
      } else {
        await signIn.create({
          identifier: emailAddress,
          strategy: 'email_code',
        });
        setShowOTPModal(true);
      }
    } catch (err: any) {
      // Improved error handling
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'An error occurred';
      
      // Check for specific error messages or codes
      if (errorMessage.toLowerCase().includes('no user found') || 
          errorMessage.toLowerCase().includes('user not found') ||
          errorMessage.toLowerCase().includes('invalid email address')) {
        Toast.error('No account found with this email. Please sign up first.', 'top');
      } else {
        Toast.error(errorMessage, 'top');
      }
      console.log('Sign in error:', errorMessage); // For debugging
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress, isValidEmail]);

  const onPasswordSubmit = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }
    if (!password) {
      Toast.error('Please enter your password', 'top');
      return;
    }
    setIsLoading(true);

    try {
      const attempt = await signIn.create({
        identifier: emailAddress,
        strategy: 'password',
        password,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        try {
          router.replace('/(app)');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
      } else {
        setShowOTPModal(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const errorMessage = (err as any).errors?.[0]?.message || err.message;
        if (errorMessage.toLowerCase().includes('invalid password')) {
          Toast.error('Incorrect password. Please try again.', 'top');
        } else if (errorMessage.toLowerCase().includes('too many attempts')) {
          Toast.error('Too many attempts. Please try again later.', 'top');
        } else {
          Toast.error('An error occurred. Please try again.', 'top');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress, password]);

  const onOTPSubmit = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }
    if (!code) {
      Toast.error('Please enter the verification code', 'top');
      return;
    }
    setIsLoading(true);

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(app)');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const errorMessage = (err as any).errors?.[0]?.message || err.message;
        Toast.error(errorMessage, 'top');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, code]);

  // Add this function before the renderOTPModal
  const handleOTPPaste = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText?.length === 6 && /^\d+$/.test(clipboardText)) {
        setCode(clipboardText);
        setTimeout(() => onOTPSubmit(), 300);
      }
    } catch (error) {
      console.log('Failed to paste OTP:', error);
    }
  };

  // Add cleanup effect
  React.useEffect(() => {
    return () => {
      setEmailAddress('');
      setPassword('');
      setCode('');
      setIsLoading(false);
      setShowPasswordModal(false);
      setShowOTPModal(false);
    };
  }, []);

  // Update the navigation to sign-up
  const navigateToSignUp = () => {
    setEmailAddress(''); // Clear state before navigation
    setPassword('');
    router.replace('/(auth)/sign-up');
  };

  // Add this near the top of your component
  const GoogleIcon = () => (
    <Image 
      source={require('../../assets/google.png')} 
      style={{ width: 24, height: 24 }} // Use style prop instead of className
    />
  );

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await handleOAuth();
    } catch (error) {
      Toast.error('Google sign-in failed', 'top');
    } finally {
      setIsLoading(false);
    }
  };

  // Add modal open effects for auto-focus
  React.useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [showPasswordModal]);

  React.useEffect(() => {
    if (showOTPModal) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [showOTPModal]);

  // Update password modal content
  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={() => {
        if (!isLoading) setShowPasswordModal(false);
      }}>
      <TouchableWithoutFeedback onPress={() => setShowPasswordModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl bg-[#343541] p-8">
              <View className="mb-1 items-end">
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <FontAwesome name="times" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <Text className="mb-4 text-2xl font-bold text-white">Enter Password</Text>
              <View className="relative">
                <TextInput
                  ref={passwordInputRef}
                  className="mb-4 rounded-xl border-2 border-gray-600 bg-transparent p-4 pl-12 text-white"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={onPasswordSubmit}
                  returnKeyType="done"
                  editable={!isLoading}
                />
                <View className="absolute left-4 top-4">
                  <FontAwesome name="lock" size={20} color="#9ca3af" />
                </View>
              </View>
              <TouchableOpacity
                className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                onPress={onPasswordSubmit}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Update OTP modal content
  const renderOTPModal = () => (
    <Modal
      visible={showOTPModal}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={() => {
        if (!isLoading) setShowOTPModal(false);
      }}>
      <TouchableWithoutFeedback onPress={() => setShowOTPModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl bg-[#343541] p-8">
              <View className="mb-1 items-end">
                <TouchableOpacity onPress={() => setShowOTPModal(false)}>
                  <FontAwesome name="times" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <Text className="mb-2 text-2xl font-bold text-white">Enter Verification Code</Text>
              <Text className="mb-4 text-gray-300">
                We've sent a verification code to your email
              </Text>
              <View className="relative">
                <TextInput
                  ref={codeInputRef}
                  className="mb-4 rounded-xl border-2 border-gray-600 bg-transparent p-4 pl-12 text-white"
                  placeholder="Enter verification code"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    // Auto-submit when code length is 6
                    if (text.length === 6) {
                      setTimeout(() => onOTPSubmit(), 300);
                    }
                  }}
                  onFocus={handleOTPPaste}
                  maxLength={6}
                  editable={!isLoading}
                />
                <View className="absolute left-4 top-4">
                  <FontAwesome name="key" size={20} color="#9ca3af" />
                </View>
              </View>
              <TouchableOpacity
                className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                onPress={onOTPSubmit}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-lg font-semibold text-white">Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Add keyboard handling improvements
  const scrollViewRef = useRef<ScrollView>(null);
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // Scroll to input when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  // Add an error boundary
  if (!signIn) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <Text className="text-white">Error loading authentication</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#343541]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}>
            <View className="flex-1 justify-center py-8">
              <View className="mb-10 px-8">
                <Text className="mb-3 text-center text-3xl font-bold text-white">Sign in</Text>
                <Text className="text-center text-base text-gray-300">to continue to Lemi</Text>
              </View>

              {/* Social Login Button */}
              <View className="mb-8 px-8">
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 border-gray-600 bg-transparent px-4 py-3.5">
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <Text className="text-base font-medium text-white ml-2">
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="mb-8 flex-row items-center px-8">
                <View className="h-[1px] flex-1 bg-gray-600" />
                <Text className="mx-4 text-gray-300">or</Text>
                <View className="h-[1px] flex-1 bg-gray-600" />
              </View>

              {/* Email Input */}
              <View className="space-y-5 px-8">
                <View>
                  <Text className="mb-2 font-medium text-gray-300">Email address</Text>
                  <View className="relative">
                    <TextInput
                      className="rounded-xl border-2 border-gray-600 bg-transparent p-4 pl-12 text-white"
                      autoCapitalize="none"
                      value={emailAddress}
                      placeholder="Enter email"
                      placeholderTextColor="#9ca3af"
                      onChangeText={(text) => handleEmailChange(text.toLowerCase())}
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                    <View className="absolute left-4 top-4">
                      <FontAwesome name="envelope-o" size={20} color="#9ca3af" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Continue Button */}
              <View className="mt-8 px-8">
                <TouchableOpacity
                  className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                  onPress={onEmailSubmit}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-center text-lg font-semibold text-white">Continue</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-300">Don't have an account? </Text>
                <Pressable onPress={navigateToSignUp}>
                  <Text className="font-semibold text-[#10a37f]">Sign up</Text>
                </Pressable>
              </View>

              {/* Forgot Password Link */}
              <View className="mt-4 flex-row justify-center">
                <Pressable onPress={() => router.push('/(auth)/reset-password')}>
                  <Text className="font-semibold text-[#10a37f]">Forgot password?</Text>
                </Pressable>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {renderPasswordModal()}
        {renderOTPModal()}
      </View>
    </TouchableWithoutFeedback>
  );
}