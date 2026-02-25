export default {
  expo: {
    name: "Tiny Planet",
    slug: "tinyplanet",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "tinyplanet",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    platforms: ["ios", "android"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.alexkorman.tinyplanet",
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.alexkorman.tinyplanet",
        ],
      },
      infoPlist: {
        NSContactsUsageDescription:
          "We need access to your contacts so you can easily invite friends to Tiny Planet.",
        NSLocationWhenInUseUsageDescription:
          "We need your location to show you on the map with your friends.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "We need your location to show you on the map with your friends.",
        LSApplicationQueriesSchemes: ["instagram", "twitter", "comgooglemaps"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.alexkorman.tinyplanet",
      permissions: [
        "READ_CONTACTS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_MEDIA_IMAGES",
      ],
    },
    plugins: [
      "./plugins/withShareExtension",
      "expo-router",
      "expo-contacts",
      "expo-location",
      [
        "@rnmapbox/maps",
        {
          RNMAPBOX_MAPS_DOWNLOAD_TOKEN:
            process.env.EXPO_PUBLIC_RN_MAPBOX_MAPS_DOWNLOAD_TOKEN,
          RNMapboxMapsImpl: "mapbox",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 250,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "093eb18f-5646-4ee0-99ed-f5b6f00d27dd",
      },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    web: {
      bundler: "metro",
    },
  },
};
