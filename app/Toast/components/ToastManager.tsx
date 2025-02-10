import { create } from 'zustand';
import { CheckCircle, Info, AlertCircle, AlertTriangle, X } from "lucide-react-native";
import Modal from "react-native-modal";
import React, { useEffect, useRef, useCallback } from "react";
import { RFPercentage } from "react-native-responsive-fontsize";
import { View, Text, Animated, Dimensions, TouchableOpacity } from "react-native";

// Type definitions
type ToastPosition = 'top' | 'bottom' | 'center';
type ToastType = 'info' | 'success' | 'warning' | 'error';
type ToastTheme = 'light' | 'dark';

// Update ToastConfig interface to use the defined types
interface ToastConfig {
  theme?: ToastTheme;
  position?: ToastPosition;
  duration?: number;
  width?: number;
  showCloseIcon?: boolean;
  showProgressBar?: boolean;
  animationIn?: string;
  animationOut?: string;
}

// Update ToastState interface to use the defined types
interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration: number;
  config: ToastConfig;
  show: (params: { message: string; type: ToastType; position?: ToastPosition; duration?: number }) => void;
  hide: () => void;
  setConfig: (config: Partial<ToastConfig>) => void;
}

const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  message: '',
  type: 'info',
  position: 'top',
  duration: 3000,
  config: {
    theme: 'dark',
    position: 'top',
    duration: 3000,
    width: 320,
    showCloseIcon: true,
    showProgressBar: true,
    animationIn: 'slideInDown',
    animationOut: 'slideOutUp',
  },
  show: ({ message, type, position = 'top', duration = 3000 }) => 
    set({ isVisible: true, message, type, position, duration }),
  hide: () => set({ isVisible: false }),
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
}));

// Remove the duplicate interface and update the original one
interface ToastManagerProps {
  theme?: 'light' | 'dark';
  position?: 'top' | 'bottom' | 'center';
  positionValue?: number;
  width?: number;
  animationIn?: string;
  animationOut?: string;
  animationStyle?: any;
  animationInTiming?: number;
  animationOutTiming?: number;
  backdropColor?: string;
  backdropOpacity?: number;
  hasBackdrop?: boolean;
  height?: number;
  style?: any;
  textStyle?: any;
  showCloseIcon?: boolean;
  showProgressBar?: boolean;
  duration?: number;
}

