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
    "distance": "[Xkm]",
    "terrain": "[description]",
    "elevation": "[TOTAL elevation gain for full trip, plus max altitude. For multi-day climbs: include gain from basecamp/town to summit, not just final day]",
    "hazards": "[key hazards]",
    "summary": "[one sentence description]"
  }
]
```

## RULES

1. **Use your knowledge** - You know global trails. Return accurate info.
2. **Be specific** - Include exact location, not just region.
3. **Include hazards** - This drives gear requirements.
4. **Seasonal awareness** - Note if conditions vary by season.
5. **Multiple matches** - If query is ambiguous, return all matching trails.
6. **Total elevation for multi-day** - For trips spanning multiple days, elevation must be the TOTAL gain from starting point (town/trailhead) to highest point, not just the final summit push. Example: Matterhorn from Zermatt = ~2,800m gain total, not 1,200m (which is just hut to summit).
