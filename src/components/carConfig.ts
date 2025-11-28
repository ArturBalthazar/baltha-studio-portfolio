export const colorSettings = {
    yellow: { hex: "#AFBF25", metallic: 0.2, roughness: 0.2, sheen: 1 },
    white: { hex: "#E5DDC9", metallic: 0.2, roughness: 0.2, sheen: 1 },
    black: { hex: "#000000", metallic: 0.7, roughness: 0.2, sheen: 0.2 },
    pink: { hex: "#E8BDE1", metallic: 0.18, roughness: 0.2, sheen: 1 }
};

export const trimConfigs: Record<string, { allowed: string[]; materials: Record<string, string> }> = {
    lightBlue: {
        allowed: ["yellow"],
        materials: {
            byd_leather_02: "byd_leather_black_02",
            byd_leather_03: "byd_leather_black_03",
            byd_leather_04: "byd_leather_perforated_blue",
            byd_leather_05: "byd_leather_light_blue_05",
            byd_leather_06: "byd_leather_light_blue_06",
            byd_metallic_plastic_01: "byd_metal_paint",
            byd_metallic_plastic_02: "byd_metallic_blue",
            byd_metallic_plastic_03: "byd_yellow",
            byd_steering_wheel: "byd_plastic_skin_wheel",
            byd_buttons: "byd_atlas_metallic",
            byd_stitches: "byd_stitches_yellow"
        }
    },
    pink: {
        allowed: ["white", "pink"],
        materials: {
            byd_leather_02: "byd_leather_black_02",
            byd_leather_03: "byd_leather_pink_03",
            byd_leather_04: "byd_leather_black_04",
            byd_leather_05: "byd_leather_pink_05",
            byd_leather_06: "byd_leather_pink_06",
            byd_metallic_plastic_01: "byd_metal_paint",
            byd_metallic_plastic_02: "byd_metallic_pink",
            byd_metallic_plastic_03: "byd_pink",
            byd_steering_wheel: "byd_plastic_skin_wheel",
            byd_buttons: "byd_atlas_metallic",
            byd_stitches: "byd_stitches_pink"
        }
    },
    darkBlue: {
        allowed: ["white", "black"],
        materials: {
            byd_leather_02: "byd_leather_perforated_dark_blue",
            byd_leather_03: "byd_leather_black_03",
            byd_leather_04: "byd_leather_perforated_red",
            byd_leather_05: "byd_leather_dark_blue",
            byd_leather_06: "byd_leather_black_06",
            byd_metallic_plastic_01: "byd_black_piano",
            byd_metallic_plastic_02: "byd_metallic_black",
            byd_metallic_plastic_03: "byd_orange",
            byd_steering_wheel: "byd_leather_dark_blue_wheel",
            byd_buttons: "byd_atlas_dark",
            byd_stitches: "byd_stitches_orange"
        }
    }
};
