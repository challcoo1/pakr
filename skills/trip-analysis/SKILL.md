# Trip Analysis Skill

## PURPOSE

Analyze a trip description and generate comprehensive, specific gear requirements with technical specifications tailored to the exact conditions.

**Target execution time:** 10-20 seconds

## INPUT

Natural language trip description.

```
/trip-analysis "Climbing Matterhorn in August"
/trip-analysis "Overland Track in October"
/trip-analysis "Winter camping in Patagonia"
/trip-analysis "3-day hut-to-hut in the Dolomites, July"
```

## PROCESS

### Step 1: Extract Trip Parameters

| Parameter | Extract From | Example |
|-----------|--------------|---------|
| `activity_type` | Verb + context | "climbing" → alpine_climbing |
| `location` | Named place | "Matterhorn" → Alps, Switzerland |
| `altitude` | Known peaks or infer | 4,478m summit |
| `season` | Month or season word | "August" → late_summer |
| `duration` | Explicit or infer | "3-day" or infer from route |
| `technical_grade` | Activity + location | Matterhorn = AD, exposed ridges |

**Activity Type Classification:**
```
alpine_climbing    → technical peaks, glaciers, ropes
mountaineering     → non-technical summits, scrambling
hiking             → trail-based, below treeline
trekking           → multi-day hiking, remote
backpacking        → overnight wilderness
ski_touring        → backcountry skiing
ice_climbing       → frozen waterfalls, ice routes
```

### Step 2: Determine Environmental Conditions

Build conditions profile from location + season:

```json
{
  "temperature": {
    "day_high_c": 5,
    "night_low_c": -10,
    "summit_c": -15,
    "wind_chill_c": -25
  },
  "precipitation": {
    "rain_likelihood": "moderate",
    "snow_likelihood": "high_above_3500m",
    "afternoon_storms": true
  },
  "terrain": {
    "glacier": true,
    "rock": true,
    "snow": true,
    "ice": "possible",
    "exposure": "severe"
  },
  "altitude": {
    "max_m": 4478,
    "base_m": 1600,
    "acclimatization_needed": false
  }
}
```

**Condition Lookup References:**

| Location Type | Key Considerations |
|---------------|-------------------|
| Alps (summer) | Afternoon storms, glacier travel, altitude sickness rare |
| Alps (winter) | Extreme cold, avalanche, short days |
| Patagonia | Extreme wind, horizontal rain, unpredictable |
| Himalayas | Altitude sickness, extreme cold, remote |
| Tasmania | Horizontal rain, mud, rapid weather change |
| Scottish Highlands | Wet, windy, navigation challenges |
| Rockies (summer) | Afternoon lightning, altitude, bears |
| New Zealand Alps | Glaciers, sandflies, weather windows |

### Step 3: Generate Gear Requirements

For each gear category, specify **exact technical requirements** based on conditions:

**DO NOT output generic items like:**
- ❌ "boots"
- ❌ "jacket"
- ❌ "sleeping bag"

**DO output specific requirements like:**
- ✅ "4-season alpine boots, semi-auto crampon compatible, -15°C rated"
- ✅ "hardshell jacket, 20k/20k waterproof/breathable, helmet-compatible hood"
- ✅ "down sleeping bag, -10°C comfort, 800g max weight"

### Step 4: Assign Priority Levels

| Priority | Definition | Examples |
|----------|------------|----------|
| `critical` | Safety item or trip impossible without | Boots, crampons on glacier, harness on roped terrain |
| `recommended` | Significantly improves safety or comfort | Gaiters, sun protection, trekking poles |
| `optional` | Nice to have, personal preference | Camera, luxury food, camp shoes |

**Priority Logic:**
- Glacier travel → crampons = critical
- Rock scrambling → helmet = critical
- Rain likely → waterproof shell = critical
- Cold nights → warm sleeping bag = critical
- Long approach → trekking poles = recommended
- Technical climbing → belay device = critical

## OUTPUT

