# System Check Skill

## PURPOSE

Analyze gear as an integrated system. Check compatibility between items and identify conflicts or synergies.

## INPUT

```json
{
  "matchedGear": [
    { "requirement": "Mountaineering boots", "name": "La Sportiva Nepal Evo", "specs": "B3 rating" },
    { "requirement": "Crampons", "name": "Petzl Lynx", "specs": "Automatic binding" },
    { "requirement": "Hardshell jacket", "name": "Arc'teryx Alpha SV", "specs": "Helmet-compatible hood" },
    { "requirement": "Climbing helmet", "name": "Petzl Sirocco", "specs": "Lightweight" }
  ],
  "trip": {
    "name": "Matterhorn via Hörnli",
    "terrain": "Mixed rock and ice",
    "conditions": ["cold", "exposed", "technical"]
  }
}
```

## OUTPUT FORMAT

```json
{
  "systemScore": 87,
  "systemLevel": "good",
  "summary": "Well-matched kit with no major conflicts",
  "compatibilityNotes": [
    {
      "items": ["Mountaineering boots", "Crampons"],
      "status": "compatible",
      "note": "B3 boots work with automatic crampons"
    },
    {
      "items": ["Hardshell jacket", "Climbing helmet"],
      "status": "compatible",
      "note": "Helmet-compatible hood confirmed"
    }
  ],
  "warnings": [
    {
      "items": ["Insulated jacket", "Hardshell jacket"],
      "issue": "Shell may be too fitted for this puffy layer",
      "suggestion": "Verify shell fits over insulation with full arm movement"
    }
  ],
  "gaps": [
    "No belay device matched - verify rope diameter compatibility when added"
  ]
}
```

## SYSTEM LEVELS

| Score | systemLevel | Meaning |
|-------|-------------|---------|
| 90-100 | "excellent" | Cohesive system, no issues |
| 75-89 | "good" | Works well together, minor notes |
| 60-74 | "fair" | Some compatibility concerns |
| Below 60 | "poor" | Significant conflicts to resolve |

## COMPATIBILITY RULES

### Hard Requirements (binary - works or doesn't)

| Item A | Item B | Rule |
|--------|--------|------|
| Automatic crampons | Boots | Requires B3 rating |
| Semi-automatic crampons | Boots | Requires B2+ rating |
| Strap-on crampons | Boots | Works with any boot |
| Tech/pin ski bindings | Ski boots | Requires tech-compatible soles |
| Thin ropes (<9mm) | Belay device | Check device spec range |

### Soft Compatibility (works better together)

| Item A | Item B | Check |
|--------|--------|-------|
| Hardshell jacket | Insulated jacket | Shell sized to fit over insulation |
| Hardshell jacket | Climbing helmet | Hood is helmet-compatible |
| Insulated jacket | Climbing helmet | Hood is helmet-compatible |
| Climbing harness | Insulated pants | Leg loops are adjustable |
| Glove liners | Shell gloves | Liners fit inside shells |
| Backpack | All layers | Hip belt fits over all layers |

### Brand Synergies

- Same-brand layering systems often designed to work together
- Arc'teryx, Patagonia, Rab have integrated layering philosophies
- Not required, but note when present

## RULES

1. Check ALL hard compatibility rules first
2. Note soft compatibility issues as warnings, not failures
3. If key gear is missing (no match), note in gaps
4. Be specific - "B3 boots + automatic crampons" not "boots work with crampons"
5. Summary is one sentence
6. Return valid JSON only
