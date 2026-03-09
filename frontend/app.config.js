module.exports = {
  expo: {
    name: "EchoLingua Borneo",
    slug: "echolingua-borneo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/appLogo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/appLogo.png",
      resizeMode: "contain",
      backgroundColor: "#F9F7F2",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.echolingua.borneo",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/appLogo.png",
        backgroundColor: "#F9F7F2",
      },
      package: "com.echolingua.borneo",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    },
    web: {
      favicon: "./assets/appLogo.png",
    },
    plugins: ["expo-font", "expo-video", "expo-audio"],
  },
};