const ToastManager: React.FC<ToastManagerProps> = ({ 
  theme,
  position: toastPosition,
  positionValue,
  width,
  animationIn,
  animationOut,
  animationStyle = {},
  animationInTiming = 300,
  animationOutTiming = 300,
  backdropColor = 'transparent',
  backdropOpacity = 0,
  hasBackdrop = false,
  height = Dimensions.get('window').height,
  style = {},
  textStyle = {},
  showCloseIcon,
  showProgressBar,
  duration = 3000,
  ...props 
}) => {
  const { isVisible, message, type, position: storePosition, duration: toastDuration, hide, config } = useToastStore();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Use config values as fallbacks
  const finalTheme = theme ?? config.theme ?? 'dark';
  const finalPosition = toastPosition ?? config.position ?? 'top';
  const finalWidth = width ?? config.width ?? 320;
  const finalAnimationIn = animationIn ?? config.animationIn ?? 'slideInDown';
  const finalAnimationOut = animationOut ?? config.animationOut ?? 'slideOutUp';

  useEffect(() => {
    if (isVisible) {
      startProgressAnimation();
      // Use toastDuration from store instead of component prop
      timeoutRef.current = setTimeout(hide, toastDuration);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      progressAnim.removeAllListeners();
      progressAnim.stopAnimation();
    };
  }, [isVisible, toastDuration]);

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: toastDuration,
      useNativeDriver: true,
    }).start();
  };

  const getToastColor = () => {
    const colors = {
      info: '#10a37f', // primary green color
      success: '#10a37f', // primary green color
      warning: '#eab308', // yellow-500
      error: '#ef4444', // red-500
    };
    return colors[type];
  };

  const getIcon = () => {
    const icons = {
      info: <Info size={16} color={getToastColor()} strokeWidth={2} />,
      success: <CheckCircle size={16} color={getToastColor()} strokeWidth={2} />,
      warning: <AlertTriangle size={16} color={getToastColor()} strokeWidth={2} />,
      error: <AlertCircle size={16} color={getToastColor()} strokeWidth={2} />,
    };
    return icons[type];
  };

  // Update how we handle position to use the correct prop
  const calculatedPositionValue = positionValue ?? (
    finalPosition === "top" ? 0 : 
    finalPosition === "center" ? height / 2 - RFPercentage(9) : 
    height - RFPercentage(10)
  );

  const handleBar = () => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: toastDuration,
      useNativeDriver: true
    }).start();
  };

  const hideToast = useCallback(() => {
    hide();
  }, [hide]);

  const pause = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    progressAnim.stopAnimation();
  }, [progressAnim]);

  const resume = useCallback(() => {
    const currentProgress = progressAnim.getValue();
    const remainingDuration = toastDuration * currentProgress;
    
    startProgressAnimation();
    timeoutRef.current = setTimeout(hide, remainingDuration);
  }, [toastDuration, progressAnim, hide]);

  // Replace existing position calculation with more precise version
  const calculatePosition = (position: ToastPosition, screenHeight: number): number => {
    const toastHeight = RFPercentage(9); // Match your actual toast height
    const positions = {
      top: toastHeight / 2,
      center: (screenHeight - toastHeight) / 2,
      bottom: screenHeight - toastHeight * 1.5,
    };
    return positions[position];
  };

  // Update progress bar interpolation to use transform
  const progressInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <Modal
      animationIn="slideInDown"
      animationOut="slideOutUp" 
      animationInTiming={animationInTiming}
      animationOutTiming={animationOutTiming}
      onTouchEnd={resume}
      onTouchStart={pause}
      swipeDirection={["up", "down", "left", "right"]}
      onSwipeComplete={hideToast}
      onModalHide={hide}
      isVisible={isVisible}
      coverScreen={false}
      backdropColor={backdropColor}
      backdropOpacity={backdropOpacity}
      hasBackdrop={hasBackdrop}
      className="m-0 justify-center items-center"
    >
      <View
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`${type} notification: ${message}`}
        className={`absolute w-[90%] max-w-[320px] min-h-[40px] rounded-xl shadow-lg border-2 ${
          type === 'info' ? 'border-[#10a37f]/30' :
          type === 'success' ? 'border-[#10a37f]/30' :
          type === 'warning' ? 'border-yellow-500/30' :
          'border-red-500/30'
        } ${
          finalTheme === 'dark' ? 'bg-[#343541]' : 'bg-white'
        }`}
        style={{
          top: calculatePosition(finalPosition, height),
          ...style,
        }}
      >
        <View className={`flex-row items-center p-3 gap-2 ${showCloseIcon ? 'pr-9' : 'pr-3'}`}>
          <View
            className={`rounded-xl p-1.5 border ${
              type === 'info' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
              type === 'success' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
              type === 'warning' ? 'bg-yellow-100/10 border-yellow-500/30' :
              'bg-red-100/10 border-red-500/30'
            }`}
          >
            {getIcon()}
          </View>
          <Text 
            className={`flex-1 font-medium text-sm ${
              finalTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'
            }`}
            style={textStyle}
          >
            {message}
          </Text>
        </View>

        {showCloseIcon && (
          <TouchableOpacity 
            onPress={hideToast} 
            activeOpacity={0.7} 
            className={`absolute right-2 top-2 p-1.5 rounded-xl border ${
              type === 'info' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
              type === 'success' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
              type === 'warning' ? 'bg-yellow-100/10 border-yellow-500/30' :
              'bg-red-100/10 border-red-500/30'
            }`}
          >
            <X size={16} color={getToastColor()} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {showProgressBar && (
          <View className="mx-4 mb-3">
            <View 
              className={`h-1 rounded-full overflow-hidden border ${
                type === 'info' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
                type === 'success' ? 'bg-[#10a37f]/10 border-[#10a37f]/30' :
                type === 'warning' ? 'bg-yellow-100/10 border-yellow-500/30' :
                'bg-red-100/10 border-red-500/30'
              }`}
            >
              <Animated.View 
                className={`absolute inset-y-0 left-0 h-full rounded-full ${
                  type === 'info' ? 'bg-[#10a37f]' :
                  type === 'success' ? 'bg-[#10a37f]' :
                  type === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  transform: [{
                    scaleX: progressInterpolation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0]
                    })
                  }],
                  width: '100%',
                  transformOrigin: 'left'
                }} 
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// Update helper functions
export const Toast = {
  info: (message: string, options?: Pick<ToastState, 'position' | 'duration'>) => 
    useToastStore.getState().show({ message, type: 'info', ...options }),
  success: (message: string, options?: Pick<ToastState, 'position' | 'duration'>) => 
    useToastStore.getState().show({ message, type: 'success', ...options }),
  warning: (message: string, options?: Pick<ToastState, 'position' | 'duration'>) => 
    useToastStore.getState().show({ message, type: 'warning', ...options }),
  error: (message: string, options?: Pick<ToastState, 'position' | 'duration'>) => 
    useToastStore.getState().show({ message, type: 'error', ...options }),
  configure: (config: Partial<ToastConfig>) => 
    useToastStore.getState().setConfig(config),
};

export default ToastManager;
