export const colorSettings = {
    green: { hex: "#455342", metallic: 0.3, roughness: 0.2, sheen: 1 },
    white: { hex: "#838383", metallic: 0.2, roughness: 0.2, sheen: 1 },
    gray: { hex: "#19191a", metallic: 0.8, roughness: 0.2, sheen: 0.2 },
    silver: { hex: "#61616e", metallic: .8, roughness: 0.2, sheen: 1 }
};

export const trimConfigs: Record<string, { allowed: string[]; materials: Record<string, string> }> = {
    lightBlue: {
        allowed: ["green"],
        materials: {
            geely_leather_02: "geely_leather_black_02",
            geely_leather_03: "geely_leather_black_03",
            geely_leather_04: "geely_leather_perforated_blue",
            geely_leather_05: "geely_leather_light_blue_05",
            geely_leather_06: "geely_leather_light_blue_06",
            geely_metallic_plastic_01: "geely_metal_paint",
            geely_metallic_plastic_02: "geely_metallic_blue",
            geely_metallic_plastic_03: "geely_green",
            geely_steering_wheel: "geely_plastic_skin_wheel",
            geely_buttons: "geely_atlas_metallic",
            geely_stitches: "geely_stitches_green"
        }
    },
    pink: {
        allowed: ["white", "pink"],
        materials: {
            geely_leather_02: "geely_leather_black_02",
            geely_leather_03: "geely_leather_pink_03",
            geely_leather_04: "geely_leather_black_04",
            geely_leather_05: "geely_leather_pink_05",
            geely_leather_06: "geely_leather_pink_06",
            geely_metallic_plastic_01: "geely_metal_paint",
            geely_metallic_plastic_02: "geely_metallic_pink",
            geely_metallic_plastic_03: "geely_pink",
            geely_steering_wheel: "geely_plastic_skin_wheel",
            geely_buttons: "geely_atlas_metallic",
            geely_stitches: "geely_stitches_pink"
        }
    },
    darkBlue: {
        allowed: ["white", "black"],
        materials: {
            geely_leather_02: "geely_leather_perforated_dark_blue",
            geely_leather_03: "geely_leather_black_03",
            geely_leather_04: "geely_leather_perforated_red",
            geely_leather_05: "geely_leather_dark_blue",
            geely_leather_06: "geely_leather_black_06",
            geely_metallic_plastic_01: "geely_black_piano",
            geely_metallic_plastic_02: "geely_metallic_black",
            geely_metallic_plastic_03: "geely_orange",
            geely_steering_wheel: "geely_leather_dark_blue_wheel",
            geely_buttons: "geely_atlas_dark",
            geely_stitches: "geely_stitches_orange"
        }
    }
};
