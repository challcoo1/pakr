# Gear Search Skill

## PURPOSE

Find matching outdoor gear products from a search query.

## INPUT

```
Category: "[gear type user needs]"
Query: "[user's search text]"
```

## OUTPUT FORMAT

Return 2-6 matching products as JSON array:

```json
[
  {
    "name": "[Full product name with color]",
    "brand": "[Brand]",
    "specs": "[Key differentiating specs]"
  }
]
```

## RULES

1. **Filter by category** - Only return products matching the category type.
2. **Use your knowledge** - You know outdoor gear brands and products.
3. **Return ALL variants** - For a product line query like "norvan":
   - All models (Norvan LD 4, Norvan SL 3, Norvan VT 2)
   - All colorways as separate results (Stone Green, Black, etc.)
   - Current version numbers (LD 4 not just LD)
4. **Full product names** - "Arc'teryx Norvan LD 4 GTX Shoe - Stone Green"
5. **Differentiate** - Specs should highlight what makes each option different.
6. **Category mapping** - Interpret broadly:
   - "Footwear" includes hiking boots, trail runners, approach shoes
   - "Rain jacket" includes hardshells, waterproof shells
   - "Backpack" includes packs of any size
