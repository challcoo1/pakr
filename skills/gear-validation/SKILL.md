# Gear Validation Skill

## PURPOSE

Answer a simple question: **Will this gear work for this trip?**

Ignore what the "requirement" suggests. Just evaluate the gear against the actual trip.

Think like answering a friend who asks: "Can I do [trip] in [gear]?"

**Target execution time:** 3-5 seconds

## INPUT

```json
{
  "trip": {
    "name": "Platypus Trail",
    "region": "Blue Mountains",
    "duration": "4 hours",
    "conditions": ["maintained trail", "mild weather"]
  },
  "requirement": {
    "item": "Hiking boots",  // IGNORE THIS
    "specs": "Waterproof"    // IGNORE THIS
  },
  "userGear": "Arc'teryx Norvan LD 4 GTX"
}
```

**The requirement is just a suggestion. Evaluate the GEAR against the TRIP, not against the requirement.**

## VALIDATION TIERS

Use these four tiers - be generous, not conservative:

| Status | Icon | Meaning |
|--------|------|---------|
| `ideal` | ● | Exceeds requirements - perfect choice |
| `suitable` | ● | Meets requirements - no upgrade needed |
| `adequate` | ◐ | Will work fine - upgrade optional, not necessary |
| `unsuitable` | ○ | Don't use this - safety concern or won't work |

**CRITICAL:** Most gear that "works" should be `suitable`, not `adequate`.
Only use `adequate` when there's a genuine (not theoretical) limitation.

## PROCESS

### Step 1: Match Gear to Trip Difficulty

**Easy day hikes (maintained trails, 2-6 hours, mild weather):**
- Trail runners = SUITABLE (not adequate!)
- Light hikers = SUITABLE
- Approach shoes = SUITABLE
- Heavy boots = IDEAL (overkill but fine)

**Multi-day treks (variable terrain, weather exposure):**
- Trail runners = ADEQUATE (will work, boots optional)
- Hiking boots = SUITABLE
- Mountaineering boots = IDEAL (overkill)

**Technical alpine (glacier, scrambling, exposure):**
- Trail runners = UNSUITABLE
- Hiking boots = ADEQUATE (depends on conditions)
- Mountaineering boots = SUITABLE

### Step 2: Consider Context, Not Specs

Don't compare specs mechanically. Ask: "Would I tell a friend this gear is fine?"

- Requirement says "boots" but trip is easy day hike → trail runners are SUITABLE
- Requirement says "3L water" but user has 1L + filter → SUITABLE
- Requirement says "waterproof" but forecast is sunny → non-waterproof is SUITABLE

### Step 3: Reserve Upgrades for Real Benefits

Only suggest `adequate` (upgrade optional) when:
- There's a genuine comfort/performance difference (not theoretical)
- The upgrade would meaningfully improve the experience
- It's NOT just "guidebook says X but Y also works"

## OUTPUT

```json
{
  "status": "ideal" | "suitable" | "adequate" | "unsuitable",
  "reason": "One clear sentence explaining your thinking"
}
```

## EXAMPLES

### Example 1: Trail Runners on Easy Day Hike
**Trip:** "Platypus Trail" (maintained trail, 4 hours, dry conditions)
**Requirement:** "Hiking boots"
**User has:** "Arc'teryx Norvan LD 4 GTX"
```json
{
  "status": "suitable",
  "reason": "Trail runners are perfect for maintained day hikes - lightweight and comfortable."
}
```
**NOT** adequate. This is the right choice for this trip.

### Example 2: Trail Runners on Multi-day Trek
**Trip:** "Overland Track" (6 days, mud, rain, remote)
**Requirement:** "Hiking boots"
**User has:** "Altra Lone Peak trail runners"
```json
{
  "status": "adequate",
  "reason": "Many hikers do Overland in trail runners successfully. Boots give more ankle support in deep mud if you prefer."
}
```

### Example 3: Perfect Match
**Trip:** "Overland Track" (6 days, mud, rain, remote)
**Requirement:** "Hiking boots"
**User has:** "Salomon X Ultra 4 GTX"
```json
{
  "status": "suitable",
  "reason": "Waterproof hiking boots with good ankle support - exactly what this trek needs."
}
```

### Example 4: Overkill (Still Good)
**Trip:** "Platypus Trail" (maintained trail, 4 hours, dry)
**Requirement:** "Day pack"
**User has:** "Osprey Atmos AG 65"
```json
{
  "status": "ideal",
  "reason": "Way more pack than needed for a day hike, but it'll work great."
}
```

### Example 5: Safety Issue
**Trip:** "Mt Blanc" (glacier, altitude, technical)
**Requirement:** "Mountaineering boots"
**User has:** "Salomon hiking boots"
```json
{
  "status": "unsuitable",
  "reason": "Need crampon-compatible boots for glacier travel. Safety issue."
}
```

### Example 6: Smart Alternative
**Trip:** "Larapinta Trail" (6 days, desert, water scarce)
**Requirement:** "4L water capacity"
**User has:** "2L bladder + Sawyer Squeeze"
```json
{
  "status": "suitable",
  "reason": "With a filter and known water sources, 2L carrying capacity is plenty."
}
```

## RULES

1. **Be generous** - If it works, it's suitable. Reserve adequate for genuine limitations.
2. **Match to actual trip** - Easy day hike? Almost anything works. Technical alpine? Be specific.
3. **Unsuitable = safety only** - Only for genuine safety concerns or gear that won't function.
4. **One sentence reasons** - Clear and concise.
5. **No theoretical upgrades** - Don't suggest upgrades just because "X is theoretically better than Y."
