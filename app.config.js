import 'dotenv/config';

export default {
  expo: {
    name: "GuiaIFFar_New",
    slug: "GuiaIFFar_New",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lilxps.guiaiffarnew",
      infoPlist: {
      NSCalendarsUsageDescription: "Este aplicativo precisa acessar seu calendário para adicionar eventos."
  }
    },
    android: {
      package: "com.lilxps.guiaiffarnew", // Android ID único
      versionCode: 1, // 🔁 aumente este valor a cada nova build na loja
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "resize"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    owner: "lilxps",
    updates: {
      url: "https://u.expo.dev/58024e38-f6c0-4cdb-90da-d4cc77283443"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      eas: {
        projectId: "58024e38-f6c0-4cdb-90da-d4cc77283443"
      }
    }
  }
};
