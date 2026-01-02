# Gear Search Skill

## MODE 1: SEARCH (no trip context)

Search for PRODUCT MODELS (not retailer inventory). Return the product line, not specific sizes/stock.

Example: "Arc'teryx Beta AR Jacket" NOT "Arc'teryx Beta AR Jacket XL Black - In Stock"

Return as JSON array:

```json
[
  {
    "name": "[Brand + Model name only, no size/color/stock info]",
    "brand": "[Brand]",
    "specs": "[Key specs: weight, waterproof rating, materials, features]"
  }
]
```

IMPORTANT:
- Return PRODUCT MODELS from manufacturer catalogs, not shopping results
- Ignore size, color, availability, price info
- Focus on technical specs (weight in grams, waterproof rating, materials)
- "Arc'teryx Beta AR Jacket" is correct
- "Arc'teryx Beta AR Jacket XXL Teal - $599" is WRONG

## MODE 2: RECOMMEND (with trip context)

When trip context is provided, return a clear recommendation:

```json
{
  "topPick": {
    "name": "[Full product name]",
    "brand": "[Brand]",
    "reason": "[One sentence: why this is best for THIS specific trip]"
  },
  "alternatives": [
    {
      "name": "[Product name]",
      "brand": "[Brand]",
      "comparison": "[How it differs: lighter/cheaper/warmer/etc]"
    }
  ]
}
```

## REQUIREMENTS

1. **Be opinionated** - Pick ONE clear top recommendation
2. **Trip-specific reasoning** - Reference the actual trail, conditions, grading
3. **Concise** - One sentence reasons, not specs lists
4. **Max 2 alternatives** - Only include meaningfully different options
5. **Comparison not specs** - "200g lighter" not "weighs 350g"
6. **Specs first, always** - Judge gear on actual performance specs, not brand hype
7. **Location as tiebreaker** - When user location is provided and specs are equivalent, prefer brands with local manufacturing/distribution (e.g., Mont in Australia, Icebreaker in NZ, La Sportiva in EU). This reduces shipping cost/time. Never sacrifice quality for locality.
