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
3. **Include colors** - Each colorway is a separate result.
4. **Include version numbers** - Use current product names.
5. **Differentiate** - Specs should highlight what makes each option different.
6. **Category mapping** - Interpret broadly:
   - "Hiking boots" includes trail runners, approach shoes, all footwear
   - "Rain jacket" includes hardshells, waterproof shells
   - "Backpack" includes packs of any size
