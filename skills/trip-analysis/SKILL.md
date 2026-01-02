# Trip Analysis Skill

## PURPOSE

Analyze a trip and generate gear requirements with technical specifications.

## INPUT

Natural language trip description (e.g., "Routeburn Track in October").

## OUTPUT FORMAT

```json
{
  "trip": {
    "description": "[user's input]",
    "activity_type": "[hiking|trekking|alpine_climbing|mountaineering|backpacking|ski_touring|ice_climbing]",
    "location": {
      "name": "[trail/route name]",
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
    "hazards": ["[hazard1]", "[hazard2]"],
    "terrain": ["[terrain1]", "[terrain2]"]
  },
  "gear_requirements": [
    {
      "category": "[category]",
      "item": "[item name]",
      "requirements": {
        "[spec1]": "[value1]",
        "[spec2]": "[value2]"
      },
      "reasoning": "[why this is needed for THIS trip]",
      "priority": "critical|recommended|optional"
    }
  ]
}
```

## RULES

1. **Use your knowledge** - You know global trails, weather patterns, and conditions. Use that knowledge.

2. **Be specific** - Don't output generic items. Include exact specs based on conditions:
   - ❌ "boots"
   - ✅ "Hiking boots, waterproof, mid-ankle support"

3. **Always include rain protection** - Weather is unpredictable almost everywhere.

4. **Priority levels:**
   - `critical` = Safety or trip impossible without
   - `recommended` = Significantly improves safety/comfort
   - `optional` = Nice to have

5. **Reasoning must reference THIS trip** - Not generic advice.

## CATEGORIES

```
footwear/hiking_boots
footwear/alpine_boots
climbing/crampons
climbing/ice_axe
climbing/harness
climbing/helmet
clothing/shells/hardshell
clothing/shells/softshell
clothing/insulation/down
clothing/base_layers
clothing/gloves
sleep_system/sleeping_bags
sleep_system/sleeping_pads
shelter/tents
accessories/trekking_poles
accessories/gaiters
accessories/sunglasses
navigation/map
safety/first_aid
```
