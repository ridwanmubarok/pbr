import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const deviceHeight = height;
export const deviceWidth = width;

export const isTablet = () => {
  const aspectRatio = height / width;
  return aspectRatio < 1.6;
};

export const isSmallDevice = () => {
  return height < 700;
};

export const isLargeDevice = () => {
  return height > 800;
};

export const getDeviceType = () => {
  if (isTablet()) return 'tablet';
  if (isSmallDevice()) return 'small';
  if (isLargeDevice()) return 'large';
  return 'medium';
};