#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Diagnostic script for external projects using React StockCharts 3
 * Run this in your project to identify React version conflicts
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 React StockCharts 3 - External Project Diagnostics\n");

function checkReactVersions() {
    console.log("📋 Checking React versions...");

    try {
        const result = execSync("npm ls react react-dom", { encoding: "utf8" });
        console.log(result);

        // Check for multiple React versions
        if (result.includes("UNMET PEER DEPENDENCY") || result.includes("invalid")) {
            console.log("❌ Found dependency issues!");
            return false;
        } else if (result.split("react@").length > 2) {
            console.log("⚠️  Multiple React versions detected!");
            return false;
        } else {
            console.log("✅ React versions look good");
            return true;
        }
    } catch (error) {
        console.log("❌ Could not check React versions:", error.message);
        return false;
    }
}

function checkPackageJson() {
    console.log("\n📄 Checking package.json configuration...");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        console.log("❌ No package.json found in current directory");
        return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Check React version
    const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
    if (!reactVersion) {
        console.log("❌ React not found in dependencies");
        return false;
    }

    if (!reactVersion.startsWith("^18") && !reactVersion.startsWith("^19")) {
        console.log(`⚠️  React version ${reactVersion} - recommend React 18+`);
    } else {
        console.log(`✅ React version ${reactVersion} is compatible`);
    }

    // Check for overrides/resolutions
    if (packageJson.overrides || packageJson.resolutions) {
        console.log("✅ Found version overrides/resolutions");
    } else {
        console.log("💡 Consider adding overrides for React versions");
    }

    return true;
}

function checkBundlerConfig() {
    console.log("\n⚙️  Checking bundler configuration...");

    const configs = [
        { name: "Webpack", files: ["webpack.config.js", "webpack.config.ts"] },
        { name: "Vite", files: ["vite.config.js", "vite.config.ts"] },
        { name: "Next.js", files: ["next.config.js", "next.config.ts"] },
        { name: "CRACO", files: ["craco.config.js"] },
    ];

    let foundConfig = false;

    configs.forEach(({ name, files }) => {
        const configFile = files.find((file) => fs.existsSync(path.join(process.cwd(), file)));
        if (configFile) {
            console.log(`📁 Found ${name} config: ${configFile}`);
            const content = fs.readFileSync(path.join(process.cwd(), configFile), "utf8");

            if (content.includes("react") && content.includes("alias")) {
                console.log(`✅ ${name} has React alias configuration`);
            } else {
                console.log(`💡 ${name} config found but no React alias detected`);
                console.log(`   Consider adding React alias to resolve version conflicts`);
            }
            foundConfig = true;
        }
    });

    if (!foundConfig) {
        console.log("💡 No bundler configuration found");
        console.log("   If experiencing React version conflicts, add bundler configuration");
    }

    return foundConfig;
}

function checkNodeModules() {
    console.log("\n📂 Checking node_modules structure...");

    const nodeModulesPath = path.join(process.cwd(), "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
        console.log("❌ node_modules not found - run npm install");
        return false;
    }

    // Check for nested React installations
    try {
        const result = execSync('find node_modules -name "react" -type d', { encoding: "utf8" });
        const reactPaths = result.trim().split("\n").filter(Boolean);

        if (reactPaths.length > 1) {
            console.log("⚠️  Multiple React installations found:");
            reactPaths.forEach((path) => console.log(`   ${path}`));
            console.log("   Consider running: npm dedupe");
        } else {
            console.log("✅ Single React installation found");
        }
    } catch (error) {
        console.log("ℹ️  Could not scan for nested React installations");
    }

    return true;
}

function provideSolutions() {
    console.log("\n🔧 Quick Solutions:\n");

    console.log("1. Force single React version in package.json:");
    console.log("   {");
    console.log('     "overrides": {');
    console.log('       "react": "^18.3.0",');
    console.log('       "react-dom": "^18.3.0"');
    console.log("     }");
    console.log("   }\n");

    console.log("2. Clean install:");
    console.log("   rm -rf node_modules package-lock.json");
    console.log("   npm install\n");

    console.log("3. Add webpack alias (if using webpack):");
    console.log("   resolve: {");
    console.log("     alias: {");
    console.log('       react: path.resolve("./node_modules/react"),');
    console.log('       "react-dom": path.resolve("./node_modules/react-dom")');
    console.log("     }");
    console.log("   }\n");

    console.log("4. For detailed instructions see:");
    console.log("   EXTERNAL_INSTALLATION.md\n");
}

// Run diagnostics
function main() {
    const checks = [checkPackageJson(), checkReactVersions(), checkBundlerConfig(), checkNodeModules()];

    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;

    console.log(`\n📊 Diagnostic Summary: ${passedChecks}/${totalChecks} checks passed\n`);

    if (passedChecks === totalChecks) {
        console.log("🎉 Configuration looks good!");
        console.log("   If still experiencing issues, check the browser console for specific errors.\n");
    } else {
        console.log("⚠️  Some issues detected. See solutions below:\n");
        provideSolutions();
    }
}

main();
