# Gear Matching Skill

## PURPOSE

Match user's gear inventory to trip requirements. Find the best item for each requirement.

## INPUT

```json
{
  "trip": {
    "name": "Matterhorn via Hörnli",
    "region": "Alps, Switzerland",
    "duration": "2 days",
    "terrain": "Mixed rock and ice",
    "hazards": "Rockfall, exposure",
    "conditions": ["cold", "exposed", "technical"]
  },
  "userGear": [
    { "id": "uuid", "name": "La Sportiva Nepal Evo", "specs": "B3, crampon compatible", "category": "Footwear" }
  ],
  "requirements": [
    { "item": "Mountaineering boots", "specs": "B2+ rating, crampon compatible", "priority": "critical" }
  ]
}
```

## OUTPUT FORMAT

```json
{
  "[requirement item name]": {
    "gearId": "[user gear id]",
    "name": "[gear name]",
    "score": 85,
    "matchLevel": "good",
    "reason": "Brief explanation"
  }
}
```

Use `null` if no suitable match exists for a requirement.

## MATCH LEVELS

| Score | matchLevel | User sees |
|-------|------------|-----------|
| 90-100 | "excellent" | Excellent match |
| 70-89 | "good" | Good match |
| 50-69 | "adequate" | Adequate |
| 1-49 | "poor" | Consider alternatives |

## MATCHING CRITERIA

1. **Specs match** - weight, warmth, waterproofing, features
2. **Category match** - footwear→footwear, shelter→shelter
3. **Trip conditions** - don't over/under spec for the objective
4. **Priority weighting** - be stricter on critical items

## RULES

1. Only match from provided user gear - never invent items
2. One gear item can match only one requirement
3. Always include both `score` AND `matchLevel`
4. Reasons are one sentence max
5. Return valid JSON only, no other text
