# Trip Search Skill

## PURPOSE

Identify the exact trail/route/trip the user means. Return multiple options if ambiguous.

## INPUT

User's trip objective (e.g., "Routeburn Track in New Zealand in October").

## OUTPUT FORMAT

Return matching trips as JSON array:

```json
[
  {
    "name": "[exact trail/route name]",
    "location": "[region, country]",
    "difficulty": "[easy|moderate|hard|technical]",
    "duration": "[X hours or X days]",
    "distance": "[total km for full trip]",
    "terrain": "[description]",
    "elevation": "[Xm gain | Max: Ym] - MUST be total gain from town/trailhead to summit",
    "hazards": "[key hazards]",
    "summary": "[one sentence description]"
  }
]
```

## CRITICAL: ELEVATION CALCULATION

**DO NOT give only the summit day elevation.** For multi-day trips, elevation MUST include ALL days:

- Matterhorn via Hörnli: 2,850m gain (Zermatt 1,620m → Summit 4,478m), NOT 1,200m (hut to summit only)
- Mont Blanc via Gouter: 3,800m gain (Les Houches 1,000m → Summit 4,808m), NOT 1,500m (Gouter Hut to summit)
- Denali: 4,000m+ gain (basecamp to summit), NOT just high camp to summit

Format: "2,850m gain | Max: 4,478m"

## RULES

1. **Use your knowledge** - You know global trails. Return accurate info.
2. **Be specific** - Include exact location, not just region.
3. **Include hazards** - This drives gear requirements.
4. **Seasonal awareness** - Note if conditions vary by season.
5. **Multiple matches** - If query is ambiguous, return all matching trails.
6. **ELEVATION = FULL TRIP** - Never give partial elevation. A 2-day climb starts from the town, not the hut.
