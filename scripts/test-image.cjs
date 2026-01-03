// Test fetching an image and converting to base64

async function testFetch(url) {
  console.log('Fetching:', url);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Status:', response.status);
    if (!response.ok) {
      console.log('Failed!');
      return;
    }
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    console.log('Base64 length:', base64.length);
    console.log('Preview:', `data:${contentType};base64,${base64.substring(0, 50)}...`);
  } catch (e) {
    console.log('Error:', e.message);
  }
}

// Test Arc'teryx (likely blocked)
testFetch('https://images.arcteryx.com/F23/450x500/Norvan-LD-3-Shoe.jpg')
  .then(() => console.log('\n---\n'))
  // Test REI (should work)
  .then(() => testFetch('https://www.rei.com/media/b61d1f73-2a1c-4b85-9c66-8e6a0ccfa625.jpg'));
