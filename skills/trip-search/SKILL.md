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

**DO NOT give only the summit day elevation.** For multi-day trips, elevation MUST include ALL days.

WRONG: "1,200m gain" (this is only Hörnlihütte to summit)
RIGHT: "2,850m gain | Max: 4,478m" (this is Zermatt to summit, the full trip)

The user starts in town, not at a mountain hut. Calculate accordingly.

## EXAMPLE OUTPUT

For "Matterhorn" search, return:
```json
[
  {
    "name": "Matterhorn via Hörnli Ridge",
    "location": "Zermatt, Switzerland",
    "difficulty": "technical",
    "duration": "2 days",
    "distance": "12km",
    "terrain": "Mixed rock and ice climbing with high exposure",
    "elevation": "2,850m gain | Max: 4,478m",
    "hazards": "Rockfall, altitude sickness, extreme weather, crevasses on descent",
    "summary": "Classic alpine climb from Zermatt via the Hörnlihütte to the iconic pyramid summit."
  }
]
```

Note: Elevation is 2,850m because Day 1 (Zermatt 1,620m → Hörnlihütte 3,260m) = 1,640m + Day 2 (Hut → Summit 4,478m) = 1,218m.

## RULES

1. **Use your knowledge** - You know global trails. Return accurate info.
2. **Be specific** - Include exact location, not just region.
3. **Include hazards** - This drives gear requirements.
4. **Seasonal awareness** - Note if conditions vary by season.
5. **Multiple matches** - If query is ambiguous, return all matching trails.
6. **ELEVATION = FULL TRIP** - Never give partial elevation. A 2-day climb starts from the town, not the hut.
