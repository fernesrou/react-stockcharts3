#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Build script to ensure React is treated as external dependency
 * This script ensures all packages properly exclude React from their builds
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Building React StockCharts 3 with external React...\n");

// Verify all packages have correct peerDependencies
const packagesDir = path.join(__dirname, "../packages");
const packages = fs.readdirSync(packagesDir);

console.log("📋 Verifying package configurations...");

packages.forEach((packageName) => {
    const packagePath = path.join(packagesDir, packageName);
    const packageJsonPath = path.join(packagePath, "package.json");

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

        // Skip stories package (private)
        if (packageJson.private) {
            console.log(`  ⏭️  Skipping ${packageName} (private package)`);
            return;
        }

        // Check peerDependencies
        if (
            !packageJson.peerDependencies ||
            !packageJson.peerDependencies.react ||
            !packageJson.peerDependencies["react-dom"]
        ) {
            console.warn(`  ⚠️  ${packageName} missing React peerDependencies`);
        } else {
            console.log(`  ✅ ${packageName} has correct peerDependencies`);
        }

        // Check if React is in dependencies (should not be)
        if (packageJson.dependencies && (packageJson.dependencies.react || packageJson.dependencies["react-dom"])) {
            console.warn(`  ❌ ${packageName} has React in dependencies (should be peerDependencies only)`);
        }
    }
});

console.log("\n🏗️  Building packages...");

try {
    // Clean all packages first
    execSync("npm run clean:packages", { stdio: "inherit" });

    // Build all packages
    execSync("npm run build", { stdio: "inherit" });

    console.log("\n✅ Build completed successfully!");
    console.log("\n📝 External dependency configuration:");
    console.log("   - React and React-DOM are treated as peer dependencies");
    console.log("   - Packages will not bundle React");
    console.log("   - Consumer projects must provide React 18+ themselves");
} catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
}
