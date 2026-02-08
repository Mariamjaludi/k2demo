import type { PerkType } from "./types";

export type ScenarioOfferDef = {
  included_items: string[]; // SKU IDs from catalog
  perks: { type: PerkType; title: string; details: Record<string, unknown> }[];
  ui: { title: string; subtitle: string; badges: string[] };
};

export type ScenarioItem = {
  sku_id: string;
  rank: number;
  offer?: ScenarioOfferDef;
};

export type Scenario = {
  id: string;
  name: string;
  triggers: string[];
  items: ScenarioItem[];
  narrative: string;
};

export const SCENARIOS: Scenario[] = [
  // ── Scenario 1: Children's Art Supplies ──────────────────────────
  {
    id: "childrens_art_supplies",
    name: "Children's Art Supplies",
    triggers: [
      // Core terms
      "marker", "markers", "markerz", "markrs",
      // Coloring variations
      "coloring", "colouring", "colring", "color", "colour", "colors", "colours",
      // Art terms
      "art", "arts", "art supplies", "arts and crafts", "craft", "crafts",
      // Kids context
      "kids art", "kids", "children", "child", "childrens",
      // Product types
      "felt tip", "felt-tip", "felttip", "felt tips",
      "pen set", "pen sets", "pens",
      "crayons", "crayon",
      // Drawing
      "drawing", "draw",
      // Features
      "washable", "washable markers",
    ],
    items: [
      {
        sku_id: "jarir_faber_castell_connector_pen_carry_case_handle",
        rank: 1,
        offer: {
          included_items: ["jarir_arabic_book_babronat_redaa"],
          perks: [
            {
              type: "event_invite",
              title: "Free painting event for kids",
              details: {
                event_name: "Jarir Kids Painting Workshop",
                location: "Jarir Mega Store, Riyadh",
                date: "Next Saturday",
              },
            },
          ],
          ui: {
            title: "Art Starter Bundle",
            subtitle: "Connector Pen Case + free Arabic book + painting event invite",
            badges: ["Best Value", "Event Invite"],
          },
        },
      },
      {
        sku_id: "jarir_carioca_jumbo_felt_tip_marker",
        rank: 2,
      },
      {
        sku_id: "jarir_ooly_make_no_mistake_washable_marker",
        rank: 3,
      },
      {
        sku_id: "jarir_carioca_birello_felt_tip_marker",
        rank: 4,
        offer: {
          included_items: [],
          perks: [
            {
              type: "loyalty",
              title: "Double loyalty points",
              details: { multiplier: 2 },
            },
          ],
          ui: {
            title: "Loyalty Bonus",
            subtitle: "Earn 2× loyalty points on this purchase",
            badges: ["2× Points"],
          },
        },
      },
    ],
    narrative:
      "Lead with premium Faber-Castell carry case bundled with an overstock Arabic children's book (clears aging inventory at zero discount). Painting event invite adds experiential value. Budget option at rank 4 gets loyalty perk to drive repeat purchase.",
  },

  // ── Scenario 2: Back to School Backpacks ─────────────────────────
  {
    id: "back_to_school_backpacks",
    name: "Back to School Backpacks",
    triggers: [
      // Core terms
      "backpack", "backpacks", "backpak", "bakpack", "back pack",
      // School bags
      "school bag", "school bags", "schoolbag", "schoolbags",
      // Generic bags
      "bag", "bags",
      // Synonyms
      "rucksack", "rucksacks", "knapsack", "knapsacks",
      "book bag", "bookbag", "satchel", "satchels",
      // Context
      "back to school", "school", "school supplies",
      // Kids context
      "kids bag", "kids backpack", "childrens backpack",
    ],
    items: [
      {
        sku_id: "jarir_atrium_classic_backpack_with_accessory",
        rank: 1,
        offer: {
          included_items: ["jarir_pencil_case_soft_glitter", "jarir_roco_ruler"],
          perks: [
            {
              type: "pickup",
              title: "Pickup available today before 12pm in Riyadh",
              details: { city: "Riyadh", cutoff_time_local: "12:00" },
            },
            {
              type: "delivery",
              title: "Free delivery tomorrow",
              details: { promise: "Deliver tomorrow in Riyadh" },
            },
          ],
          ui: {
            title: "Back-to-School Starter Kit",
            subtitle: "Backpack + free pencil case + ruler + pickup today or delivery tomorrow",
            badges: ["Best Value", "Free Extras"],
          },
        },
      },
      {
        sku_id: "jarir_roco_water_colors_blended_backpack_with_accessory",
        rank: 2,
        offer: {
          included_items: ["jarir_roco_name_labels"],
          perks: [
            {
              type: "delivery",
              title: "Free delivery tomorrow",
              details: { promise: "Deliver tomorrow in Riyadh" },
            },
          ],
          ui: {
            title: "Creative Pack",
            subtitle: "Water Colors backpack + free name labels + free delivery",
            badges: ["Free Labels"],
          },
        },
      },
      {
        sku_id: "jarir_royal_falcon_basic_classic_backpack_with_accessory",
        rank: 3,
        offer: {
          included_items: [],
          perks: [
            {
              type: "loyalty",
              title: "Double loyalty points",
              details: { multiplier: 2 },
            },
            {
              type: "pickup_optional_paid",
              title: "Same-day pickup available",
              details: { price: 10, currency: "SAR", city: "Riyadh", cutoff_time_local: "12:00" },
            },
          ],
          ui: {
            title: "Budget Pick",
            subtitle: "Classic backpack with 2× loyalty points + optional paid same-day pickup",
            badges: ["2× Points"],
          },
        },
      },
      {
        sku_id: "jarir_roco_unicorn_3in1_purple_value_set_backpack_with_accessory",
        rank: 4,
        offer: {
          included_items: ["jarir_roco_sheet_book_cover"],
          perks: [
            {
              type: "pickup",
              title: "Pickup available today before 12pm in Riyadh",
              details: { city: "Riyadh", cutoff_time_local: "12:00" },
            },
          ],
          ui: {
            title: "Unicorn Set",
            subtitle: "3-in-1 value set + free book cover + pickup today",
            badges: ["Free Pickup"],
          },
        },
      },
    ],
    narrative:
      "Premium Atrium backpack leads with pencil case + ruler bundle (clears overstock accessories). Rank 1 and 4 offer same-day pickup in Riyadh before 12pm. Rank 3 has paid pickup option. Budget unicorn set clears aging book covers.",
  },

  // ── Scenario 3: Office Chairs ────────────────────────────────────
  {
    id: "office_chairs",
    name: "Office Chairs",
    triggers: [
      // Core terms
      "office chair", "office chairs", "officechair",
      "desk chair", "desk chairs", "deskchair",
      "executive chair", "executive chairs",
      // Generic
      "chair", "chairs",
      // Typos
      "office chiar", "desk chiar", "chiar",
      // Synonyms
      "office seat", "desk seat", "work chair", "work chairs",
      "computer chair", "computer chairs",
      "swivel chair", "swivel chairs",
      "ergonomic chair", "ergonomic chairs", "ergonomic",
      // Context
      "home office", "office furniture",
      // Student
      "student chair", "student chairs", "study chair",
    ],
    items: [
      {
        sku_id: "jarir_executive_chair_brown_594617",
        rank: 1,
        offer: {
          included_items: [],
          perks: [
            {
              type: "delivery",
              title: "Faster delivery than other colors",
              details: { promise: "Same-day delivery in Riyadh", speed: "express" },
            },
            {
              type: "assembly",
              title: "Free delivery and assembly",
              details: { provider: "Jarir Home Services" },
            },
          ],
          ui: {
            title: "Premium Office Setup",
            subtitle: "Executive chair (brown) + faster delivery + free assembly",
            badges: ["Faster Delivery", "Free Assembly"],
          },
        },
      },
      {
        sku_id: "jarir_executive_chair_black_594618",
        rank: 2,
        offer: {
          included_items: [],
          perks: [
            {
              type: "delivery",
              title: "Standard next day delivery",
              details: { promise: "Deliver tomorrow in Riyadh", speed: "standard" },
            },
            {
              type: "assembly",
              title: "Free delivery and assembly",
              details: { provider: "Jarir Home Services" },
            },
          ],
          ui: {
            title: "Executive Setup",
            subtitle: "Executive chair (black) + next day delivery + free assembly",
            badges: ["Free Assembly"],
          },
        },
      },
      {
        sku_id: "jarir_royal_falcon_executive_chair_black_634340",
        rank: 3,
        offer: {
          included_items: [],
          perks: [
            {
              type: "delivery",
              title: "Standard next day delivery",
              details: { promise: "Deliver tomorrow in Riyadh", speed: "standard" },
            },
            {
              type: "assembly",
              title: "Free delivery and assembly",
              details: { provider: "Jarir Home Services" },
            },
          ],
          ui: {
            title: "Royal Falcon Setup",
            subtitle: "Premium Royal Falcon chair + next day delivery + free assembly",
            badges: ["Free Assembly"],
          },
        },
      },
      {
        sku_id: "jarir_student_chair_black_634342",
        rank: 4,
        offer: {
          included_items: [],
          perks: [
            {
              type: "delivery",
              title: "Standard delivery",
              details: { promise: "Deliver tomorrow in Riyadh", speed: "standard" },
            },
          ],
          ui: {
            title: "Student Chair",
            subtitle: "Affordable student chair with standard delivery",
            badges: ["Budget Option"],
          },
        },
      },
    ],
    narrative:
      "Rank 1 brown chair gets faster delivery than other colors + free assembly. Ranks 2-3 get standard next day delivery + free assembly. Budget student chair at rank 4 gets standard delivery only.",
  },

  // ── Scenario 4: Gaming Console (PS5) ─────────────────────────────
  {
    id: "gaming_console_ps5",
    name: "Gaming Console (PS5)",
    triggers: [
      // PlayStation variations
      "ps5", "ps 5", "ps-5",
      "playstation", "playstation 5", "playstation5",
      "play station", "play station 5",
      // Typos
      "playstaton", "playsation", "playstaion", "plastation",
      "playstatoin", "playstion",
      // Sony
      "sony console", "sony playstation", "sony ps5",
      // Generic gaming
      "gaming console", "gaming consoles", "game console", "game consoles",
      "console", "consoles",
      // Context
      "gaming", "video game", "video games", "videogame",
      // Pro/Slim variants
      "ps5 pro", "ps5 slim", "playstation pro", "playstation slim",
    ],
    items: [
      {
        sku_id: "jarir_sony_ps5_pro_digital_669128",
        rank: 1,
        offer: {
          included_items: [],
          perks: [
            {
              type: "raffle",
              title: "Esports World Cup ticket raffle entry",
              details: {
                event: "Esports World Cup 2025",
                location: "Riyadh",
                draw_date: "2026-07-01",
              },
            },
          ],
          ui: {
            title: "PS5 Pro — Esports Edition",
            subtitle: "PS5 Pro Digital + entry to Esports World Cup ticket raffle",
            badges: ["Raffle Entry", "Pro"],
          },
        },
      },
      {
        sku_id: "jarir_sony_ps5_slim_digital_664089",
        rank: 2,
        offer: {
          included_items: ["jarir_turtle_beach_victrix_pro_reloaded_664614"],
          perks: [],
          ui: {
            title: "PS5 Slim + Pro Controller",
            subtitle: "PS5 Slim Digital + Victrix Pro Reloaded controller included",
            badges: ["Controller Included"],
          },
        },
      },
      {
        sku_id: "jarir_sony_ps5_slim_dig_1tb_627671",
        rank: 3,
      },
    ],
    narrative:
      "PS5 Pro at ranks 1 and 2 with same raffle perk but different UI emphasis. Rank 3 PS5 Slim bundles premium Victrix controller. Budget 1TB Slim at rank 4 has no offer.",
  },

  // ── Scenario 5: Arabic Novel ─────────────────────────────────────
  {
    id: "arabic_novel",
    name: "Arabic Novel",
    triggers: [
      // Arabic author name
      "أسامة المسلم", "اسامة المسلم", "أسامة", "اسامه",
      // Transliterations
      "osama almuslim", "osama al-muslim", "usama almuslim", "osama muslim",
      // Arabic title
      "الدوائر الخمس", "الدوائر", "دوائر", "الخمس",
      // Arabic book terms
      "رواية", "روايات", "كتاب", "كتب", "كتاب عربي",
      // English terms
      "arabic novel", "arabic novels", "arabic book", "arabic books",
      "novel", "novels",
      // Genre
      "arabic fiction", "fiction", "arabic literature",
      // Typos
      "novle", "novles", "arabic novle",
    ],
    items: [
      {
        sku_id: "jarir_arabic_books_536880_al_dawaer_al_khams",
        rank: 1,
        offer: {
          included_items: [],
          perks: [
            {
              type: "event_invite",
              title: "Author reading event invitation",
              details: {
                event_name: "أسامة المسلم — قراءة وتوقيع",
                author: "أسامة المسلم",
                location: "Jarir Bookstore, Riyadh Park",
                date: "2026-06-15",
              },
            },
          ],
          ui: {
            title: "الدوائر الخمس — نسخة الحدث",
            subtitle: "الرواية + دعوة لحفل قراءة وتوقيع المؤلف",
            badges: ["حدث حصري", "توقيع المؤلف"],
          },
        },
      },
      {
        sku_id: "jarir_arabic_books_536880_al_dawaer_al_khams",
        rank: 2,
        offer: {
          included_items: [],
          perks: [
            {
              type: "event_invite",
              title: "Author reading event invitation",
              details: {
                event_name: "أسامة المسلم — قراءة وتوقيع",
                author: "أسامة المسلم",
                location: "Jarir Bookstore, Riyadh Park",
                date: "2025-06-15",
              },
            },
          ],
          ui: {
            title: "الدوائر الخمس",
            subtitle: "رواية أسامة المسلم + دعوة حفل القراءة",
            badges: ["حدث القراءة"],
          },
        },
      },
      {
        sku_id: "jarir_arabic_books_568335_hatha_ma_hadath_maei",
        rank: 3,
      },
      {
        sku_id: "jarir_arabic_books_566546_jaheem_al_aabireen",
        rank: 4,
      },
    ],
    narrative:
      "Same novel at ranks 1 and 2 with identical author reading event perk, different UI emphasis only. Remaining novels by the same author fill ranks 3-4 without offers.",
  },
];
