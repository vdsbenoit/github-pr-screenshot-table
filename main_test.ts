import { assertEquals } from "@std/assert";

// Test helper function for filename parsing
function parseFilename(filename: string): {
  order: number;
  featureNumber: string;
  timing: 'before' | 'after' | 'standalone';
  formattedAlt: string;
} {
  // Remove number prefix (e.g., "1.", "2.", "3 ", "4")
  const prefixMatch = filename.match(/^(\d+)\.?\s*/);
  const order = prefixMatch ? parseInt(prefixMatch[1]) : 0;
  const withoutPrefix = filename.replace(/^\d+\.?\s*/, '');
  
  // Check for timing suffix
  const parts = withoutPrefix.split('_');
  let timing: 'before' | 'after' | 'standalone' = 'standalone';
  let contentParts = parts;
  
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].toLowerCase();
    if (lastPart === 'before' || lastPart === 'after') {
      timing = lastPart as 'before' | 'after';
      contentParts = parts.slice(0, -1);
    }
  }
  
  // Extract feature number from the content
  const content = contentParts.join('_');
  // Look for "feature" followed by a number (with optional space or underscore)
  const featureMatch = content.match(/[Ff]eature[\s_]*(\d+)/i) || 
                      (content.match(/^[Ff]eature(\d+)$/i)) ||
                      (order > 0 && content.match(/^(\d+)$/)); // Only treat standalone numbers as features if there was a prefix order
  const featureNumber = featureMatch ? featureMatch[1] : '';
  
  // Format the alt text
  const formattedAlt = featureNumber ? `Feature ${featureNumber}` : content.replace(/_/g, ' ').trim();
  
  return {
    order,
    featureNumber,
    timing,
    formattedAlt
  };
}

// Test parseFilename function
Deno.test("parseFilename - handles various filename formats", () => {
  // Test case 1: "1. Feature_1_before"
  const result1 = parseFilename("1. Feature_1_before");
  assertEquals(result1.order, 1);
  assertEquals(result1.featureNumber, "1");
  assertEquals(result1.timing, "before");
  assertEquals(result1.formattedAlt, "Feature 1");
  
  // Test case 2: "2.Feature 25_before"
  const result2 = parseFilename("2.Feature 25_before");
  assertEquals(result2.order, 2);
  assertEquals(result2.featureNumber, "25");
  assertEquals(result2.timing, "before");
  assertEquals(result2.formattedAlt, "Feature 25");
  
  // Test case 3: "3 Feature 32"
  const result3 = parseFilename("3 Feature 32");
  assertEquals(result3.order, 3);
  assertEquals(result3.featureNumber, "32");
  assertEquals(result3.timing, "standalone");
  assertEquals(result3.formattedAlt, "Feature 32");
  
  // Test case 4: "4feature54_after"
  const result4 = parseFilename("4feature54_after");
  assertEquals(result4.order, 4);
  assertEquals(result4.featureNumber, "54");
  assertEquals(result4.timing, "after");
  assertEquals(result4.formattedAlt, "Feature 54");
});

// Test helper functions (updated version)
function parseImages(htmlContent: string): Array<{alt: string, src: string, category: string, timing: 'before' | 'after' | 'standalone', order: number}> {
  const imgRegex = /<img[^>]+>/gi;
  const images: Array<{alt: string, src: string, category: string, timing: 'before' | 'after' | 'standalone', order: number}> = [];
  
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgTag = match[0];
    
    const altMatch = imgTag.match(/alt="([^"]+)"/i);
    const originalAlt = altMatch ? altMatch[1] : '';
    
    const srcMatch = imgTag.match(/src="([^"]+)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    
    if (originalAlt && src) {
      const parsed = parseFilename(originalAlt);
      
      images.push({
        alt: parsed.formattedAlt,
        src,
        category: parsed.formattedAlt,
        timing: parsed.timing,
        order: parsed.order
      });
    }
  }
  
  // Sort by the original order from filename prefixes
  images.sort((a, b) => a.order - b.order);
  
  return images;
}

function formatCategoryTitle(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

Deno.test("parseImages should extract image information correctly with number prefixes", () => {
  const htmlInput = `
    <img width="1170" height="2532" alt="1. Feature_1_before" src="https://github.com/user-attachments/assets/1.jpg" />
    <img width="1170" height="2532" alt="2.Feature 25_before" src="https://github.com/user-attachments/assets/2.jpg" />
    <img width="1170" height="2532" alt="3 Feature 32" src="https://github.com/user-attachments/assets/3.jpg" />
    <img width="1170" height="2532" alt="4feature54_after" src="https://github.com/user-attachments/assets/4.jpg" />
  `;
  
  const images = parseImages(htmlInput);
  
  assertEquals(images.length, 4);
  
  // Check that images are ordered correctly
  assertEquals(images[0].order, 1);
  assertEquals(images[0].alt, "Feature 1");
  assertEquals(images[0].timing, "before");
  
  assertEquals(images[1].order, 2);
  assertEquals(images[1].alt, "Feature 25");
  assertEquals(images[1].timing, "before");
  
  assertEquals(images[2].order, 3);
  assertEquals(images[2].alt, "Feature 32");
  assertEquals(images[2].timing, "standalone");
  
  assertEquals(images[3].order, 4);
  assertEquals(images[3].alt, "Feature 54");
  assertEquals(images[3].timing, "after");
});

Deno.test("formatCategoryTitle should format titles correctly", () => {
  assertEquals(formatCategoryTitle("Feature 1"), "Feature 1");
  assertEquals(formatCategoryTitle("Feature 25"), "Feature 25");
  assertEquals(formatCategoryTitle("my_long_category"), "My Long Category");
});

Deno.test("parseImages should handle images without number prefixes", () => {
  const htmlInput = `
    <img alt="standalone1" src="https://example.com/img1.jpg" />
    <img alt="category_before" src="https://example.com/img3.jpg" />
    <img alt="category_after" src="https://example.com/img4.jpg" />
  `;
  
  const images = parseImages(htmlInput);
  
  assertEquals(images.length, 3);
  
  // Images without number prefixes should have order 0
  assertEquals(images[0].order, 0);
  assertEquals(images[0].alt, "standalone1");
  assertEquals(images[0].timing, "standalone");
  
  assertEquals(images[1].order, 0);
  assertEquals(images[1].alt, "category");
  assertEquals(images[1].timing, "before");
  
  assertEquals(images[2].order, 0);
  assertEquals(images[2].alt, "category");
  assertEquals(images[2].timing, "after");
});
