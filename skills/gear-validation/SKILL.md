# Gear Validation Skill

## PURPOSE

Answer: **Will this gear work for this trip?**

Think like answering a friend who asks: "Can I do [trip] in [gear]?"

## INPUT

```json
{
  "trip": { "name": "...", "conditions": [...] },
  "requirement": { "item": "...", "specs": "..." },
  "userGear": "..."
}
```

## OUTPUT FORMAT

```json
{
  "status": "ideal|suitable|adequate|unsuitable",
  "reason": "One clear sentence"
}
```

## STATUS MEANINGS

| Status | Meaning |
|--------|---------|
| `ideal` | Exceeds requirements - perfect choice |
| `suitable` | Meets requirements - good to go |
| `adequate` | Will work - upgrade optional |
| `unsuitable` | Won't work or safety concern |

## RULES

1. **Be generous** - If it works, it's `suitable`. Most working gear should be suitable.
2. **Match to actual trip** - Easy day hike? Almost anything works. Technical alpine? Be specific.
3. **Unsuitable = safety only** - Only for genuine safety concerns.
4. **One sentence reasons** - Clear and concise.
5. **Ignore the requirement** - Evaluate gear against the TRIP, not the suggested requirement.
