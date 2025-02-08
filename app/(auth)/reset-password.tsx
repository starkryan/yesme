import { useSignIn } from '@clerk/clerk-expo';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Toast } from 'toastify-react-native';
import { OtpInput } from "react-native-otp-entry";
import Modal from 'react-native-modal';

const ResetPassword = () => {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isValidEmail, setIsValidEmail] = React.useState(true);
  const [isValidPassword, setIsValidPassword] = React.useState(true);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [canResend, setCanResend] = React.useState(true);
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
  const [resetAttempts, setResetAttempts] = React.useState(0);
  const [nextResetTime, setNextResetTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  React.useEffect(() => {
    if (nextResetTime && new Date() >= nextResetTime) {
      setResetAttempts(0);
      setNextResetTime(null);
    }
  }, [nextResetTime]);

  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    setPasswordStrength({
      score,
      requirements
    });

    return score === 5;
  };

  const onRequestReset = React.useCallback(async () => {
    if (!isLoaded) return;
    
    if (resetAttempts >= 2) {
      if (!nextResetTime) {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        setNextResetTime(nextHour);
      }
      Toast.error('Too many reset attempts. Please try again in 1 hour.', 'top');
      return;
    }

    if (!validateEmail(emailAddress)) {
      setIsValidEmail(false);
      Toast.error('Please enter a valid email address', 'top');
      return;
    }
    setIsValidEmail(true);
    setIsLoading(true);

    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'reset_password_email_code',
      });
      setShowResetModal(true);
      startResendTimer();
      Toast.success('Reset code sent to your email', 'top');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message, 'top');

      } else {
        Toast.error('Failed to send reset code', 'top');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress, resetAttempts, nextResetTime]);

  const handleResendCode = async () => {
    if (!canResend || !isLoaded) return;
    
    if (resetAttempts >= 2) {
      if (!nextResetTime) {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        setNextResetTime(nextHour);
      }
      Toast.error('Too many reset attempts. Please try again in 1 hour.', 'top');
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'reset_password_email_code',
      });
      startResendTimer();
      Toast.success('New reset code sent to your email', 'top');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message, 'top');

      } else {
        Toast.error('Failed to resend code', 'top');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = React.useCallback(async () => {
    if (!isLoaded) return;
    
    if (!validatePassword(password)) {
      setIsValidPassword(false);
      Toast.error('Password must be at least 8 characters long', 'top');
      return;
    }
    if (!code) {
      Toast.error('Please enter the verification code', 'top');
      return;
    }
    setIsValidPassword(true);
    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        setShowResetModal(false);
        
        try {
          // Properly cleanup the session
          await signIn.deactivate();
          Toast.success('Password successfully updated! You can now sign in with your new password', 'top');
          router.replace('/(auth)/sign-in');
        } catch (error) {
          console.log("Error during session cleanup:", error);
          // Even if cleanup fails, still redirect to sign-in
          router.replace('/(auth)/sign-in');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        Toast.error(clerkError.errors?.[0]?.message || err.message, 'top');
      } else {
        Toast.error('Failed to reset password', 'top');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, code, password]);

  const renderPasswordStrength = () => {
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ff4444', '#ffa700', '#ffeb3b', '#00c853', '#00c853'];

    return (
      <View className="mt-2">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-300">Password Strength: </Text>
          <Text style={{ color: strengthColors[passwordStrength.score - 1] }}>
            {strengthLabels[passwordStrength.score - 1]}
          </Text>
        </View>
        <View className="flex-row space-x-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor:
                  passwordStrength.score >= index
                    ? strengthColors[passwordStrength.score - 1]
                    : '#4b5563',
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
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
            showsVerticalScrollIndicator={false}>
            <View className="pt-5 px-4 mb-2">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="flex-row items-center p-2.5 rounded-full bg-gray-600/30 w-12"
              >
                <FontAwesome name="arrow-left" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="flex-1 justify-center py-8">
              <View className="mb-10 px-8">
                <Text className="mb-3 text-center text-3xl font-bold text-white">Reset Password</Text>
                <Text className="text-center text-base text-gray-300">
                  Enter your email to receive a reset link
                </Text>
              </View>

              <View className="space-y-5 px-8">
                <View>
                  <Text className="mb-2 font-medium text-gray-300">Email address</Text>
                  <View className="relative">
                    <FontAwesome 
                      name="envelope" 
                      size={20} 
                      color="#9ca3af" 
                      style={{ position: 'absolute', left: 16, top: 16 }}
                    />
                    <TextInput
                      className={`rounded-xl border-2 ${
                        isValidEmail ? 'border-gray-600' : 'border-red-500'
                      } bg-transparent p-4 pl-12 text-white`}
                      autoCapitalize="none"
                      value={emailAddress}
                      placeholder="Enter email"
                      placeholderTextColor="#9ca3af"
                      onChangeText={(text) => {
                        setEmailAddress(text);
                        setIsValidEmail(true);
                      }}
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {!isValidEmail && (
                    <Text className="mt-2 text-sm text-red-500">
                      Please enter a valid email address
                    </Text>
                  )}
                </View>
              </View>

              <View className="mt-8 px-8">
                <TouchableOpacity
                  className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                  onPress={onRequestReset}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-center text-lg font-semibold text-white">
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-300">Remember your password? </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
                  <Text className="font-semibold text-[#10a37f]">Sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          isVisible={showResetModal}
          statusBarTranslucent
          onBackdropPress={() => setShowResetModal(false)}
          onBackButtonPress={() => setShowResetModal(false)}
          useNativeDriver
          style={{ margin: 0 }}
          avoidKeyboard>
          <View className="flex-1 justify-end">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="rounded-t-3xl bg-[#343541] p-8">
                <View className="mb-4 items-end">
                  <TouchableOpacity onPress={() => setShowResetModal(false)}>
                    <FontAwesome name="times" size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                <Text className="mb-2 text-2xl font-bold text-white">Reset Password</Text>
                
                <View className="mb-6">
                  <OtpInput
                    numberOfDigits={6}
                    onFilled={(text) => setCode(text)}
                    theme={{
                      pinCodeContainerStyle: {
                        backgroundColor: "#40414f",
                        borderColor: "#565869",
                      },
                      focusStickStyle: { backgroundColor: "#10a37f" },
                      focusedPinCodeContainerStyle: {
                        borderColor: "#10a37f",
                      },
                      pinCodeTextStyle: { color: "white" },
                    }}
                  />
                </View>

                <View className="mb-6">
                  <Text className="mb-2.5 font-medium text-gray-300">New Password</Text>
                  <View className="relative">
                    <FontAwesome 
                      name="lock" 
                      size={20} 
                      color="#9ca3af" 
                      style={{ position: 'absolute', left: 16, top: 16 }}
                    />
                    <TextInput
                      className={`rounded-xl border-2 ${
                        isValidPassword ? 'border-gray-600' : 'border-red-500'
                      } bg-transparent p-4 pl-12 pr-12 text-white`}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!passwordVisible}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setIsValidPassword(true);
                        validatePassword(text);
                      }}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity 
                      style={{ position: 'absolute', right: 16, top: 16 }}
                      onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                      <FontAwesome 
                        name={passwordVisible ? "eye-slash" : "eye"} 
                        size={20} 
                        color="#9ca3af" 
                      />
                    </TouchableOpacity>
                  </View>
                  {password && renderPasswordStrength()}
                </View>

                <TouchableOpacity
                  className="rounded-xl bg-[#10a37f] p-4 shadow-sm active:bg-[#0e906f]"
                  onPress={onResetPassword}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-center text-lg font-semibold text-white">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>

                <View className="mt-6 flex-row justify-center items-center">
                  {resendTimer > 0 ? (
                    <Text className="text-gray-400 mr-2">
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendCode}>
                      <Text className="text-[#10a37f]">
                        Didn't receive code? Resend
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ResetPassword;


