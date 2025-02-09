import { useState, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Linking, Alert } from 'react-native';
import { Toast } from 'toastify-react-native';
import { PERMISSION_MESSAGES } from '~/utils/permissionMessages';

export const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<Record<string, boolean>>({});

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      Toast.error('Unable to open settings');
    }
  }, []);

  const handlePermissionDenial = useCallback((type: keyof typeof PERMISSION_MESSAGES) => {
    Alert.alert(
      'Permission Required',
      PERMISSION_MESSAGES[type].BLOCKED,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings }
      ]
    );
  }, [openSettings]);

  const checkPermission = useCallback(async (type: keyof typeof PERMISSION_MESSAGES) => {
    if (Platform.OS === 'web') return true;

    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (status === 'granted') {
        setPermissionStatus(prev => ({ ...prev, [type]: true }));
        return true;
      }

      if (!canAskAgain) {
        handlePermissionDenial(type);
        return false;
      }

      Toast.info(PERMISSION_MESSAGES[type].REQUEST);
      const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();

      const isGranted = newStatus === 'granted';
      setPermissionStatus(prev => ({ ...prev, [type]: isGranted }));

      if (!isGranted) {
        Toast.error(PERMISSION_MESSAGES[type].DENIED);
      }

      return isGranted;
    } catch (error) {
      console.error(`Permission check error (${type}):`, error);
      Toast.error('Unable to verify permissions');
      return false;
    }
  }, [handlePermissionDenial]);

  return {
    permissionStatus,
    checkPermission,
    openSettings,
  };
}; 