# Trip Analysis Skill

## PURPOSE

Analyze a trip and generate gear requirements with detailed technical specs.

## INPUT

Trip description (e.g., "Routeburn Track in October, 3 days").

## OUTPUT

```json
{
  "trip": {
    "description": "[user input]",
    "activity_type": "[hiking|trekking|alpine_climbing|mountaineering|backpacking]",
    "location": {
      "name": "[trail name]",
      "region": "[region]",
      "country": "[country]"
    },
    "season": "[season]",
    "duration_days": [number]
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

1. **Use broad item names:**
   - "Footwear" (not "hiking boots")
   - "Rain jacket" (not "hardshell")
   - "Insulated jacket"
   - "Backpack"
   - "Sleeping bag"
   - "Tent"

2. **Detailed technical specs** - Each item needs 3-5 specific requirements:
   - Waterproof ratings (10,000mm+, Gore-Tex)
   - Temperature ratings (-5°C comfort)
   - Materials (down, synthetic, Vibram sole)
   - Weight limits (under 400g)
   - Features (hood, ankle support, ventilation)

3. **Use your knowledge** - You know this trail's weather, terrain, and conditions.

4. **Always include rain protection** - Weather is unpredictable.

5. **Reasoning is specific** - Reference actual conditions of THIS trip.

## PRIORITY

- `critical` = Safety or can't do trip without
- `recommended` = Improves safety/comfort significantly
- `optional` = Nice to have
