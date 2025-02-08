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
  Modal,
} from 'react-native';
import { Toast } from 'toastify-react-native';

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

  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 8;
  };

  const onRequestReset = React.useCallback(async () => {
    if (!isLoaded) return;
    
    if (!validateEmail(emailAddress)) {
      setIsValidEmail(false);
      Toast.error('Please enter a valid email address');
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
      Toast.success('Reset code sent to your email');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message);
      } else {
        Toast.error('Failed to send reset code');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress]);

  const handleResendCode = async () => {
    if (!canResend || !isLoaded) return;
    
    setIsLoading(true);
    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'reset_password_email_code',
      });
      startResendTimer();
      Toast.success('New reset code sent to your email');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message);
      } else {
        Toast.error('Failed to resend code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = React.useCallback(async () => {
    if (!isLoaded) return;
    
    if (!validatePassword(password)) {
      setIsValidPassword(false);
      Toast.error('Password must be at least 8 characters long');
      return;
    }
    if (!code) {
      Toast.error('Please enter the verification code');
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
        Toast.success('Password successfully updated! You can now sign in with your new password');
        setShowResetModal(false);
        router.replace('/(auth)/sign-in');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        Toast.error((err as any).errors?.[0]?.message || err.message);
      } else {
        Toast.error('Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, code, password]);

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
            <View className="flex-1 justify-center py-8">
              <View className="mb-10 px-8">
                <Text className="mb-3 text-center text-3xl font-bold text-white">Reset Password</Text>
                <Text className="text-center text-base text-gray-300">
                  Enter your email to reset your password
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
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="font-semibold text-[#10a37f]">Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Reset Password Modal */}
        <Modal
          visible={showResetModal}
          transparent
          statusBarTranslucent
          animationType="slide"
          onRequestClose={() => setShowResetModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowResetModal(false)}>
            <View className="flex-1 justify-end bg-black/50">
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View className="rounded-t-3xl bg-[#343541] p-8">
                  <View className="mb-1 items-end">
                    <TouchableOpacity onPress={() => setShowResetModal(false)}>
                      <FontAwesome name="times" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <Text className="mb-2 text-2xl font-bold text-white">Reset Your Password</Text>
                  <Text className="mb-4 text-gray-300">
                    Enter the verification code sent to your email and your new password
                  </Text>
                  <View className="relative">
                    <FontAwesome 
                      name="key" 
                      size={20} 
                      color="#9ca3af" 
                      style={{ position: 'absolute', left: 16, top: 16 }}
                    />
                    <TextInput
                      className="mb-2 rounded-xl border-2 border-gray-600 bg-transparent p-4 pl-12 text-white"
                      placeholder="Enter verification code"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      value={code}
                      onChangeText={setCode}
                    />
                    <View className="mb-4 flex-row items-center justify-end">
                      {resendTimer > 0 ? (
                        <Text className="text-sm text-gray-400">
                          Resend code in {resendTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity 
                          onPress={handleResendCode}
                          disabled={!canResend || isLoading}
                        >
                          <Text className="text-sm text-[#10a37f]">
                            Resend code
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View className="relative">
                    <FontAwesome 
                      name="lock" 
                      size={20} 
                      color="#9ca3af" 
                      style={{ position: 'absolute', left: 16, top: 16 }}
                    />
                    <TextInput
                      className={`mb-4 rounded-xl border-2 ${
                        isValidPassword ? 'border-gray-600' : 'border-red-500'
                      } bg-transparent p-4 pl-12 pr-12 text-white`}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!passwordVisible}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setIsValidPassword(true);
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
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ResetPassword;
