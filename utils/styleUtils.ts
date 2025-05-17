// utils/styleUtils.ts
import {
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

// Helper function to merge styles together with proper typing
export const mergeStyles = (
  ...styles: Array<StyleProp<ViewStyle | TextStyle>>
) => {
  return Object.assign({}, ...styles);
};

// Common styles for reuse across components
export const globalStyles = StyleSheet.create({
  // Layout
  flexRow: {
    flexDirection: 'row',
  },
  flexColumn: {
    flexDirection: 'column',
  },
  flexGrow: {
    flexGrow: 1,
  },
  flex1: {
    flex: 1,
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },

  // Text styles
  textXs: {
    fontSize: FontSizes.xs,
  },
  textSm: {
    fontSize: FontSizes.sm,
  },
  textBase: {
    fontSize: FontSizes.base,
  },
  textLg: {
    fontSize: FontSizes.lg,
  },
  textXl: {
    fontSize: FontSizes.xl,
  },
  text2xl: {
    fontSize: FontSizes['2xl'],
  },
  text3xl: {
    fontSize: FontSizes['3xl'],
  },
  text4xl: {
    fontSize: FontSizes['4xl'],
  },

  // Font weights
  fontMedium: {
    fontWeight: '500',
  },
  fontSemibold: {
    fontWeight: '600',
  },
  fontBold: {
    fontWeight: 'bold',
  },

  // Colors - Text
  textWhite: {
    color: Colors.white,
  },
  textPrimary: {
    color: Colors.primary.DEFAULT,
  },
  textGray500: {
    color: Colors.gray[500],
  },
  textGray600: {
    color: Colors.gray[600],
  },
  textGray700: {
    color: Colors.gray[700],
  },
  textGray800: {
    color: Colors.gray[800],
  },

  // Colors - Background
  bgWhite: {
    backgroundColor: Colors.white,
  },
  bgGray50: {
    backgroundColor: Colors.gray[50],
  },
  bgGray100: {
    backgroundColor: Colors.gray[100],
  },
  bgGray700: {
    backgroundColor: Colors.gray[700],
  },
  bgGray800: {
    backgroundColor: Colors.gray[800],
  },
  bgGray900: {
    backgroundColor: Colors.gray[900],
  },
  bgPrimary: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  bgSecondary: {
    backgroundColor: Colors.secondary.DEFAULT,
  },
  bgSuccess: {
    backgroundColor: Colors.success,
  },
  bgError: {
    backgroundColor: Colors.error,
  },

  // Margins
  mb1: {
    marginBottom: Spacing[1],
  },
  mb2: {
    marginBottom: Spacing[2],
  },
  mb4: {
    marginBottom: Spacing[4],
  },
  mb6: {
    marginBottom: Spacing[6],
  },
  mb8: {
    marginBottom: Spacing[8],
  },
  mt1: {
    marginTop: Spacing[1],
  },
  mt2: {
    marginTop: Spacing[2],
  },
  mt4: {
    marginTop: Spacing[4],
  },
  my2: {
    marginVertical: Spacing[2],
  },
  my4: {
    marginVertical: Spacing[4],
  },
  my8: {
    marginVertical: Spacing[8],
  },
  mx2: {
    marginHorizontal: Spacing[2],
  },
  mx4: {
    marginHorizontal: Spacing[4],
  },

  // Padding
  p2: {
    padding: Spacing[2],
  },
  p3: {
    padding: Spacing[3],
  },
  p4: {
    padding: Spacing[4],
  },
  p6: {
    padding: Spacing[6],
  },
  px2: {
    paddingHorizontal: Spacing[2],
  },
  px4: {
    paddingHorizontal: Spacing[4],
  },
  py1: {
    paddingVertical: Spacing[1],
  },
  py2: {
    paddingVertical: Spacing[2],
  },
  py3: {
    paddingVertical: Spacing[3],
  },

  // Border radius
  roundedLg: {
    borderRadius: BorderRadius.lg,
  },
  roundedXl: {
    borderRadius: BorderRadius.xl,
  },
  roundedFull: {
    borderRadius: BorderRadius.full,
  },

  // Cards and common components
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Button styles
  btnPrimary: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnSecondary: {
    backgroundColor: Colors.secondary.DEFAULT,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnSuccess: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnError: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },

  // Form elements
  input: {
    backgroundColor: Colors.gray[100],
    color: Colors.gray[900],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    width: '100%',
  },
  inputDark: {
    backgroundColor: Colors.gray[700],
    color: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    width: '100%',
  },

  // Width and height
  w100: {
    width: '100%',
  },
  w75: {
    width: '75%',
  },
  w50: {
    width: '50%',
  },
  w25: {
    width: '25%',
  },
  h100: {
    height: '100%',
  },

  // Dark mode specific styles can be applied conditionally in components
});

// Apply dark mode styles
export function applyDarkMode<T extends object>(
  isDark: boolean,
  lightStyle: T,
  darkStyle: T,
): T {
  return isDark ? darkStyle : lightStyle;
}
