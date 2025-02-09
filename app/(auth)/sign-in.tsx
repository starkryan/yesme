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
  
  Image,
  Pressable,
} from 'react-native';
import { Toast } from 'toastify-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRef } from 'react';
import { debounce } from 'lodash';
import Modal from 'react-native-modal';


import { useOAuthFlow } from '../../utils/oauth';
import { OtpInput } from "react-native-otp-entry";

// Add ErrorBoundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#343541]">
          <Text className="text-white">Something went wrong. Please try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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

  // Add new states for OTP handling
  const [otpAttempts, setOtpAttempts] = React.useState(0);
  const MAX_OTP_ATTEMPTS = 3;
  const otpRef = React.useRef<{
    clear: () => void;
    focus: () => void;
    setValue: (value: string) => void;
  }>(null);

  // Add new state for selection modal
  const [showLoginMethodModal, setShowLoginMethodModal] = React.useState(false);

  // Add new state for resend timer
  const [resendTimer, setResendTimer] = React.useState(0);
  const [canResend, setCanResend] = React.useState(true);

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

      // Check for both password and email code strategies
      const passwordFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'password'
      );
      const emailCodeFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      // Show both options if available
      if (passwordFactor && emailCodeFactor) {
        setShowLoginMethodModal(true);
      } else if (passwordFactor) {
        setShowPasswordModal(true);
      } else {
        await signIn.create({
          identifier: emailAddress,
          strategy: 'email_code',
        });
        setShowOTPModal(true);
        startResendTimer();
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'An error occurred';
      
      if (errorMessage.toLowerCase().includes('no user found') || 
          errorMessage.toLowerCase().includes('user not found') ||
          errorMessage.toLowerCase().includes('invalid email address')) {
        Toast.error('No account found with this email. Please sign up first.', 'top');
      } else {
        Toast.error(errorMessage, 'top');
      }
      console.log('Sign in error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress, isValidEmail]);

  const onPasswordSubmit = React.useCallback(async () => {
    if (!isLoaded) return;
    
    if (!password) {
      Toast.error('Please enter your password', 'top');
      return;
    }
    setIsLoading(true);

    try {
      // First deactivate any existing session
      try {
        await signIn.deactivate();
      } catch (error) {
        console.log("Error deactivating existing session:", error);
      }

      // Create new sign-in attempt
      const attempt = await signIn.create({
        identifier: emailAddress,
        strategy: 'password',
        password,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(app)');
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
    if (!code || code.length !== 6) {
      Toast.error('Please enter a valid verification code', 'top');
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
        // Customize error messages for better user experience
        if (errorMessage.toLowerCase().includes('invalid code')) {
          Toast.error('Invalid verification code. Please try again.', 'top');
        } else if (errorMessage.toLowerCase().includes('expired')) {
          Toast.error('Code has expired. Please request a new one.', 'top');
        } else {
          Toast.error('Failed to verify code. Please try again.', 'top');
        }
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
      setShowLoginMethodModal(false);
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
      const result = await handleOAuth();
      if (!result) {
        Toast.error('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Toast.error('Google sign-in failed');
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

  // Update the OTP modal effect to focus and show keyboard
  React.useEffect(() => {
    if (showOTPModal) {
      // Short delay to ensure modal is fully visible
      const timer = setTimeout(() => {
        otpRef.current?.focus();
        if (Platform.OS === 'ios') {
          Keyboard.scheduleLayoutAnimation();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [showOTPModal]);

  // Update password modal content
  const renderPasswordModal = () => (
    <Modal
      isVisible={showPasswordModal}
      onBackdropPress={() => !isLoading && setShowPasswordModal(false)}
      onBackButtonPress={() => !isLoading && setShowPasswordModal(false)}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={{ margin: 0, justifyContent: 'flex-end' }}
      avoidKeyboard>
      <View className="rounded-t-3xl bg-[#343541] p-8">
        <View className="mb-1 items-end">
          <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
            <FontAwesome name="times" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <Text className="mb-4 text-2xl font-bold text-white">Enter Password</Text>
        <View className="mb-6">
          <Text className="mb-2.5 font-medium text-gray-300">Password</Text>
          <View className="relative">
            <TextInput
              ref={passwordInputRef}
              className="rounded-xl border-2 border-gray-600 bg-transparent p-4 pl-12 pr-12 text-white text-base"
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
    </Modal>
  );

  // Add timer effect
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Add resend timer start function
  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  // Update OTP modal content
  const renderOTPModal = () => (
    <Modal
      isVisible={showOTPModal}
      onBackdropPress={() => !isLoading && setShowOTPModal(false)}
      onBackButtonPress={() => !isLoading && setShowOTPModal(false)}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={{ margin: 0, justifyContent: 'flex-end' }}
      avoidKeyboard
      propagateSwipe>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        <View className="rounded-t-3xl bg-[#343541] p-8">
          <View className="mb-1 items-end">
            <TouchableOpacity onPress={() => setShowOTPModal(false)}>
              <FontAwesome name="times" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <Text className="mb-2 text-2xl font-bold text-white">Enter Verification Code</Text>
          <Text className="mb-6 text-gray-300">
            We've sent a verification code to your email
          </Text>

          <View className="mb-6">
            <OtpInput
              ref={otpRef}
              numberOfDigits={6}
              autoFocus={true}
              focusColor="#10a37f"
              onTextChange={(text) => setCode(text)}
              onFilled={(text) => {
                setCode(text);
                if (text.length === 6) {
                  onOTPSubmit();
                }
              }}
              theme={{
                containerStyle: {
                  width: '100%',
                  gap: 4,
                  marginBottom: 24,
                },
                inputsContainerStyle: {
                  height: 56,
                },
                pinCodeContainerStyle: {
                  backgroundColor: "#40414f",
                  borderColor: "#565869",
                  borderWidth: 2,
                  borderRadius: 12,
                  height: 56,
                  width: 44,
                },
                pinCodeTextStyle: {
                  color: "white",
                  fontSize: 24,
                  fontWeight: '600',
                },
                focusStickStyle: {
                  backgroundColor: "#10a37f",
                  width: 2,
                  height: 24,
                },
                focusedPinCodeContainerStyle: {
                  borderColor: "#10a37f",
                },
              }}
            />
          </View>

          <TouchableOpacity
            className={`rounded-xl p-4 shadow-sm ${
              isLoading ? 'bg-gray-600' : 'bg-[#10a37f] active:bg-[#0e906f]'
            }`}
            onPress={onOTPSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-lg font-semibold text-white">Verify</Text>
            )}
          </TouchableOpacity>

          {/* Add Resend OTP Option */}
          <View className="mt-6 flex-row justify-center items-center">
            {resendTimer > 0 ? (
              <Text className="text-gray-400 mr-2">
                Resend OTP in {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text className="text-[#10a37f]">
                  Didn't receive OTP? Resend
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Add new render method for login selection
  const renderLoginMethodModal = () => (
    <Modal
      isVisible={showLoginMethodModal}
      onBackdropPress={() => setShowLoginMethodModal(false)}
      onBackButtonPress={() => setShowLoginMethodModal(false)}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={{ margin: 0, justifyContent: 'flex-end' }}
      avoidKeyboard>
      <View className="rounded-t-3xl bg-[#343541] p-8">
        <View className="mb-1 items-end">
          <TouchableOpacity onPress={() => setShowLoginMethodModal(false)}>
            <FontAwesome name="times" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <Text className="mb-4 text-2xl font-bold text-white">Choose Login Method</Text>
        
        <TouchableOpacity
          className="mb-4 rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
          onPress={() => {
            setShowLoginMethodModal(false);
            setShowPasswordModal(true);
          }}>
          <Text className="text-center text-lg font-semibold text-white">
            Use Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
          onPress={async () => {
            setShowLoginMethodModal(false);
            await signIn.create({
              identifier: emailAddress,
              strategy: 'email_code',
            });
            setShowOTPModal(true);
          }}>
          <Text className="text-center text-lg font-semibold text-white">
            Use Email Code
          </Text>
        </TouchableOpacity>
      </View>
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

  const handleBack = () => {
    if (showPasswordModal || showOTPModal) {
      // If modals are open, close them first
      setShowPasswordModal(false);
      setShowOTPModal(false);
      setPassword('');
      setCode('');
    } else {
      // Navigate to the previous screen
      router.push('/');  // or your desired landing/home route
    }
  };

  // Add resend OTP function
  const handleResendOTP = async () => {
    if (!canResend || !isLoaded) return;

    setIsLoading(true);
    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'email_code',
      });
      startResendTimer();
      Toast.success('New OTP sent to your email', 'top');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message, 'top');
      } else {
        Toast.error('Failed to resend OTP', 'top');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    <ErrorBoundary>
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
              <View className="pt-5 px-4 mb-2">
                <TouchableOpacity 
                  onPress={handleBack}
                  className="flex-row items-center p-2.5 rounded-full bg-gray-600/30 w-12"
                >
                  <FontAwesome name="arrow-left" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View className="flex-1 justify-center py-4">
                <View className="mb-8 px-8">
                  <Text className="mb-2 text-center text-3xl font-bold text-white">Sign in</Text>
                  <Text className="text-center text-base text-gray-300">to continue to Lemi</Text>
                </View>

                {/* Updated Social Login Button */}
                <View className="mb-8 px-8">
                  <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 border-gray-600 bg-transparent px-4 py-4">
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

                {/* Updated Divider */}
                <View className="mb-8 flex-row items-center px-8">
                  <View className="h-px flex-1 bg-gray-600" />
                  <Text className="mx-3 text-gray-300 text-sm">OR</Text>
                  <View className="h-px flex-1 bg-gray-600" />
                </View>

                {/* Updated Form Container */}
                <View className="space-y-6 px-8">
                  <View>
                    <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
                    <View className="relative">
                      <TextInput
                        className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
                          !isValidEmail && emailAddress.length > 0 ? 'border-red-500' : 'border-gray-600'
                        }`}
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="Enter email"
                        placeholderTextColor="#9ca3af"
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                      <View className="absolute left-4 top-4">
                        <FontAwesome name="envelope" size={20} color="#9ca3af" />
                      </View>
                    </View>
                    {!isValidEmail && emailAddress.length > 0 && (
                      <Text className="mt-2 text-sm text-red-500">
                        Please enter a valid email address
                      </Text>
                    )}
                  </View>
                </View>

                {/* Updated Continue Button */}
                <View className="mt-8 px-8">
                  <TouchableOpacity
                    className="w-full rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                    onPress={onEmailSubmit}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center text-lg font-semibold text-white">Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Updated Sign Up Link */}
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-gray-300 text-sm">Don't have an account? </Text>
                  <Pressable onPress={navigateToSignUp}>
                    <Text className="font-semibold text-[#10a37f] text-sm">Sign up</Text>
                  </Pressable>
                </View>

                {/* Updated Forgot Password Link */}
                <View className="mt-4 flex-row justify-center">
                  <Pressable onPress={() => router.push('/(auth)/reset-password')}>
                    <Text className="font-semibold text-[#10a37f] text-sm">Forgot password?</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {renderLoginMethodModal()}
          {renderPasswordModal()}
          {renderOTPModal()}
        </View>
      </TouchableWithoutFeedback>
    </ErrorBoundary>
  );
}