# Gear Search Skill

## PURPOSE

Find ALL matching outdoor gear products. Be exhaustive.

## INPUT

```
Category: "[gear type]"
Query: "[search text]"
```

## OUTPUT

Return up to 10 products as JSON array:

```json
[
  {
    "name": "[Full product name with version and color]",
    "brand": "[Brand]",
    "specs": "[Key specs that differentiate this product]"
  }
]
```

## REQUIREMENTS

1. **Be exhaustive** - Return EVERY matching product you know about.

2. **All variations** - For each product include:
   - Every model in the line
   - Every color option
   - Current version numbers

3. **Full names** - Include brand, model, version, and color in name.

4. **Filter by category** - Only return products matching the category.

5. **Category is broad** - "Footwear" means all shoes/boots. "Rain jacket" means all waterproof shells.

6. **Detailed specs** - Include weight, materials, key features that matter.
