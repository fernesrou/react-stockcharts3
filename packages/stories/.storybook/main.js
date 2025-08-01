/** @type {import('@storybook/react-webpack5').StorybookConfig} */
module.exports = {
    addons: ["@storybook/addon-essentials", "@storybook/addon-mdx-gfm", "@storybook/addon-docs"],
    stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)", "../src/**/*.mdx"],
    typescript: {
        check: false,
        reactDocgen: "react-docgen-typescript",
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        },
    },
    framework: {
        name: "@storybook/react-webpack5",
        options: {},
    },
    webpackFinal: async (config) => {
        // Remove any existing MDX rule and add our own
        config.module.rules = config.module.rules.filter((rule) => {
            const testStr = rule.test ? rule.test.toString() : "";
            return !testStr.includes("mdx");
        });

        // Add MDX support
        config.module.rules.push({
            test: /\.mdx$/,
            use: [
                {
                    loader: "@mdx-js/loader",
                    options: {
                        providerImportSource: "@storybook/blocks",
                    },
                },
                {
                    loader: "@storybook/builder-webpack5/dist/loaders/export-order-loader.js",
                },
            ],
        });

        // Add TypeScript support
        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            use: [
                {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true,
                    },
                },
            ],
        });

        config.module.rules.push({
            test: /\.(js|map)$/,
            use: "source-map-loader",
            enforce: "pre",
        });

        config.resolve.extensions.push(".ts", ".tsx");

        return config;
    },
};
