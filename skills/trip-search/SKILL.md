# Trip Search Skill

## PURPOSE

Identify the exact trail/route/trip the user means. Return multiple options if ambiguous. Build deep understanding of the trip for gear validation.

**Target execution time:** 5-10 seconds

## INPUT

User's trip objective, which may be:
- Specific: "Platypus Trail Blue Mountains"
- Vague: "day hike near Sydney"
- Ambiguous: "Overland Track" (could be Tasmania or NZ)

## PROCESS

### Step 1: Identify Matching Trips

Find ALL trips that match the query:
- Same name in different locations
- Similar trails in the same area
- Related routes (e.g., "Three Capes" vs "Three Capes Track")

### Step 2: Build Deep Context

For each match, understand:
- **Exact location** (region, country, coordinates)
- **Difficulty** (easy walk, moderate hike, technical alpine)
- **Duration** (hours or days)
- **Distance** (km)
- **Terrain** (maintained trail, bush track, rock scramble, glacier)
- **Elevation** (gain, max altitude)
- **Conditions** (typical weather, seasonal factors)
- **Hazards** (exposure, water crossings, remoteness)
- **Infrastructure** (huts, campsites, water sources, phone coverage)

### Step 3: Differentiate Clearly

Specs should make it obvious which trip is which.

## OUTPUT

Return 1-4 matching trips:

```json
[
  {
    "name": "Platypus Trail",
    "location": "Blue Mountains National Park, NSW, Australia",
    "difficulty": "easy",
    "duration": "3-4 hours",
    "distance": "8km return",
    "terrain": "Well-maintained gravel track, some steps",
    "elevation": "200m descent/ascent",
    "hazards": "None significant - family friendly",
    "summary": "Easy creek-side walk with platypus viewing platforms"
  }
]
```

## EXAMPLES

### Query: "platypus trail"
```json
[
  {
    "name": "Platypus Trail",
    "location": "Blue Mountains National Park, NSW, Australia",
    "difficulty": "easy",
    "duration": "3-4 hours",
    "distance": "8km return",
    "terrain": "Well-maintained gravel track",
    "elevation": "200m descent/ascent",
    "hazards": "None - family friendly",
    "summary": "Easy creek-side walk, platypus viewing platforms"
  },
  {
    "name": "Platypus Walk",
    "location": "Bombala, NSW, Australia",
    "difficulty": "easy",
    "duration": "1 hour",
    "distance": "2km",
    "terrain": "Flat boardwalk",
    "elevation": "Minimal",
    "hazards": "None",
    "summary": "Short boardwalk along Bombala River"
  }
]
```

### Query: "overland track"
```json
[
  {
    "name": "Overland Track",
    "location": "Cradle Mountain-Lake St Clair NP, Tasmania, Australia",
    "difficulty": "moderate-hard",
    "duration": "5-6 days",
    "distance": "65km one-way",
    "terrain": "Boardwalk, mud, rock, alpine",
    "elevation": "1,545m max (Mt Ossa side trip)",
    "hazards": "Weather exposure, mud, river crossings, remoteness",
    "summary": "Australia's premier multi-day bushwalk through alpine wilderness"
  }
]
```

### Query: "day hike near sydney"
```json
[
  {
    "name": "Grand Canyon Track",
    "location": "Blue Mountains, NSW",
    "difficulty": "moderate",
    "duration": "3-4 hours",
    "distance": "6km loop",
    "terrain": "Steps, rock overhangs, rainforest",
    "elevation": "300m descent/ascent",
    "hazards": "Slippery when wet, steep stairs",
    "summary": "Dramatic slot canyon with lush rainforest"
  },
  {
    "name": "Figure 8 Pools",
    "location": "Royal National Park, NSW",
    "difficulty": "moderate",
    "duration": "2-3 hours",
    "distance": "4km return",
    "terrain": "Bush track, rock platforms",
    "elevation": "150m",
    "hazards": "King waves, slippery rocks, tides",
    "summary": "Coastal walk to natural rock pools"
  },
  {
    "name": "Spit to Manly",
    "location": "Sydney Harbour, NSW",
    "difficulty": "easy-moderate",
    "duration": "3-4 hours",
    "distance": "10km one-way",
    "terrain": "Sandy track, some rock",
    "elevation": "Undulating, nothing major",
    "hazards": "Sun exposure",
    "summary": "Iconic harbour walk with beaches and bush"
  }
]
```

### Query: "mt blanc"
```json
[
  {
    "name": "Mont Blanc via Goûter Route",
    "location": "Chamonix, French Alps",
    "difficulty": "technical alpine",
    "duration": "2-3 days",
    "distance": "16km return",
    "terrain": "Glacier, mixed rock/ice, exposed ridges",
    "elevation": "4,808m summit, 2,400m gain from hut",
    "hazards": "Altitude, crevasses, rockfall (Grand Couloir), weather",
    "summary": "Classic route up Western Europe's highest peak - mountaineering skills required"
  },
  {
    "name": "Tour du Mont Blanc",
    "location": "France/Italy/Switzerland Alps",
    "difficulty": "moderate",
    "duration": "7-11 days",
    "distance": "170km circuit",
    "terrain": "Mountain trails, some high passes",
    "elevation": "10,000m cumulative, 2,500m max",
    "hazards": "Weather, altitude (passes), remoteness between refuges",
    "summary": "Classic Alpine trek circumnavigating the Mont Blanc massif"
  }
]
```

## RULES

1. **Be specific** - Include exact location, not just region
2. **Deep context** - Terrain, hazards, and difficulty are critical for gear validation
3. **Differentiate clearly** - Make it obvious which trip is which
4. **Include hazards** - This drives gear requirements
5. **Seasonal awareness** - Note if conditions vary by season