```json
{
  "trip": {
    "description": "Climbing Matterhorn in August",
    "activity_type": "alpine_climbing",
    "location": {
      "name": "Matterhorn",
      "region": "Pennine Alps",
      "country": "Switzerland/Italy",
      "altitude_m": 4478
    },
    "season": "late_summer",
    "duration_days": 2,
    "technical_grade": "AD"
  },
  "conditions": {
    "temperature": {
      "base_day_c": 15,
      "base_night_c": 5,
      "summit_c": -10,
      "wind_chill_c": -20
    },
    "hazards": ["rockfall", "altitude", "exposure", "afternoon_storms", "crevasses"],
    "terrain": ["glacier", "rock", "snow", "mixed"]
  },
  "gear_requirements": [
    {
      "category": "footwear/alpine_boots/4_season",
      "item": "Mountaineering boots",
      "requirements": {
        "crampon_compatibility": "semi-automatic or automatic",
        "temperature_rating": "-15°C minimum",
        "ankle_support": "high, rigid",
        "waterproofing": "Gore-Tex or equivalent",
        "sole": "Vibram or similar, crampon-compatible welt"
      },
      "reasoning": "Glaciated approach to Hörnli Hut, mixed rock/snow climbing, summit temps to -10°C, need secure crampon attachment",
      "priority": "critical"
    },
    {
      "category": "climbing/crampons",
      "item": "Crampons",
      "requirements": {
        "type": "semi-automatic or strap-on",
        "points": "12-point",
        "front_points": "mono or dual",
        "anti-balling": "required"
      },
      "reasoning": "Glacier crossing and snow/ice sections on Hörnli Ridge, essential for safety on 45°+ slopes",
      "priority": "critical"
    },
    {
      "category": "climbing/ice_axe",
      "item": "Ice axe",
      "requirements": {
        "length": "50-60cm",
        "type": "general mountaineering",
        "pick": "curved, technical not required",
        "leash": "optional"
      },
      "reasoning": "Self-arrest capability on snow slopes, support on mixed terrain, glacier travel safety",
      "priority": "critical"
    },
    {
      "category": "climbing/harness",
      "item": "Climbing harness",
      "requirements": {
        "type": "alpine/lightweight",
        "gear_loops": "4 minimum",
        "weight": "<400g preferred",
        "leg_loops": "adjustable for layering"
      },
      "reasoning": "Roped glacier travel, fixed rope sections on ridge, potential short-roping",
      "priority": "critical"
    },
    {
      "category": "climbing/helmet",
      "item": "Climbing helmet",
      "requirements": {
        "type": "hybrid (foam + hardshell)",
        "ventilation": "good",
        "weight": "<250g preferred",
        "certification": "UIAA/CE"
      },
      "reasoning": "Significant rockfall hazard on Hörnli Ridge, especially from parties above. Non-negotiable.",
      "priority": "critical"
    },
    {
      "category": "clothing/shells/hardshell",
      "item": "Hardshell jacket",
      "requirements": {
        "waterproof_rating": "20,000mm+",
        "breathability": "20,000g/m²/24hr+",
        "hood": "helmet-compatible",
        "features": ["pit zips", "harness-compatible pockets"],
        "weight": "<400g preferred"
      },
      "reasoning": "Afternoon storms common in August, wind protection critical at altitude, must layer over climbing harness",
      "priority": "critical"
    },
    {
      "category": "clothing/insulation/down",
      "item": "Insulated jacket",
      "requirements": {
        "type": "down or synthetic",
        "fill_power": "800+ if down",
        "weight": "<350g",
        "packability": "compressible to 1L",
        "features": "hood preferred"
      },
      "reasoning": "Summit temps -10°C, waiting at belay stations, early morning start from hut",
      "priority": "critical"
    },
    {
      "category": "clothing/gloves",
      "item": "Gloves (2 pairs)",
      "requirements": {
        "liner": "lightweight, touch-screen optional",
        "insulated": "waterproof, -10°C rated",
        "dexterity": "must handle carabiners and rope"
      },
      "reasoning": "Cold rock handling, rope work, variable conditions require layering system",
      "priority": "critical"
    },
    {
      "category": "safety/rope",
      "item": "Rope",
      "requirements": {
        "type": "half rope or single",
        "diameter": "8-9mm if half, 9-10mm if single",
        "length": "50m minimum",
        "dry_treatment": "required"
      },
      "reasoning": "Glacier travel, short-roping on ridge, fixed line backup. Often provided by guide.",
      "priority": "critical (if unguided)"
    },
    {
      "category": "accessories/trekking_poles",
      "item": "Trekking poles",
      "requirements": {
        "type": "collapsible",
        "material": "carbon or aluminum",
        "length": "adjustable",
        "packable": "must stow on pack for climbing"
      },
      "reasoning": "Long approach to Hörnli Hut (5hrs), useful for moraine, stow for technical sections",
      "priority": "recommended"
    },
    {
      "category": "accessories/gaiters",
      "item": "Gaiters",
      "requirements": {
        "height": "knee-high",
        "waterproof": "yes",
        "crampon_compatible": "reinforced instep"
      },
      "reasoning": "Snow on approach and descent, keeps debris out of boots on scree",
      "priority": "recommended"
    },
    {
      "category": "accessories/sunglasses",
      "item": "Glacier glasses",
      "requirements": {
        "category": "4",
        "coverage": "side shields or wraparound",
        "glacier_certified": "yes"
      },
      "reasoning": "High UV at 4000m+, snow reflection, essential to prevent snow blindness",
      "priority": "critical"
    }
  ],
  "notes": [
    "Book Hörnli Hut well in advance (required for Matterhorn)",
    "Hire a guide if inexperienced - Matterhorn has highest fatality rate in Alps",
    "Start by 4am to avoid afternoon rockfall and storms",
    "Check conditions: snow levels vary significantly year to year"
  ]
}
```

