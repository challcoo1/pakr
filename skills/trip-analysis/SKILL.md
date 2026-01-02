# Trip Analysis Skill

## PURPOSE

Analyze a trip and generate gear requirements with detailed technical specs.

## INPUT

Trip description (e.g., "Routeburn Track in October, 3 days").

## OUTPUT

```json
{
  "trip": {
    "name": "[trail/route name]",
    "region": "[region, country]",
    "timeOfYear": "[month or season]",
    "duration": "[X days]",
    "distance": "[Xkm]",
    "elevation": "[Xm gain]",
    "grading": {
      "local": "[local grading system, e.g. NZ Track 3]",
      "international": "[T1-T6 or equivalent]",
      "description": "[one-line terrain description]"
    }
  },
  "conditions": {
    "temperature": {
      "day_high_c": [number],
      "night_low_c": [number]
    },
    "hazards": ["[hazard]"],
    "terrain": ["[terrain type]"]
  },
  "gear_requirements": [
    {
      "category": "[category]",
      "item": "[broad item name]",
      "requirements": {
        "[spec]": "[specific value]"
      },
      "reasoning": "[why needed for THIS trip]",
      "priority": "critical|recommended|optional"
    }
  ]
}
```

## REQUIREMENTS

1. **Use broad item names by category:**

   **Clothing - Layering System:**
   - "Base layer top" / "Base layer bottom" (merino, synthetic)
   - "Mid layer" (fleece, softshell)
   - "Insulated jacket" (down, synthetic puffy)
   - "Hardshell jacket" / "Rain jacket"
   - "Hardshell pants" / "Rain pants"
   - "Hiking socks" / "Mountaineering socks"
   - "Gloves" / "Insulated gloves"
   - "Sun hat" / "Warm hat"

   **Footwear:**
   - "Hiking boots" / "Mountaineering boots" / "Approach shoes"
   - "Gaiters"
   - "Camp shoes" (optional)

   **Shelter & Sleep:**
   - "Tent" / "Bivy"
   - "Sleeping bag"
   - "Sleeping pad"

   **Packs:**
   - "Backpack" / "Daypack"

   **Technical Climbing Gear (when terrain requires):**
   - "Climbing helmet"
   - "Crampons"
   - "Ice axe"
   - "Climbing harness"
   - "Rope"
   - "Belay device"
   - "Carabiners"
   - "Quickdraws"
   - "Slings/runners"
   - "Ascender" / "Prusik loops"

   **Safety & Navigation:**
   - "Headlamp"
   - "First aid kit"
   - "Navigation" (map, compass, GPS)
   - "Sun protection" (sunglasses, sunscreen)
   - "Avalanche gear" (beacon, probe, shovel - when applicable)

2. **Detailed technical specs** - Each item needs specific requirements like:
   - Waterproof ratings (10,000mm+, Gore-Tex)
   - Temperature ratings (-5°C comfort)
   - Materials (down, synthetic, Vibram sole)
   - Weight limits (under 400g)
   - Features (hood, ankle support, ventilation)
   - Crampon compatibility (for mountaineering boots)
   - CE/UIAA certification (for climbing gear)

3. **Use your knowledge** - You know this trail's weather, terrain, and conditions.

4. **Match gear to terrain and hazards:**
   - Glaciers/snow → crampons, ice axe, rope, crevasse rescue gear
   - Technical rock → helmet, harness, rope, protection
   - Exposed ridges → helmet, via ferrata gear if applicable
   - Altitude → warmer layers, sun protection
   - Multi-day → shelter, sleep system, sufficient clothing layers

5. **Always include rain protection** - Weather is unpredictable.

6. **Reasoning is specific** - Reference actual conditions of THIS trip.

7. **Be comprehensive** - Include ALL essential gear for the trip type. A mountaineering expedition needs 15-25+ items. Don't be minimal.

## PRIORITY

- `critical` = Safety or can't do trip without
- `recommended` = Improves safety/comfort significantly
- `optional` = Nice to have
