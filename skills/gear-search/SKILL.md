# Gear Search Skill

## PURPOSE

Identify all matching outdoor gear products from a user's search query. Returns multiple options when the query is ambiguous, allowing users to select their exact gear.

**Target execution time:** 5-10 seconds

## INPUT

Search query WITH required category context.

```
Category: "Sun hat"
Query: "craghoppers"
→ Only return Craghoppers HATS, not trousers or jackets

Category: "Rain jacket"
Query: "arcteryx"
→ Only return Arc'teryx JACKETS, not shoes or packs
```

**CRITICAL: The category tells you what type of gear the user needs. ONLY return products that match that category.**

## CATEGORY MAPPING

Interpret requirement categories broadly:

| Requirement | Includes |
|-------------|----------|
| Hiking boots | Boots, trail runners, approach shoes, hiking shoes - ALL footwear |
| Footwear | All shoes and boots |
| Rain jacket | Hardshells, rain shells, waterproof jackets |
| Shell jacket | Hardshells, softshells, rain jackets |
| Sun hat | Sun hats, caps, wide-brim hats |
| Backpack | Packs of any size |
| Sleeping bag | Sleeping bags, quilts |

**When in doubt, include the product if it could reasonably fulfill the requirement.**

## PROCESS

### Step 1: Parse Query
Extract:
- Brand (if mentioned)
- Product line or model hints
- Size/capacity hints
- Category hints

### Step 2: Identify ALL Matches
Return EVERY product that matches the query. Be exhaustive:
- All models in the product line (Norvan LD, Norvan SL, Norvan VT)
- All current versions (Norvan LD 4, not just "Norvan LD")
- All variants (GTX vs non-GTX, Men's vs Women's if relevant)
- **All color options** - include each colorway as a separate result
- Include the FULL product name as it appears on the manufacturer site

**IMPORTANT:** Use complete, current product names WITH COLOR:
- "Arc'teryx Norvan LD 4 GTX Shoe - Stone Green"
- "Arc'teryx Norvan LD 4 GTX Shoe - Black"
- "Osprey Atmos AG 65 Pack - Mythical Green"
- Include version numbers AND colors when they exist

### Step 3: Differentiate
For each match, identify KEY specs that distinguish it from similar products:
- Weight
- Weather rating
- Capacity
- Key features
- Use case (trail running vs hiking vs mountaineering)

## OUTPUT

Return 2-6 matching products, ordered by relevance:

```json
[
  {
    "name": "Arc'teryx Beta AR Jacket",
    "brand": "Arc'teryx",
    "specs": "Gore-Tex Pro, 450g, most versatile"
  },
  {
    "name": "Arc'teryx Beta LT Jacket",
    "brand": "Arc'teryx",
    "specs": "Gore-Tex, 350g, lightweight"
  },
  {
    "name": "Arc'teryx Beta SV Jacket",
    "brand": "Arc'teryx",
    "specs": "Gore-Tex Pro, 490g, severe weather"
  }
]
```

## RULES

1. **FILTER BY CATEGORY** - If category says "Sun hat", ONLY return hats. Never return trousers, jackets, or other gear types.
2. **Multiple matches required** - If query could match 2+ products in the category, return all
3. **Be specific** - Don't return generic categories, return actual products
4. **Differentiate clearly** - Specs should highlight what makes each option different
5. **Max 6 results** - Keep list manageable
6. **Order by relevance** - Most likely match first

## EXAMPLES

### Category: "Sun hat", Query: "craghoppers"
```json
[
  {"name": "Craghoppers NosiLife Sun Hat", "brand": "Craghoppers", "specs": "UPF 50+, insect repellent, wide brim"},
  {"name": "Craghoppers NosiLife Desert Hat", "brand": "Craghoppers", "specs": "UPF 40+, neck flap, ventilated"}
]
```
**NOT** trousers, jackets, or shirts - only hats because category is "Sun hat"

### Category: "Hiking boots", Query: "norvan"
(Hiking boots includes trail runners, so Norvan shoes are valid results)
```json
[
  {"name": "Arc'teryx Norvan LD 4 GTX Shoe - Stone Green", "brand": "Arc'teryx", "specs": "Long distance, Gore-Tex, 315g, cushioned"},
  {"name": "Arc'teryx Norvan LD 4 GTX Shoe - Black", "brand": "Arc'teryx", "specs": "Long distance, Gore-Tex, 315g, cushioned"},
  {"name": "Arc'teryx Norvan SL 3 Shoe - Daybreak", "brand": "Arc'teryx", "specs": "Superlight, 215g, racing"},
  {"name": "Arc'teryx Norvan SL 3 Shoe - Black", "brand": "Arc'teryx", "specs": "Superlight, 215g, racing"},
  {"name": "Arc'teryx Norvan VT 2 Shoe - Black", "brand": "Arc'teryx", "specs": "Vertical terrain, sticky rubber, 290g, technical"}
]
```

### Query: "osprey pack"
```json
[
  {"name": "Osprey Atmos AG 65 Pack", "brand": "Osprey", "specs": "65L, Anti-Gravity suspension, 2.1kg"},
  {"name": "Osprey Exos 58 Pack", "brand": "Osprey", "specs": "58L, ultralight, 1.1kg"},
  {"name": "Osprey Aether 65 Pack", "brand": "Osprey", "specs": "65L, heavy loads, 2.3kg"},
  {"name": "Osprey Talon 22 Pack", "brand": "Osprey", "specs": "22L, daypack, 0.7kg"}
]
```

### Query: "arcteryx beta ar medium"
```json
[
  {"name": "Arc'teryx Beta AR Jacket - Medium", "brand": "Arc'teryx", "specs": "Gore-Tex Pro, 450g, all-round alpine shell"}
]
```
(Specific query = single result)

### Query: "down jacket"
```json
[
  {"name": "Patagonia Down Sweater Hoody", "brand": "Patagonia", "specs": "800-fill down, 370g, everyday warmth"},
  {"name": "Rab Microlight Alpine Jacket", "brand": "Rab", "specs": "700-fill down, 350g, lightweight alpine"},
  {"name": "Mountain Hardwear Ghost Whisperer/2 Jacket", "brand": "Mountain Hardwear", "specs": "800-fill down, 220g, ultralight"},
  {"name": "Arc'teryx Cerium Hoody", "brand": "Arc'teryx", "specs": "850-fill down, 280g, premium ultralight"}
]
```

## ERROR HANDLING

| Scenario | Action |
|----------|--------|
| No matches found | Return empty array `[]` |
| Query too vague | Return popular options in likely category |
| Discontinued product | Include it with note in specs |
