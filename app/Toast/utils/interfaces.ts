export type ToastPosition = 'top' | 'bottom' | 'center';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastTheme = 'light' | 'dark';
export type ToastAnimation = 
  | 'slideInDown' | 'slideOutUp' | 'bounce' | 'flash' | 'jello' | 'pulse' 
  | 'rotate' | 'rubberBand' | 'shake' | 'swing' | 'tada' | 'wobble' 
  | 'fadeIn' | 'fadeOut' | 'zoomIn' | 'zoomOut';

export interface ToastConfig {
  theme?: ToastTheme;
  position?: ToastPosition;
  duration?: number;
  width?: number;
  showCloseIcon?: boolean;
  showProgressBar?: boolean;
  animationIn?: ToastAnimation;
  animationOut?: ToastAnimation;
}

export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration: number;
  config: ToastConfig;
  show: (params: { 
    message: string; 
    type: ToastType; 
    position?: ToastPosition; 
    duration?: number 
  }) => void;
  hide: () => void;
  setConfig: (config: Partial<ToastConfig>) => void;
} 