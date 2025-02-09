import { useSignUp } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
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
  GestureResponderEvent,
} from 'react-native';
import { Toast } from 'toastify-react-native';

import { OtpInput } from "react-native-otp-entry";



import { useOAuthFlow } from '../../utils/oauth';
import styles from 'toastify-react-native/components/styles';

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

const GoogleIcon = () => (
  <Image
    source={require('../../assets/google.png')}
    style={{ width: 24, height: 24 }}
  />
);

const SignUpScreen: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const handleOAuth = useOAuthFlow();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isPasswordValid, setIsPasswordValid] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Add email validation
  const [isEmailValid, setIsEmailValid] = React.useState(true);
  const [isSubmitAttempted, setIsSubmitAttempted] = React.useState(false);

  // Add new state for email existence check
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState(false);
  const emailCheckTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Add new states for password
  const [passwordStrength, setPasswordStrength] = React.useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  // Add ref for email input
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);

  // Add resend verification code functionality
  const [canResendCode, setCanResendCode] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(30);

  // Add new states for resend attempts
  const [resendAttempts, setResendAttempts] = React.useState(0);
  const MAX_RESEND_ATTEMPTS = 3;
  const LONG_COOLDOWN_MINUTES = 30;

  // Add new state for verification errors
  const [verificationError, setVerificationError] = React.useState('');

  // Add new state for timestamps
  const [lastResendTimestamp, setLastResendTimestamp] = React.useState<number>(0);

  // Add ref at the top of the SignUpScreen component
  const otpRef = React.useRef<{
    clear: () => void;
    focus: () => void;
    setValue: (value: string) => void;
  }>(null);

  // Add loading state for Google OAuth
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  // Add debounced password validation
  const passwordDebounceRef = React.useRef<NodeJS.Timeout>();

  // Add new state for OTP attempts
  const [otpAttempts, setOtpAttempts] = React.useState(0);
  const MAX_OTP_ATTEMPTS = 3;

  // Add back button handler
  const handleBack = () => {
    if (pendingVerification) {
      setPendingVerification(false);
      setCode('');
      setVerificationError('');
      setOtpAttempts(0);
    } else {
      router.push('/');
    }
  };

  // Add real-time email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update email validation function to include existence check
  const checkEmailExists = async (email: string) => {
    if (!validateEmail(email)) return;

    setIsCheckingEmail(true);
    try {
      // Temporary password should meet minimum requirements
      const response = await signUp?.create({
        emailAddress: email,
        password: 'TempPass123!', // More secure temporary password
      });
      setEmailExists(false);
    } catch (err: any) {
      if (err.errors?.[0]?.message?.toLowerCase().includes('already exists')) {
        setEmailExists(true);
        emailInputRef.current?.focus(); // Focus email field when duplicate found
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Enhanced email validation with immediate feedback
  const onEmailChange = (email: string) => {
    setEmailAddress(email);
    setIsEmailValid(validateEmail(email));

    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Only check email existence if it's valid
    if (validateEmail(email)) {
      setIsCheckingEmail(true);
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailExists(email);
      }, 300); // Reduced debounce time for better responsiveness
    }
  };

  // Enhanced password validation with detailed feedback
  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass) // More inclusive special character check
    };

    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({
      score,
      requirements
    });

    return score === 5;
  };

  // Enhanced password validation with debounce
  const onPasswordChange = (pass: string) => {
    setPassword(pass);
    
    // Clear previous timeout
    if (passwordDebounceRef.current) {
      clearTimeout(passwordDebounceRef.current);
    }

    // Debounce password validation to reduce UI jank
    passwordDebounceRef.current = setTimeout(() => {
      const isValid = validatePassword(pass);
      setIsPasswordValid(isValid);
    }, 300);
  };

  // Enhanced OAuth handling with loading state
  const onSelectOAuth = React.useCallback(async (e: GestureResponderEvent) => {
    if (isGoogleLoading) return;
    
    setIsGoogleLoading(true);
    try {
      await handleOAuth();
    } catch (err) {
      Toast.error('Google sign-up failed. Please try again.', 'top');
      console.error('OAuth error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [handleOAuth, isGoogleLoading]);

  // Enhanced verification code handling
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setVerificationError('');

    try {
      if (!code || code.length !== 6) {
        throw new Error('Please enter a complete verification code');
      }

      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });
      
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(app)');
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || err.message;
      setVerificationError(errorMessage);
      
      // Use Clerk's error messages directly
      Toast.error(errorMessage, 'top');
      
      // Clear invalid code
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Update the navigation to sign-in with toast
  const navigateToSignIn = () => {
    setEmailAddress('');
    setPassword('');
    router.replace('/(auth)/sign-in');
  };

  // Add auto-focus handling
  React.useEffect(() => {
    if (pendingVerification) {
      // Add slight delay for iOS to ensure proper focus
      setTimeout(() => {
        otpRef.current?.focus();
        if (Platform.OS === 'ios') {
          Keyboard.scheduleLayoutAnimation();
        }
      }, 100);
    }
  }, [pendingVerification]);

  // Render password strength indicator with color feedback
  const renderPasswordStrength = () => {
    const getStrengthColor = (score: number) => {
      if (score <= 1) return 'bg-red-500';
      if (score <= 3) return 'bg-yellow-500';
      if (score <= 4) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const getTextColor = (score: number) => {
      if (score <= 1) return 'text-red-500';
      if (score <= 3) return 'text-yellow-500';
      if (score <= 4) return 'text-blue-500';
      return 'text-green-500';
    };

    const getStrengthText = (score: number) => {
      if (score <= 1) return 'Very Weak';
      if (score <= 3) return 'Weak';
      if (score <= 4) return 'Good';
      return 'Strong';
    };

    return (
      <View className="mt-2">
        <View className="flex-row space-x-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index <= passwordStrength.score
                  ? getStrengthColor(passwordStrength.score)
                  : 'bg-gray-600'
                }`}
            />
          ))}
        </View>
        {password.length > 0 && (
          <View className="mt-3">
            <Text className={`text-sm font-medium mb-1.5 ${getTextColor(passwordStrength.score)}`}>
              {getStrengthText(passwordStrength.score)} Password
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                <View key={key} className="flex-row items-center">
                  <FontAwesome
                    name={met ? 'check-circle' : 'circle-o'}
                    size={12}
                    color={met ? '#10a37f' : '#4b5563'}
                  />
                  <Text className={`text-sm ml-1.5 ${met ? 'text-green-500' : 'text-gray-400'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Update email input with ref and keyboard handling
  const renderEmailInput = () => (
    <View>
      <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
      <View className="relative">
        <TextInput
          ref={emailInputRef}
          className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
            (!isEmailValid && isSubmitAttempted) || emailExists 
            ? 'border-red-500' : 'border-gray-600'
          }`}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          placeholderTextColor="#9ca3af"
          onChangeText={onEmailChange}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />
        <View className="absolute left-4 top-[17px]">
          <FontAwesome name="envelope" size={20} color="#9ca3af" />
        </View>
        {isCheckingEmail && (
          <View className="absolute right-4 top-4">
            <ActivityIndicator size="small" color="#10a37f" />
          </View>
        )}
      </View>
      {!isEmailValid && isSubmitAttempted && (
        <Text className="mt-2 text-sm text-red-500">
          Please enter a valid email address
        </Text>
      )}
      {emailExists && (
        <Text className="mt-2 text-sm text-red-500">
          This email is already registered. Please sign in instead.
        </Text>
      )}
    </View>
  );

  // Update verification screen with proper OTP implementation
  const renderVerificationScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View className="px-8">
        <View className="mb-8">
          <Text className="mb-3 text-center text-3xl font-bold text-white">
            Verify Email
          </Text>
          <Text className="text-center text-base text-gray-300">
            We've sent a 6-digit code to{"\n"}
            <Text className="font-semibold text-gray-200">{emailAddress}</Text>
          </Text>
        </View>

        <View className="mb-6">
          <OtpInput
            ref={otpRef}
            numberOfDigits={6}
            onTextChange={(text) => setCode(text)}
            theme={{
              containerStyle: {
                width: '100%',
                gap: 10,
              },
              inputsContainerStyle: {
                marginBottom: 16,
              },
              pinCodeContainerStyle: {
                borderWidth: 2,
                borderColor: verificationError ? '#ef4444' : '#4b5563',
                borderRadius: 12,
                backgroundColor: 'transparent',
                height: 56,
                width: 48,
              },
              pinCodeTextStyle: {
                color: '#ffffff',
                fontSize: 24,
                fontWeight: '600',
              },
              focusStickStyle: {
                backgroundColor: '#10a37f',
                width: 4,
              },
              focusedPinCodeContainerStyle: {
                borderColor: '#10a37f',
              },
            }}
          />
          {verificationError ? (
            <Text className="mt-2 text-sm text-red-500 text-center">
              {verificationError}
            </Text>
          ) : null}

          {/* Add Clear Button */}
          {code.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                otpRef.current?.clear();
                setCode('');
              }}
              className="mb-2"
            >
              <Text className="text-[#10a37f] text-center text-sm">Clear Code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className={`rounded-xl p-4 shadow-sm ${
            isLoading ? 'bg-gray-600' : 'bg-[#10a37f] active:bg-[#0e906f]'
          }`}
          onPress={onVerifyPress}
          disabled={isLoading || !code}>
          <Text className="text-center text-white text-lg">
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Text>
        </TouchableOpacity>

        {/* Resend code section */}
        <View className="mt-6">
          <Text className="text-center text-gray-300 text-sm mb-2">
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={resendVerificationCode}
            disabled={isLoading || !canResendCode || resendAttempts >= MAX_RESEND_ATTEMPTS}>
            <Text
              className={`text-center ${canResendCode && resendAttempts < MAX_RESEND_ATTEMPTS
                  ? 'text-[#10a37f]'
                  : 'text-gray-500'
                }`}>
              {isLoading
                ? 'Sending...'
                : resendAttempts >= MAX_RESEND_ATTEMPTS
                  ? `Too many attempts. Try again in ${formatTime(resendTimer)}`
                  : canResendCode
                    ? `Resend Code (${MAX_RESEND_ATTEMPTS - resendAttempts} attempts remaining)`
                    : `Resend code in ${formatTime(resendTimer)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Update timer effect to properly handle initialization and reset
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      const now = Date.now();
      const timeSinceLastResend = now - lastResendTimestamp;
      const requiredCooldown = resendAttempts >= MAX_RESEND_ATTEMPTS
        ? LONG_COOLDOWN_MINUTES * 60 * 1000
        : 30 * 1000;

      if (timeSinceLastResend >= requiredCooldown) {
        setCanResendCode(true);
        setResendTimer(0);
        clearInterval(interval);
      } else {
        const remainingTime = Math.ceil((requiredCooldown - timeSinceLastResend) / 1000);
        setResendTimer(remainingTime);
        setCanResendCode(false);
      }
    };

    // Only start timer if we have a last resend timestamp
    if (lastResendTimestamp > 0) {
      updateTimer(); // Initial update
      interval = setInterval(updateTimer, 1000);
    } else {
      // If no resend has happened yet, allow resending
      setCanResendCode(true);
      setResendTimer(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastResendTimestamp, resendAttempts]);

  // Update resendVerificationCode function to properly reset timer
  const resendVerificationCode = async () => {
    if (!isLoaded || isLoading || !canResendCode) return;

    if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
      Toast.error(`Maximum resend attempts reached. Please wait ${LONG_COOLDOWN_MINUTES} minutes.`, 'top');
      return;
    }

    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Reset verification state
      setCode('');
      otpRef.current?.clear();
      setOtpAttempts(0);
      setVerificationError('');
      
      // Update resend attempts and timer
      const newAttempts = resendAttempts + 1;
      setResendAttempts(newAttempts);
      setLastResendTimestamp(Date.now());
      setCanResendCode(false);
      
      const remainingAttempts = MAX_RESEND_ATTEMPTS - newAttempts;
      Toast.success(
        `Verification code resent successfully. ${remainingAttempts} ${
          remainingAttempts === 1 ? 'attempt' : 'attempts'
        } remaining`,
        'top'
      );
      
      if (newAttempts >= MAX_RESEND_ATTEMPTS) {
        setResendTimer(LONG_COOLDOWN_MINUTES * 60);
      } else {
        setResendTimer(30);
      }
    } catch (err: any) {
      console.error('Error resending verification code:', err);
      Toast.error('Failed to resend verification code. Please try again later.', 'top');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setIsSubmitAttempted(true);
    
    // Enhanced email validation
    if (!validateEmail(emailAddress)) {
      Toast.error('Please enter a valid email address', 'top');
      emailInputRef.current?.focus();
      return;
    }

    if (emailExists) {
      Toast.error('Email already exists. Please sign in instead.', 'top');
      return;
    }

    if (!validatePassword(password)) {
      Toast.error('Please enter a valid password', 'top');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send email verification code with enhanced error handling
      await sendVerificationCode();
      
    } catch (err: any) {
      console.error('Error during sign up:', err);
      
      // Enhanced error messaging
      let errorMessage = 'Sign up failed. Please try again.';
      if (err.errors?.[0]?.message) {
        if (err.errors[0].message.includes('email_address must be')) {
          errorMessage = 'Please enter a valid email address';
          emailInputRef.current?.focus();
        } else {
          errorMessage = err.errors[0].message;
        }
      }
      Toast.error(errorMessage, 'top');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new function to handle verification code sending
  const sendVerificationCode = async () => {
    try {
      if (!signUp) throw new Error("Sign up not initialized");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setResendAttempts(0); // Reset resend attempts
      setLastResendTimestamp(Date.now());
      setCanResendCode(false);
      setResendTimer(30);
      Toast.success('Verification code sent to your email', 'top');
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      Toast.error('Failed to send verification code. Please try again.', 'top');
      throw err; // Re-throw to be handled by the caller
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
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
              showsVerticalScrollIndicator={false}>
              <View className="pt-5 px-4 mb-2">
                <TouchableOpacity 
                  onPress={handleBack}
                  className="flex-row items-center p-2.5 rounded-full bg-gray-600/30 w-12"
                >
                  <FontAwesome name="arrow-left" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View className="flex-1 justify-center py-4">
                {pendingVerification ? (
                  renderVerificationScreen()
                ) : (
                  <>
                    <View className="mb-8 px-8">
                      <Text className="mb-2 text-center text-3xl font-bold text-white">
                        Create Account
                      </Text>
                      <Text className="text-center text-base text-gray-300">
                        Get started with Lemi
                      </Text>
                    </View>

                    {/* Social Login Button */}
                    <View className="mb-8 px-8">
                      <TouchableOpacity
                        onPress={onSelectOAuth}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 border-gray-600 bg-transparent px-4 py-4">
                        {isGoogleLoading ? (
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
                      <View className="h-px flex-1 bg-gray-600" />
                      <Text className="mx-3 text-gray-300 text-sm">OR</Text>
                      <View className="h-px flex-1 bg-gray-600" />
                    </View>

                    {/* Form */}
                    <View className="space-y-6 px-8">
                      {renderEmailInput()}

                      <View className="mb-2">
                        <Text className="mb-2.5 font-medium text-gray-300">Password</Text>
                        <View className="relative mb-1">
                          <TextInput
                            ref={passwordInputRef}
                            className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 pr-12 text-white text-base ${
                              !isPasswordValid && password.length > 0
                                ? 'border-red-500'
                                : 'border-gray-600'
                            }`}
                            value={password}
                            placeholder="Enter password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={!showPassword}
                            onChangeText={onPasswordChange}
                          />
                          <View className="absolute left-4 top-4">
                            <FontAwesome name="lock" size={20} color="#9ca3af" />
                          </View>
                          <TouchableOpacity
                            className="absolute right-4 top-4 p-1"
                            onPress={() => setShowPassword(!showPassword)}>
                            <FontAwesome
                              name={showPassword ? 'eye-slash' : 'eye'}
                              size={20}
                              color="#9ca3af"
                            />
                          </TouchableOpacity>
                        </View>
                        {/* {!isPasswordValid && password.length > 0 && (
                          <Text className="mt-2 text-sm text-red-500">
                            Password must contain at least 8 characters, including uppercase,
                            lowercase, number, and special character
                          </Text>
                        )} */}
                      </View>

                      {renderPasswordStrength()}
                    </View>

                    {/* Sign Up Button */}
                    <View className="mt-8 px-8">
                      <TouchableOpacity
                        className="w-full rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                        onPress={onSignUpPress}
                        disabled={isLoading}>
                        {isLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-center text-lg font-semibold text-white">
                            Create Account
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Sign In Link */}
                    <View className="mt-6 flex-row justify-center">
                      <Text className="text-gray-300">Already have an account? </Text>
                      <Pressable onPress={navigateToSignIn}>
                        <Text className="font-semibold text-[#10a37f]">Sign in</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </ErrorBoundary>
  );
};

export default SignUpScreen;

