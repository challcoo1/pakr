# Gear Search Skill

## PURPOSE

Search for outdoor gear products matching the user's query. Return detailed product information.

## INPUT

```
Category: "[gear type the user needs]"
Query: "[user's search text]"
```

## OUTPUT

Return matching products as JSON array:

```json
[
  {
    "name": "[Full product name including brand, model, version, color]",
    "brand": "[Brand/Manufacturer]",
    "specs": "[Key differentiating specs: weight, materials, features]"
  }
]
```

## REQUIREMENTS

1. **Full product names** - Include brand, model, version number, and color variant
2. **All variations** - Return different models, colors, and versions
3. **Detailed specs** - Weight, materials, waterproofing, key features
4. **Filter by category** - Only return products matching the category type
5. **Current products** - Use latest versions and current colorways
