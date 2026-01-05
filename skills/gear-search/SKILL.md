# Gear Search Skill

## MODE 1: SEARCH (no trip context)

Search for PRODUCT MODELS (not retailer inventory). Return the product line, not specific sizes/stock.

Example: "Arc'teryx Beta AR Jacket" NOT "Arc'teryx Beta AR Jacket XL Black - In Stock"

Return as JSON object with results array:

```json
{
  "results": [
    {
    "name": "[Brand + Model name only, no size/color/stock info]",
    "brand": "[Brand]",
    "category": "[Manufacturer's category, e.g. 'Footwear', 'Shell Jackets', 'Insulated Jackets', 'Harnesses']",
    "subcategory": "[Activity/use if provided, e.g. 'Run', 'Alpine', 'Trail']",
    "gender": "[Manufacturer's classification: 'Men', 'Women', 'Unisex', or null if not specified]",
    "specs": "[Key specs: weight, waterproof rating, materials, features]",
    "imageUrl": "[Product image URL from manufacturer's website, or null if not found]",
    "description": "[Manufacturer's product description, 1-2 sentences]",
    "productUrl": "[URL to manufacturer's product page]",
    "reviews": [
      {
        "source": "[Review site name]",
        "url": "[Direct URL to the review article]",
        "rating": "[Rating if available, e.g. '4.5/5' or 'Editor's Choice']"
        }
      ]
    }
  ]
}
```

SEARCH RULES:
1. Return PRODUCT MODELS from manufacturer catalogs, not shopping results
2. Base/standard model FIRST - "Beta AR" before "Beta AR Pro" or "Beta LT"
3. Include Men's and Women's versions as separate entries if both exist
4. Ignore size, color, availability, price info
5. "Arc'teryx Beta AR Jacket" is correct
6. "Arc'teryx Beta AR Jacket XXL Teal - $599" is WRONG

REQUIRED FIELDS (always include):
- **name**: Brand + Model (e.g. "Arc'teryx Beta AR Jacket")
- **brand**: Manufacturer name
- **category**: From manufacturer's site (e.g. "Shell Jackets", "Footwear")
- **gender**: "Men", "Women", or "Unisex"
- **specs**: Weight, materials, waterproof rating, key features
- **description**: 1-2 sentence product description from manufacturer

IMAGE URL (CRITICAL - must be actual image file):
- Must be a DIRECT IMAGE FILE URL ending in .jpg, .png, .webp, or containing /images/
- Example CORRECT: "https://images.arcteryx.com/F23/450x500/Norvan-LD-3-Shoe.jpg"
- Example WRONG: "https://arcteryx.com/us/en/shop/mens/norvan-ld-3-shoe" (this is a page, not an image)
- Find the actual product image by inspecting the page source
- REI images: "https://www.rei.com/media/product/123456.jpg"
- Backcountry: "https://content.backcountry.com/images/items/900/ARC/ARC1234/MAIN.jpg"
- Do NOT return product page URLs - only image file URLs that can be loaded in an <img> tag

REVIEWS:
- DO NOT include external reviews - always return an empty array []
- User reviews are the source of truth in this system
- The app collects reviews directly from users who own and have tested the gear

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
