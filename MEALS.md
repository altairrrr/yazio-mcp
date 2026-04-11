# Repas types préenregistrés

Basés sur la journée type du 8 avril 2026.

## `petit_dej` — Petit-déjeuner

| Aliment | Quantité | Variantes |
|---------|----------|-----------|
| Oeuf au plat | 180g (3 unités) | |
| **Yaourt** | 200g | `skyr` = SKYR brebis (défaut), `grec` = Yaourt à la Grecque |
| Banane | 130g | |
| Myrtilles | 80g | |
| Noix du Brésil, séchée | 8g | |

## `dejeuner` — Déjeuner

| Aliment | Quantité |
|---------|----------|
| Filets de poulet | 200g |
| Légumes pour ratatouille surgelé | 300g |
| Riz basmati | 200g |
| Huile d'olive | 13.5g (1 cuillère à soupe) |

## `diner` — Dîner

| Aliment | Quantité | Variantes |
|---------|----------|-----------|
| **Protéine** | variable | `sardines` = Sardine à l'huile d'olive 135g (défaut), `saumon` = Pavé de saumon 125g |
| Patate douce, crue | 600g | |
| Haricots verts, cuits | 220g | |
| Kiwi, vert | 100g | |

## `snack` — Snack

| Aliment | Quantité | Variantes |
|---------|----------|-----------|
| Chocolat noir 85% | 10g (1 carré) | |
| Amandes | 20g | |
| Banane | 120g | |
| **Galettes de riz** | 50g | `standard` = Galettes de riz complet (défaut), `bjorg` = Bjorg Bio, `carrefour` = Carrefour Bio |

## Utilisation des variantes

Par défaut, le repas est loggé avec les produits par défaut. Pour changer une variante :

- "Ajoute mon dîner habituel avec du saumon" → `{"proteine": "saumon"}`
- "Ajoute mon petit-déj avec du yaourt grec" → `{"yaourt": "grec"}`
- "Ajoute mon snack avec les galettes bjorg" → `{"galettes": "bjorg"}`
