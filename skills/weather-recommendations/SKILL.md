# Weather Recommendations Skill

## PURPOSE

Generate safety-critical weather warnings and recommendations. Lives depend on accurate advice.

## INPUT

```json
{
  "weather": {
    "type": "forecast|historical",
    "tempHigh": 18,
    "tempLow": 5,
    "precipitation": 40,
    "snowDays": 12,
    "rainyDays": 8
  },
  "elevation": {
    "gain": 2850,
    "maxAltitude": 4478
  },
  "trip": {
    "name": "Matterhorn via Hörnli Ridge",
    "duration": "2 days",
    "terrain": "Mixed rock and ice"
  }
}
```

## OUTPUT FORMAT

```json
{
  "summitWeather": {
    "tempHigh": -5,
    "tempLow": -12,
    "conditions": "Brief description"
  },
  "warnings": [
    {
      "severity": "critical|high|moderate",
      "message": "Clear warning",
      "action": "What to do about it"
    }
  ],
  "recommendations": [
    "Specific, actionable advice"
  ],
  "layering": {
    "base": "Conditions at trailhead",
    "summit": "Conditions at top",
    "strategy": "How to manage transition"
  }
}
```

## SEVERITY LEVELS

| Level | Meaning |
|-------|---------|
| `critical` | Life-threatening if ignored |
| `high` | Serious safety concern |
| `moderate` | Preparation/comfort issue |

## RULES

1. **Calculate summit temps** - Use 6.5°C drop per 1000m elevation gain
2. **Never understate risk** - If dangerous, say so clearly
3. **Be specific** - "Insulated jacket rated to -10°C" not "warm clothes"
4. **Consider the transition** - Danger is often in the change, not the extremes
5. **Assume weather deteriorates** - Mountains get worse faster than forecasts predict

## SAFETY FACTORS

Always consider:
- Hypothermia: wind + wet + cold kills
- Altitude: above 3000m weather changes rapidly
- Lightning: ridgelines and summits
- Avalanche: new snow + wind + steep terrain
- Visibility: whiteout makes navigation impossible

## EXAMPLE

Input: Base 18°C, summit 4478m, 2850m gain

Output:
```json
{
  "summitWeather": {
    "tempHigh": 0,
    "tempLow": -10,
    "conditions": "Near freezing, wind chill below zero"
  },
  "warnings": [
    {
      "severity": "critical",
      "message": "18°C swing between base and summit",
      "action": "Full alpine layering required - do not start in shorts"
    }
  ],
  "recommendations": [
    "Pack warm layers accessible for rapid summit layering",
    "Carry emergency bivy for weather-forced retreat"
  ],
  "layering": {
    "base": "Warm (18°C) - base layer and sun protection",
    "summit": "Near freezing (0°C) with wind - full insulation",
    "strategy": "Add layers progressively: mid-layer at treeline, insulation at hut, hardshell for summit"
  }
}
```
