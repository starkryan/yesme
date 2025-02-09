import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';
import { Toast } from 'toastify-react-native';

export const checkStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
    return status === 'granted';
  } catch (error) {
    console.error('Storage permission error:', error);
    return false;
  }
};

export const ensurePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const hasPermission = await checkStoragePermission();
    if (!hasPermission) {
      Toast.error('Storage permission is required for saving files');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Permission check error:', error);
    Toast.error('Unable to verify permissions');
    return false;
  }
}; 