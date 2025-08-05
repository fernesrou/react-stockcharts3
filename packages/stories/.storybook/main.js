/** @type {import('@storybook/react-webpack5').StorybookConfig} */
module.exports = {
    addons: ["@storybook/addon-essentials", "@storybook/addon-mdx-gfm", "@storybook/addon-docs"],
    stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)", "../src/**/*.mdx"],
    typescript: {
        check: false,
        reactDocgen: false, // Disabled to prevent React 18 parser errors
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        },
    },
    framework: {
        name: "@storybook/react-webpack5",
        options: {
            strictMode: false, // CRITICAL: Disable to prevent chart flickering in React 18
        },
    },
    webpackFinal: async (config) => {
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
