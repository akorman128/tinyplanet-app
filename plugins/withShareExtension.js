const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  IOSConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP_ID = "group.com.alexkorman.tinyplanet";
const EXTENSION_NAME = "ShareExtension";
const EXTENSION_BUNDLE_ID_SUFFIX = ".ShareExtension";

/**
 * Expo Config Plugin to add iOS Share Extension
 */
function withShareExtension(config) {
  // Add App Group entitlement to main app
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];
    return config;
  });

  // Add tinyplanet:// URL scheme
  config = withInfoPlist(config, (config) => {
    const urlTypes = config.modResults.CFBundleURLTypes || [];

    // Check if tinyplanet scheme already exists
    const hasTinyPlanetScheme = urlTypes.some((urlType) =>
      urlType.CFBundleURLSchemes?.includes("tinyplanet")
    );

    if (!hasTinyPlanetScheme) {
      urlTypes.push({
        CFBundleURLSchemes: ["tinyplanet"],
        CFBundleURLName: `${config.ios.bundleIdentifier}`,
      });
    }

    config.modResults.CFBundleURLTypes = urlTypes;
    return config;
  });

  // Add Share Extension target to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const bundleIdentifier = config.ios?.bundleIdentifier || "com.alexkorman.tinyplanet";

    // Create Share Extension directory in ios folder
    const extensionDir = path.join(platformProjectRoot, EXTENSION_NAME);
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }

    // Copy extension files from plugins/shareExtension
    const sourceDir = path.join(projectRoot, "plugins", "shareExtension");
    const filesToCopy = [
      "ShareViewController.swift",
      "Info.plist",
      "ShareExtension.entitlements",
    ];

    for (const file of filesToCopy) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(extensionDir, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // Copy native module files to main app target
    const nativeModulesDir = path.join(projectRoot, "plugins", "nativeModules");
    const mainAppDir = path.join(platformProjectRoot, "TinyPlanet");
    const nativeModuleFiles = ["SharedNoteModule.swift", "SharedNoteModule.m"];

    for (const file of nativeModuleFiles) {
      const sourcePath = path.join(nativeModulesDir, file);
      const destPath = path.join(mainAppDir, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // Get the project object
    const project = xcodeProject;

    // Check if target already exists
    const existingTarget = project.pbxTargetByName(EXTENSION_NAME);
    if (existingTarget) {
      return config;
    }

    // Add the Share Extension target
    const extensionBundleId = `${bundleIdentifier}${EXTENSION_BUNDLE_ID_SUFFIX}`;

    // Create PBXGroup for Share Extension files
    const extensionGroup = project.addPbxGroup(
      filesToCopy,
      EXTENSION_NAME,
      EXTENSION_NAME
    );

    // Add group to main project group
    const mainGroup = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(extensionGroup.uuid, mainGroup);

    // Add the Share Extension target
    const target = project.addTarget(
      EXTENSION_NAME,
      "app_extension",
      EXTENSION_NAME,
      extensionBundleId
    );

    // Get the target key
    const targetKey = target.uuid;

    // Add files to build phases
    const buildPhase = project.addBuildPhase(
      ["ShareViewController.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      targetKey
    );

    // Add resources build phase
    project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", targetKey);

    // Add frameworks build phase
    project.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      targetKey
    );

    // Configure build settings for the extension target
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const config = configurations[key];
      if (
        config.buildSettings &&
        config.buildSettings.PRODUCT_NAME === `"${EXTENSION_NAME}"`
      ) {
        // Set common build settings
        config.buildSettings.SWIFT_VERSION = "5.0";
        config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
        config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "15.1";
        config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${EXTENSION_NAME}/ShareExtension.entitlements`;
        config.buildSettings.INFOPLIST_FILE = `${EXTENSION_NAME}/Info.plist`;
        config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = extensionBundleId;
        config.buildSettings.DEVELOPMENT_TEAM = '"$(DEVELOPMENT_TEAM)"';
        config.buildSettings.CODE_SIGN_STYLE = "Automatic";
        config.buildSettings.MARKETING_VERSION = "1.0";
        config.buildSettings.CURRENT_PROJECT_VERSION = "1";
        config.buildSettings.GENERATE_INFOPLIST_FILE = "NO";
        config.buildSettings.SKIP_INSTALL = "YES";
      }
    }

    // Add target dependency so the extension builds with the main app
    const mainTarget = project.getFirstTarget();
    if (mainTarget) {
      project.addTargetDependency(mainTarget.uuid, [targetKey]);
    }

    return config;
  });

  return config;
}

module.exports = withShareExtension;