## CATEGORY REFERENCE

Use categories from gear-enrichment skill taxonomy:

```
footwear/alpine_boots/4_season
footwear/hiking_boots/mid
climbing/crampons
climbing/ice_axe
climbing/harness
climbing/helmet
climbing/rope
clothing/shells/hardshell
clothing/shells/softshell
clothing/insulation/down
clothing/insulation/synthetic
clothing/base_layers
clothing/gloves
clothing/headwear
sleep_system/sleeping_bags/down
sleep_system/sleeping_pads/inflatable
shelter/tents/4_season
accessories/trekking_poles
accessories/gaiters
accessories/sunglasses
navigation/map
navigation/compass
navigation/gps
safety/first_aid
safety/emergency_shelter
```

## EXAMPLE OUTPUTS

### "Overland Track in October"

```json
{
  "trip": {
    "activity_type": "trekking",
    "location": { "name": "Overland Track", "region": "Tasmania", "country": "Australia" },
    "duration_days": 6,
    "technical_grade": "non-technical"
  },
  "conditions": {
    "temperature": { "day_high_c": 12, "night_low_c": -2 },
    "hazards": ["mud", "river_crossings", "rapid_weather_change", "hypothermia_risk"],
    "terrain": ["boardwalk", "mud", "rock", "alpine_moorland"]
  },
  "gear_requirements": [
    {
      "category": "footwear/hiking_boots/mid",
      "requirements": { "waterproof": "Gore-Tex", "ankle_support": "mid-cut", "grip": "Vibram or similar" },
      "reasoning": "Notorious mud, wet boardwalks, river crossings. Waterproofing essential.",
      "priority": "critical"
    },
    {
      "category": "clothing/shells/rain",
      "requirements": { "waterproof": "20k+", "breathability": "high", "full_zip": true, "packable": true },
      "reasoning": "Tasmania = 4 seasons in one day. Rain guaranteed. Pack rain pants too.",
      "priority": "critical"
    }
  ]
}
```

### "Winter camping in Patagonia"

```json
{
  "trip": {
    "activity_type": "backpacking",
    "location": { "name": "Torres del Paine", "region": "Patagonia", "country": "Chile" },
    "season": "winter",
    "duration_days": 5
  },
  "conditions": {
    "temperature": { "day_high_c": 2, "night_low_c": -15 },
    "hazards": ["extreme_wind", "snow", "isolation", "river_crossings"],
    "terrain": ["snow", "ice", "rock", "glacier"]
  },
  "gear_requirements": [
    {
      "category": "shelter/tents/4_season",
      "requirements": { "poles": "aluminum_DAC_or_better", "wind_rating": "extreme", "vestibule": "large", "fly": "full_coverage" },
      "reasoning": "Patagonian winds exceed 100km/h. Tent failure = emergency. 4-season mandatory.",
      "priority": "critical"
    },
    {
      "category": "sleep_system/sleeping_bags/down",
      "requirements": { "comfort_rating": "-20°C", "fill": "800+_down_or_synthetic", "draft_collar": true },
      "reasoning": "Night temps to -15°C, wind chill much lower. Hypothermia risk significant.",
      "priority": "critical"
    }
  ]
}
```

## VALIDATION

Before returning:
- [ ] All `critical` items identified for safety
- [ ] Requirements include measurable specs (temps, ratings, dimensions)
- [ ] Reasoning references specific trip conditions
- [ ] Categories match gear-enrichment taxonomy
- [ ] No generic items without specifications

## ERROR HANDLING

| Issue | Action |
|-------|--------|
| Vague location | Ask for clarification or provide multiple interpretations |
| Unknown route | Use regional defaults, note uncertainty |
| Conflicting info | State assumptions clearly |
| Extreme/dangerous | Include strong safety warnings |

## USAGE

```
/trip-analysis "Mont Blanc via Gouter Route, July"
/trip-analysis "PCT Section J, September"
/trip-analysis "Everest Base Camp trek, April"
/trip-analysis "Winter traverse of the Cairngorms"
```
