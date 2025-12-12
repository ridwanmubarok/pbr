import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const widthBaseScale = SCREEN_WIDTH / 375;
const heightBaseScale = SCREEN_HEIGHT / 812;

function normalize(size: number, based: 'width' | 'height' = 'width') {
  const newSize =
    based === 'height' ? size * heightBaseScale : size * widthBaseScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

const widthPixel = (size: number) => normalize(size, 'width');
const heightPixel = (size: number) => normalize(size, 'height');
const fontPixel = (size: number) => heightPixel(size);
const pixelSizeVertical = (size: number) => heightPixel(size);
const pixelSizeHorizontal = (size: number) => widthPixel(size);

export {
  widthPixel,
  heightPixel,
  fontPixel,
  pixelSizeVertical,
  pixelSizeHorizontal,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
