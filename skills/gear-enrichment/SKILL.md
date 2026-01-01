# Gear Enrichment Skill

## PURPOSE

Enrich outdoor gear with manufacturer specs and expert review consensus. Produces stable data that helps users make informed decisions.

**Target execution time:** 30-60 seconds

## INPUT

Gear name with optional manufacturer context.

```
/gear-enrichment "La Sportiva Trango Tower GTX"
/gear-enrichment "Osprey Atmos AG 65"
```

## PROCESS

### Step 1: Manufacturer Specs (Primary)
Search for official specifications:
- Weight (with unit and size reference)
- Materials (upper, lining, insulation, sole)
- Performance ratings (temperature, waterproofing)
- Compatibility (crampons, accessories)
- Intended use cases

### Step 2: Category Classification
Assign hierarchical category:
```
footwear > alpine_boots > 4_season
shelter > tents > 3_season > freestanding
insulation > synthetic > jacket
```

### Step 3: Expert Review Aggregation
Gather from credible publications (max 3-4 sources):

| Publication | Weight | Focus |
|-------------|--------|-------|
| Outdoor Gear Lab | 1.0 | Technical testing, comparisons |
| Switchback Travel | 0.9 | In-depth field testing |
| CleverHiker | 0.8 | Thru-hiking perspective |
| GearJunkie | 0.7 | General outdoor coverage |

Extract and synthesize:
- Consensus pros (mentioned by 2+ sources)
- Consensus cons (mentioned by 2+ sources)
- Best-use summary

## OUTPUT

```json
{
  "name": "La Sportiva Trango Tower GTX",
  "category": "footwear/alpine_boots/4_season",
  "manufacturer": "La Sportiva",
  "specs": {
    "weight": {
      "value": 745,
      "unit": "g",
      "per": "boot",
      "size_reference": "EU 42"
    },
    "materials": {
      "upper": "High tenacity Nylon with Honey-Comb Guard",
      "lining": "Gore-Tex Performance Comfort",
      "midsole": "PU with EVA inserts",
      "outsole": "Vibram Cube"
    },
    "waterproofing": "Gore-Tex membrane",
    "crampon_compatibility": "semi-automatic",
    "ankle_system": "3D Flex",
    "use_cases": ["alpine climbing", "via ferrata", "glacier travel", "winter hillwalking"]
  },
  "reviews": {
    "consensus": {
      "pros": [
        "Excellent grip on rock and mixed terrain",
        "Lightweight for the category",
        "Precise feel and edging capability"
      ],
      "cons": [
        "Outsole wears relatively quickly",
        "Limited insulation for extreme cold",
        "Premium price point"
      ],
      "best_for": "3-season alpine climbing and technical scrambling where weight matters",
      "not_ideal_for": "Extreme cold or extended winter expeditions"
    },
    "sources": [
      {
        "publication": "Outdoor Gear Lab",
        "credibility_tier": 1,
        "rating": "4.5/5",
        "url": "https://..."
      },
      {
        "publication": "Advnture",
        "credibility_tier": 2,
        "rating": "4.5/5",
        "url": "https://..."
      }
    ]
  }
}
```

## CREDIBILITY TIERS

| Tier | Sources | Trust Level |
|------|---------|-------------|
| 1 | Manufacturer sites | Authoritative for specs |
| 1 | Outdoor Gear Lab, Switchback Travel | Authoritative for reviews |
| 2 | CleverHiker, GearJunkie, Advnture, UKClimbing | Strong for reviews |
| 3 | REI Expert Advice, retailer descriptions | Supplementary |

**Conflict resolution:** Manufacturer specs always win. For reviews, weight by tier.

## CATEGORY TAXONOMY

```
footwear/
  hiking_boots/light, mid, heavy
  alpine_boots/3_season, 4_season
  trail_runners/road_to_trail, technical
  approach_shoes/

shelter/
  tents/3_season, 4_season, ultralight
  tarps/
  bivys/

sleep_system/
  sleeping_bags/down, synthetic
  quilts/
  sleeping_pads/foam, inflatable

packs/
  backpacks/daypacks, overnight, multiday, expedition
  stuff_sacks/

clothing/
  insulation/down, synthetic
  shells/rain, hardshell, softshell
  base_layers/

climbing/
  harnesses/
  ropes/
  protection/
```

## VALIDATION

Required before saving:
- [ ] `name` is exact product name
- [ ] `manufacturer` is correct
- [ ] `category` follows taxonomy
- [ ] `specs.weight` includes value, unit, and reference
- [ ] `reviews.sources` has at least 1 entry with URL

## ERROR HANDLING

| Scenario | Action |
|----------|--------|
| No manufacturer specs found | Return error, do not guess |
| No reviews found | Set `reviews.sources: []`, note in consensus |
| Conflicting weights | Use manufacturer, note discrepancy |
| Discontinued product | Include `discontinued: true` flag |

## USAGE

```
/gear-enrichment "MSR Hubba Hubba NX 2"
/gear-enrichment "Patagonia Nano Puff Jacket"
/gear-enrichment "Black Diamond Spot 400 Headlamp"
```
