# Gear Validation Skill

## PURPOSE

Validate whether a user's gear is appropriate for a specific trip. Uses holistic, context-aware thinking like an experienced outdoor guide - not mechanical spec comparison.

**Target execution time:** 3-5 seconds

## INPUT

```json
{
  "trip": {
    "name": "Overland Track",
    "region": "Tasmania",
    "duration": "6 days",
    "conditions": ["rain likely", "mud", "remote"]
  },
  "requirement": {
    "item": "Hiking boots",
    "specs": "Waterproof, ankle support"
  },
  "userGear": "Altra Lone Peak trail runners"
}
```

## PROCESS

### Step 1: Understand Trip Context

**Trip Difficulty:**
- Maintained trail with signs → lightweight gear is fine
- Off-trail scrambling → need sturdier gear
- Technical alpine → specific safety gear required

**Duration:**
- Day hike (4-8 hours) → minimal requirements
- Overnight → shelter, sleep system matter
- Multi-day → durability, capacity, comfort important

**Conditions:**
- Mild weather → wide gear tolerance
- Rain likely → waterproofing important
- Extreme cold → specific ratings matter
- Remote/no bailout → reliability critical

### Step 2: Understand Gear Interactions

Consider the full picture:
- Has water filter → doesn't need to carry 3L, refill points work
- Ultralight tent → fine for fair weather, risky in storms
- Trail runners → great for maintained trails, risky on scree/snow

### Step 3: Make Practical Judgment

Think like a real outdoor guide, not a liability-conscious rental shop:
- Real hikers often use lighter gear than guidebooks suggest
- Personal preference matters for non-safety items
- Only flag "unsuitable" for genuine safety concerns

## OUTPUT

```json
{
  "status": "suitable" | "marginal" | "unsuitable",
  "reason": "One clear sentence explaining your thinking"
}
```

## EXAMPLES

### Example 1: Easy Day Hike
**Trip:** "Platypus Trail day hike" (maintained trail, 4 hours, mild)
**Requirement:** "2-3L water capacity"
**User has:** "1L bottle + Sawyer filter"
```json
{
  "status": "suitable",
  "reason": "With filter and water sources on trail, 1L is plenty. Can refill."
}
```

### Example 2: Multi-day Trek
**Trip:** "Overland Track" (6 days, mud, rain, remote)
**Requirement:** "Hiking boots"
**User has:** "Altra Lone Peak trail runners"
```json
{
  "status": "marginal",
  "reason": "Many people do Overland in trail runners, but boots give better ankle support in mud. Personal preference."
}
```

### Example 3: Technical Alpine
**Trip:** "Mt Blanc" (glacier, altitude, technical)
**Requirement:** "Mountaineering boots"
**User has:** "Salomon hiking boots"
```json
{
  "status": "unsuitable",
  "reason": "Need crampon-compatible boots for glacier travel. Safety issue."
}
```

### Example 4: Ultralight Setup
**Trip:** "John Muir Trail" (3 weeks, summer, established trail)
**Requirement:** "60L+ backpack"
**User has:** "Gossamer Gear Mariposa 60"
```json
{
  "status": "suitable",
  "reason": "60L ultralight pack is perfect for thru-hiking with resupply points."
}
```

### Example 5: Cold Weather
**Trip:** "Torres del Paine W Trek" (5 days, Patagonia, wind/rain)
**Requirement:** "0°C sleeping bag"
**User has:** "10°C summer bag"
```json
{
  "status": "unsuitable",
  "reason": "Patagonia nights can drop below freezing. 10°C bag risks hypothermia."
}
```

## RULES

1. **Be practical** - Real hikers often use lighter/simpler gear than "required"
2. **Context is everything** - Same gear can be suitable or unsuitable depending on trip
3. **Only unsuitable for safety** - Mark unsuitable only if genuine safety concern or gear simply won't work
4. **One sentence reasons** - Keep explanations clear and concise
5. **Consider alternatives** - If gear works differently than expected (filter instead of capacity), it can still be suitable
