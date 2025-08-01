import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming";

addons.setConfig({
    theme: create({
        base: "light",
        brandTitle: "React Financial Charts",
        brandUrl: "https://github.com/reactivemarkets/react-financial-charts",
    }),
});
