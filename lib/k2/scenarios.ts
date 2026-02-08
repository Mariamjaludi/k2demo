import type { InternalPerk, OfferUI } from "./types";

export type ScenarioOfferDef = {
  rank: number;
  included_items: string[];
  perks: InternalPerk[];
  ui: OfferUI;

  /**
   * When true, included_items are only added to the offer when shopper
   * identity is present (Version 3). Without identity, the engine:
   * - treats included_items as empty
   * - swaps ui with identity_absent_ui (if provided)
   */
  identity_gated?: boolean;

  /** UI to use when identity_gated is true but no identity is present. */
  identity_absent_ui?: OfferUI;

  /** Internal only. This must never be returned in the API response. */
  internal: {
    reasoning: string;
    confidence: number;
    confidence_explanation: string;
    kpi_numbers: Record<string, number>;
    data_sources: Array<{ name: string; freshness_minutes: number }>;
  };
};

export type ScenarioItem = {
  sku_id: string;
  rank: number;
  ranked_offers?: ScenarioOfferDef[];
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
        ranked_offers: [
          {
            rank: 1,
            included_items: ["jarir_arabic_book_babronat_redaa"],
            perks: [
              {
                type: "event_invite",
                title: "Free painting event for kids",
                details: {
                  event_name: "Jarir Kids Painting Workshop",
                  location: "Jarir Mega Store, Riyadh",
                  date: "2026-02-14",
                },
              },
            ],
            ui: {
              title: "Art Starter Bundle",
              subtitle: "Connector Pen Case + free Arabic book + painting event invite",
              badges: ["Best Value", "Event Invite"],
            },
            internal: {
              reasoning:
                "Arabic children's book 'Babronat Redaa' is aging inventory (lifecycle: aging, velocity: slow). Bundling at zero discount clears stock while adding perceived value. Painting workshop drives foot traffic to Riyadh mega store — historically 34% of workshop attendees make an additional purchase.",
              confidence: 0.91,
              confidence_explanation:
                "High confidence: book inventory data is fresh, workshop conversion rates based on 6 months of Jarir event data.",
              kpi_numbers: {
                book_retail_value_sar: 29,
                book_unit_cost_sar: 8,
                margin_preserved_bps: 2400,
                workshop_conversion_rate: 0.34,
                expected_incremental_revenue_sar: 45,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_event_analytics", freshness_minutes: 1440 },
              ],
            },
          },
        ],
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
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Budget item with healthy margin (2100 bps). Double loyalty points costs ~SAR 1.2 in liability but drives 22% higher repeat purchase rate within 30 days based on Jarir loyalty cohort analysis.",
              confidence: 0.78,
              confidence_explanation:
                "Moderate-high confidence: loyalty program data is reliable but repeat purchase attribution has 30-day lag.",
              kpi_numbers: {
                loyalty_cost_sar: 1.2,
                margin_bps: 2100,
                repeat_purchase_rate_uplift: 0.22,
                expected_ltv_increase_sar: 18,
              },
              data_sources: [
                { name: "jarir_loyalty_program", freshness_minutes: 60 },
                { name: "jarir_cohort_analytics", freshness_minutes: 4320 },
              ],
            },
          },
        ],
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
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Pencil case (overstock, 450 units) and ruler (overstock, 380 units) are low-cost accessories with near-zero marginal fulfillment cost when co-packed. Bundling clears overstock without discounting the backpack. Same-day pickup leverages Riyadh warehouse proximity.",
              confidence: 0.93,
              confidence_explanation:
                "High confidence: inventory levels verified, co-packing cost model validated with warehouse ops team.",
              kpi_numbers: {
                pencil_case_unit_cost_sar: 4,
                ruler_unit_cost_sar: 2,
                bundle_cost_sar: 6,
                backpack_margin_bps: 3200,
                effective_margin_bps: 2850,
                overstock_units_cleared: 2,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_warehouse_ops", freshness_minutes: 120 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_roco_water_colors_blended_backpack_with_accessory",
        rank: 2,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Name labels are high-margin (4200 bps) but slow-moving accessory. Including them adds practical value for back-to-school shoppers while clearing slow inventory. Free delivery absorbs SAR 12 fulfillment cost within existing margin.",
              confidence: 0.85,
              confidence_explanation:
                "Good confidence: name label inventory is reliable, delivery cost model is stable for Riyadh zone.",
              kpi_numbers: {
                name_labels_unit_cost_sar: 3,
                name_labels_retail_value_sar: 15,
                delivery_cost_sar: 12,
                backpack_margin_bps: 2800,
                effective_margin_bps: 2200,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_delivery_rates", freshness_minutes: 60 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_royal_falcon_basic_classic_backpack_with_accessory",
        rank: 3,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Budget-tier backpack with healthy margin (2600 bps). Double loyalty incentivizes repeat purchase. Paid pickup (SAR 10) generates incremental revenue while offering convenience. No inventory to clear at this tier.",
              confidence: 0.8,
              confidence_explanation:
                "Moderate-high confidence: loyalty uplift estimate from historical cohorts, pickup demand based on Riyadh store traffic patterns.",
              kpi_numbers: {
                loyalty_cost_sar: 1.8,
                pickup_revenue_sar: 10,
                margin_bps: 2600,
                repeat_purchase_uplift: 0.19,
              },
              data_sources: [
                { name: "jarir_loyalty_program", freshness_minutes: 60 },
                { name: "jarir_store_traffic", freshness_minutes: 720 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_roco_unicorn_3in1_purple_value_set_backpack_with_accessory",
        rank: 4,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Book covers are aging inventory (lifecycle: aging, 220 units). Bundling with the popular unicorn set moves aging stock. Same-day pickup available due to Riyadh warehouse stock confirmation.",
              confidence: 0.82,
              confidence_explanation:
                "Good confidence: book cover inventory confirmed, unicorn set is a consistent seller in back-to-school period.",
              kpi_numbers: {
                book_cover_unit_cost_sar: 2,
                book_cover_retail_value_sar: 8,
                margin_bps: 2400,
                aging_units_cleared: 1,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_warehouse_ops", freshness_minutes: 120 },
              ],
            },
          },
        ],
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
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Brown variant has 18 units in Riyadh warehouse vs 4 for black. Higher stock enables same-day delivery promise. Free assembly (SAR 35 cost) absorbed by healthy margin (3400 bps). Steering toward brown clears overstock color variant without discounting.",
              confidence: 0.89,
              confidence_explanation:
                "High confidence: warehouse stock levels verified in real-time, assembly cost is fixed-rate contract with Jarir Home Services.",
              kpi_numbers: {
                brown_stock_riyadh: 18,
                black_stock_riyadh: 4,
                assembly_cost_sar: 35,
                margin_bps: 3400,
                effective_margin_bps: 2900,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_home_services_rates", freshness_minutes: 10080 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_executive_chair_black_594618",
        rank: 2,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Black variant is lower stock (4 units Riyadh). Standard next-day delivery is the safe promise. Free assembly included to match rank 1 value proposition but without express delivery premium.",
              confidence: 0.87,
              confidence_explanation:
                "High confidence: delivery SLA for standard next-day is well-established for Riyadh zone.",
              kpi_numbers: {
                black_stock_riyadh: 4,
                assembly_cost_sar: 35,
                margin_bps: 3400,
                effective_margin_bps: 2900,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_home_services_rates", freshness_minutes: 10080 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_royal_falcon_executive_chair_black_634340",
        rank: 3,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Royal Falcon is a premium alternative. Assembly included to maintain consistent value proposition across executive tier. Standard delivery due to moderate stock levels.",
              confidence: 0.84,
              confidence_explanation:
                "Good confidence: consistent delivery and assembly model, moderate stock certainty.",
              kpi_numbers: {
                stock_riyadh: 7,
                assembly_cost_sar: 35,
                margin_bps: 3100,
                effective_margin_bps: 2600,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_home_services_rates", freshness_minutes: 10080 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_student_chair_black_634342",
        rank: 4,
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Budget tier — no assembly included to preserve thin margin (1800 bps). Standard delivery only. Serves price-sensitive segment without eroding executive tier positioning.",
              confidence: 0.9,
              confidence_explanation:
                "High confidence: simple offer with no bundled costs, delivery SLA is reliable.",
              kpi_numbers: {
                stock_riyadh: 25,
                margin_bps: 1800,
                effective_margin_bps: 1800,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
              ],
            },
          },
        ],
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
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Esports World Cup raffle costs SAR 0 per entry (Jarir is event sponsor, tickets are allocated). Creates urgency and exclusivity. PS5 Pro margin (1200 bps) is thin — raffle adds perceived value without margin erosion.",
              confidence: 0.88,
              confidence_explanation:
                "High confidence: raffle allocation confirmed by Jarir marketing, zero incremental cost validated.",
              kpi_numbers: {
                raffle_cost_per_entry_sar: 0,
                margin_bps: 1200,
                effective_margin_bps: 1200,
                estimated_conversion_uplift: 0.15,
              },
              data_sources: [
                { name: "jarir_marketing_promotions", freshness_minutes: 1440 },
                { name: "jarir_inventory_api", freshness_minutes: 15 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_sony_ps5_slim_digital_664089",
        rank: 2,
        ranked_offers: [
          {
            rank: 1,
            included_items: ["jarir_turtle_beach_victrix_pro_reloaded_664614"],
            perks: [],
            ui: {
              title: "PS5 Slim + Pro Controller",
              subtitle: "PS5 Slim Digital + Victrix Pro Reloaded controller included",
              badges: ["Controller Included"],
            },
            internal: {
              reasoning:
                "Victrix Pro controller is slow-moving accessory (velocity: slow, 32 units). Bundling with popular PS5 Slim clears controller inventory. Controller unit cost SAR 180 absorbed by combined margin. Creates a compelling alternative to PS5 Pro.",
              confidence: 0.83,
              confidence_explanation:
                "Good confidence: controller inventory confirmed, but attachment rate for premium controllers is estimated from category data.",
              kpi_numbers: {
                controller_unit_cost_sar: 180,
                controller_retail_value_sar: 499,
                ps5_margin_bps: 1100,
                combined_margin_bps: 900,
                controller_stock: 32,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 15 },
                { name: "jarir_gaming_category_analytics", freshness_minutes: 4320 },
              ],
            },
          },
        ],
      },
      {
        sku_id: "jarir_sony_ps5_slim_dig_1tb_627671",
        rank: 3,
      },
    ],
    narrative:
      "PS5 Pro leads with zero-cost esports raffle perk. Rank 2 PS5 Slim bundles slow-moving premium controller. Budget 1TB Slim at rank 3 has no offer.",
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
        ranked_offers: [
          {
            rank: 1,
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
            internal: {
              reasoning:
                "Author signing events drive 4× footfall to hosting store. Event invite is zero marginal cost (venue already booked). Rank 1 positioning with exclusive badge creates urgency. Novel is a current bestseller — no discount needed.",
              confidence: 0.92,
              confidence_explanation:
                "High confidence: event confirmed by Jarir events team, author availability locked in, footfall multiplier based on previous أسامة المسلم events.",
              kpi_numbers: {
                event_cost_per_invite_sar: 0,
                footfall_multiplier: 4,
                margin_bps: 4200,
                avg_additional_spend_per_attendee_sar: 85,
              },
              data_sources: [
                { name: "jarir_events_calendar", freshness_minutes: 1440 },
                { name: "jarir_author_events_analytics", freshness_minutes: 10080 },
              ],
            },
          },
          {
            rank: 2,
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
              title: "الدوائر الخمس",
              subtitle: "رواية أسامة المسلم + دعوة حفل القراءة",
              badges: ["حدث القراءة"],
            },
            internal: {
              reasoning:
                "Same event perk but with softer UI framing — no 'exclusive' badge. Serves as a fallback if rank 1 framing feels too aggressive to the shopping agent. Identical economics.",
              confidence: 0.92,
              confidence_explanation:
                "Same data as rank 1 offer — identical underlying economics and event availability.",
              kpi_numbers: {
                event_cost_per_invite_sar: 0,
                footfall_multiplier: 4,
                margin_bps: 4200,
                avg_additional_spend_per_attendee_sar: 85,
              },
              data_sources: [
                { name: "jarir_events_calendar", freshness_minutes: 1440 },
                { name: "jarir_author_events_analytics", freshness_minutes: 10080 },
              ],
            },
          },
        ],
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
      "Same novel at rank 1 with two offer variants: rank 1 offer has exclusive event framing, rank 2 offer is a softer fallback. Remaining novels by the same author fill ranks 3-4 without offers.",
  },

  // ── Scenario 6: iPhone 17 Pro (Competitive Substitution) ─────────
  {
    id: "iphone_17_pro_competitive",
    name: "iPhone 17 Pro (Competitive Substitution)",
    triggers: [
      // iPhone variations
      "iphone", "iphone 17", "iphone 17 pro", "iphone17", "iphone17pro",
      "17 pro", "iphone pro", "iphone pro 256", "iphone 256",
      "iphone 256 silver", "iphone silver",
      // Apple
      "apple iphone", "apple iphone 17", "apple phone",
      // Typos
      "iphon", "iphne", "iphome", "iphoone",
      // Generic
      "smartphone", "apple smartphone",
    ],
    items: [
      {
        sku_id: "jarir_apple_iphone_17_pro_256_blue_esim",
        rank: 1,
        ranked_offers: [
          {
            rank: 1,
            included_items: ["jarir_pan_books_590401_next_installment"],
            identity_gated: true,
            perks: [
              {
                type: "pickup",
                title: "Pickup in 1 hour in Riyadh (free)",
                details: { city: "Riyadh", wait_minutes: 60, price_sar: 0 },
              },
              {
                type: "delivery",
                title: "Same-day delivery in Riyadh for 29 SAR",
                details: { city: "Riyadh", promise: "Same-day", price_sar: 29 },
              },
            ],
            ui: {
              title: "iPhone 17 Pro 256GB Blue — Personalized",
              subtitle: "iPhone 17 Pro Blue + free book gift (next in your series) + pickup in 1 hour",
              badges: ["Personalized", "Free Gift"],
            },
            identity_absent_ui: {
              title: "iPhone 17 Pro 256GB Blue",
              subtitle: "iPhone 17 Pro Blue + pickup in 1 hour or same-day delivery",
              badges: ["In Stock", "Fast Pickup"],
            },
            internal: {
              reasoning:
                "Shopper requested Silver 256GB which is out of stock (0 units). Blue 256GB is the closest in-stock variant (18 units) at the same price point. Identity detected: shopper has purchase history with Pan Books series Part 1. Including Part 2 as gift costs SAR 28 (unit cost) but drives loyalty — book series readers have 67% probability of returning for Part 3. iPhone margin (900 bps) is thin; book gift is funded from book margin (4200 bps).",
              confidence: 0.94,
              confidence_explanation:
                "High confidence: stock levels real-time verified, purchase history match confirmed, book series continuation rate from Jarir reading analytics.",
              kpi_numbers: {
                silver_stock: 0,
                blue_stock: 18,
                book_gift_unit_cost_sar: 28,
                book_gift_retail_value_sar: 59,
                iphone_margin_bps: 900,
                book_margin_bps: 4200,
                series_return_probability: 0.67,
                expected_ltv_increase_sar: 120,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 5 },
                { name: "jarir_shopper_profile", freshness_minutes: 0 },
                { name: "jarir_reading_analytics", freshness_minutes: 1440 },
              ],
            },
          },
          {
            rank: 2,
            included_items: [],
            perks: [
              {
                type: "variant_option",
                title: "Silver available in iPhone 17 Pro 1TB (SAR 6,799)",
                details: {
                  sku_id: "jarir_apple_iphone_17_pro_1tb_silver_esim",
                  model: "iPhone 17 Pro",
                  storage_gb: 1024,
                  color: "silver",
                  price_sar: 6799,
                  stock_level: 6,
                },
              },
            ],
            ui: {
              title: "Want Silver? Upgrade to 1TB",
              subtitle: "iPhone 17 Pro 1TB Silver is in stock — same model, more storage",
              badges: ["Silver Available"],
            },
            internal: {
              reasoning:
                "Shopper specifically requested silver. 1TB Silver variant is in stock (6 units) at SAR 6,799. This is a SAR 1,600 upsell. Higher storage has better margin (1000 bps vs 900 bps). Presenting this as a variant option rather than a separate item keeps the response focused.",
              confidence: 0.86,
              confidence_explanation:
                "Good confidence: stock confirmed, but conversion rate for color-driven upsells to higher storage is estimated from category data.",
              kpi_numbers: {
                price_delta_sar: 1600,
                stock_1tb_silver: 6,
                margin_bps_1tb: 1000,
                estimated_upsell_conversion: 0.12,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 5 },
                { name: "jarir_smartphone_analytics", freshness_minutes: 4320 },
              ],
            },
          },
          {
            rank: 3,
            included_items: [],
            perks: [
              {
                type: "variant_option",
                title: "Silver available in iPhone 17 Pro Max 256GB (SAR 5,699)",
                details: {
                  sku_id: "jarir_apple_iphone_17_pro_max_256_silver_esim",
                  model: "iPhone 17 Pro Max",
                  storage_gb: 256,
                  color: "silver",
                  price_sar: 5699,
                  stock_level: 9,
                },
              },
            ],
            ui: {
              title: "Want Silver? Go Pro Max",
              subtitle: "iPhone 17 Pro Max 256GB Silver is in stock — bigger screen, same storage",
              badges: ["Silver Available", "Pro Max"],
            },
            internal: {
              reasoning:
                "Pro Max 256GB Silver is in stock (9 units) at SAR 5,699 — SAR 500 premium over Pro. Model upgrade path for shoppers who prioritize color over exact model. Pro Max margin (950 bps) slightly better than Pro (900 bps).",
              confidence: 0.82,
              confidence_explanation:
                "Moderate-high confidence: stock confirmed, model upgrade conversion estimated from cross-sell data.",
              kpi_numbers: {
                price_delta_sar: 500,
                stock_pro_max_silver: 9,
                margin_bps_pro_max: 950,
                estimated_upgrade_conversion: 0.08,
              },
              data_sources: [
                { name: "jarir_inventory_api", freshness_minutes: 5 },
                { name: "jarir_smartphone_analytics", freshness_minutes: 4320 },
              ],
            },
          },
          {
            rank: 4,
            included_items: [],
            perks: [
              {
                type: "loyalty",
                title: "2× loyalty points on this purchase",
                details: { multiplier: 2, estimated_points: 520 },
              },
            ],
            ui: {
              title: "Loyalty Bonus",
              subtitle: "Earn 2× loyalty points (520 pts) on iPhone 17 Pro Blue",
              badges: ["2× Points"],
            },
            internal: {
              reasoning:
                "Fallback offer for shoppers who accept the Blue variant. Double loyalty points (estimated 520 pts = ~SAR 5.2 value) is near-zero cost on a SAR 5,199 item. Loyalty multiplier drives 18% higher 90-day return rate based on Jarir electronics loyalty cohort.",
              confidence: 0.88,
              confidence_explanation:
                "High confidence: loyalty program cost model is well-established, return rate data from 12-month electronics cohort.",
              kpi_numbers: {
                loyalty_cost_sar: 5.2,
                estimated_points: 520,
                margin_bps: 900,
                return_rate_uplift_90d: 0.18,
              },
              data_sources: [
                { name: "jarir_loyalty_program", freshness_minutes: 60 },
                { name: "jarir_electronics_cohort", freshness_minutes: 10080 },
              ],
            },
          },
        ],
      },
    ],
    narrative:
      "Shopper wants iPhone 17 Pro 256GB Silver but it's out of stock. K2 returns the closest in-stock variant (Blue) as the primary item with 4 ranked offers: (1) personalized gift if identity is present, (2) Silver in 1TB upsell path, (3) Silver in Pro Max upgrade path, (4) loyalty bonus on the Blue variant.",
  },
];
