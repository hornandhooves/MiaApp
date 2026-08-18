import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mía Tulum",
  slug: "mia-tulum-app",
  version: "0.1.0",
  scheme: "mia",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.mia.app",
    supportsTablet: false,
    googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      NSCameraUsageDescription:
        "La cámara se usa para escanear el código QR de tu camastro o mesa.",
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: [],
  },
  android: {
    package: "com.mia.app",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      backgroundColor: "#DAD3C7",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-localization",
    [
      "expo-camera",
      {
        cameraPermission:
          "La cámara se usa para escanear el código QR de tu camastro o mesa.",
      },
    ],
    "expo-notifications",
    "expo-apple-authentication",
    [
      "@stripe/stripe-react-native",
      { merchantIdentifier: "merchant.com.mia.app", enableGooglePay: false },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#DAD3C7",
        image: "./assets/splash-icon.png",
        imageWidth: 180,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    firebase: {
      apiKey: "AIzaSyB5leTBrY_1X-9wKzzZBohqgyuEQQRVlgw",
      projectId: "miaapp-30191",
      appId: "1:318199614263:ios:cc79d5c564bab22cb1a8b2",
      messagingSenderId: "318199614263",
      storageBucket: "miaapp-30191.firebasestorage.app",
      authDomain: "miaapp-30191.firebaseapp.com",
    },
    eas: { projectId: "" },
  },
});
