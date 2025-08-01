/** @type {import('@storybook/react-webpack5').StorybookConfig} */
module.exports = {
    addons: [
        "@storybook/addon-essentials",
        "@storybook/addon-mdx-gfm"
    ],
    stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
    typescript: {
        check: false,
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        },
    },
    framework: {
        name: "@storybook/react-webpack5",
        options: {}
    },
    webpackFinal: async (config) => {
        // Add TypeScript support
        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    }
                }
            ],
        });

        config.module.rules.push({
            test: /\.(js|map)$/,
            use: "source-map-loader",
            enforce: "pre",
        });

        config.resolve.extensions.push('.ts', '.tsx');

        return config;
    }
};
