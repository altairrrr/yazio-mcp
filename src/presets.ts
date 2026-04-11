export interface PresetItem {
  /** Slot name used for variant overrides (e.g. "proteine", "yaourt", "galettes") */
  slot?: string;
  product_id: string;
  name: string;
  amount: number;
  daytime: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface Variant {
  product_id: string;
  name: string;
  amount: number;
}

export interface Preset {
  label: string;
  description: string;
  items: PresetItem[];
  /** Available variants keyed by slot name */
  variants?: Record<string, Record<string, Variant>>;
}

export const presets: Record<string, Preset> = {
  petit_dej: {
    label: "Petit-déjeuner type",
    description:
      "Oeufs au plat, skyr brebis, banane, myrtilles, noix du Brésil",
    items: [
      { product_id: "a1ee4a4a-becf-11e6-8a21-e0071b8a8723", name: "Myrtilles", amount: 80, daytime: "breakfast" },
      { product_id: "aed35269-286f-42c2-abfd-214e477a55d3", name: "Oeuf au plat", amount: 180, daytime: "breakfast" },
      { product_id: "9d7797e6-becf-11e6-8401-e0071b8a8723", name: "Banane", amount: 130, daytime: "breakfast" },
      { product_id: "9d7a0cc4-becf-11e6-97f8-e0071b8a8723", name: "Noix du Brésil, séchée", amount: 8, daytime: "breakfast" },
      { slot: "yaourt", product_id: "09ce5606-b16c-4af8-a0ef-37d0e2aa734a", name: "SKYR au lait de brebis", amount: 200, daytime: "breakfast" },
    ],
    variants: {
      yaourt: {
        skyr: { product_id: "09ce5606-b16c-4af8-a0ef-37d0e2aa734a", name: "SKYR au lait de brebis", amount: 200 },
        grec: { product_id: "e44a12f8-1ba4-4d4b-8b42-b1c55e850525", name: "Yaourt à la Grecque nature", amount: 200 },
      },
    },
  },
  dejeuner: {
    label: "Déjeuner type",
    description:
      "Filets de poulet, légumes ratatouille, riz basmati, huile d'olive",
    items: [
      { product_id: "9d7ca984-becf-11e6-8880-e0071b8a8723", name: "Filets de poulet", amount: 200, daytime: "lunch" },
      { product_id: "92bc5db4-72b6-4d74-8cac-203358c4f01b", name: "Légumes pour ratatouille surgelé", amount: 300, daytime: "lunch" },
      { product_id: "a945243a-becf-11e6-9fdb-e0071b8a8723", name: "Riz basmati", amount: 200, daytime: "lunch" },
      { product_id: "9d8c3520-becf-11e6-a896-e0071b8a8723", name: "Huile d'olive", amount: 13.5, daytime: "lunch" },
    ],
  },
  diner: {
    label: "Dîner type",
    description:
      "Sardines à l'huile d'olive, patate douce, haricots verts, kiwi",
    items: [
      { slot: "proteine", product_id: "b4073b81-ba7b-453c-bc98-5e65671118ff", name: "Sardine à l'huile d'olive", amount: 135, daytime: "dinner" },
      { product_id: "9d9ac824-becf-11e6-8b9e-e0071b8a8723", name: "Patate douce, crue", amount: 600, daytime: "dinner" },
      { product_id: "9d836a8a-becf-11e6-a842-e0071b8a8723", name: "Haricots verts, cuits", amount: 220, daytime: "dinner" },
      { product_id: "9d87a23a-becf-11e6-859d-e0071b8a8723", name: "Kiwi, vert", amount: 100, daytime: "dinner" },
    ],
    variants: {
      proteine: {
        sardines: { product_id: "b4073b81-ba7b-453c-bc98-5e65671118ff", name: "Sardine à l'huile d'olive", amount: 135 },
        saumon: { product_id: "834b4322-6875-4260-b3e0-d465208b9385", name: "Pavé de saumon", amount: 125 },
      },
    },
  },
  snack: {
    label: "Snack type",
    description: "Chocolat noir 85%, amandes, banane, galettes de riz",
    items: [
      { product_id: "55648da5-f83a-4254-8918-678d30ee484f", name: "Chocolat noir 85%", amount: 10, daytime: "snack" },
      { product_id: "a3b23ab2-becf-11e6-928b-e0071b8a8723", name: "Amandes", amount: 20, daytime: "snack" },
      { product_id: "9d7797e6-becf-11e6-8401-e0071b8a8723", name: "Banane", amount: 120, daytime: "snack" },
      { slot: "galettes", product_id: "fd8def4c-4e8d-406d-b694-2bca16846e5f", name: "Galettes de riz complet", amount: 50, daytime: "snack" },
    ],
    variants: {
      galettes: {
        standard: { product_id: "fd8def4c-4e8d-406d-b694-2bca16846e5f", name: "Galettes de riz complet", amount: 50 },
        bjorg: { product_id: "aa6cf4b4-becf-11e6-8872-e0071b8a8723", name: "Galette De Riz Complet Bio (Bjorg)", amount: 50 },
        carrefour: { product_id: "a35dad1d-f32f-4f89-b49c-fdb7a4feadb4", name: "Galettes de riz (Carrefour Bio)", amount: 50 },
      },
    },
  },
};
