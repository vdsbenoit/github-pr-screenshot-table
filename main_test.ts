import { assertEquals } from "@std/assert";

// Test helper functions (we'll extract these from main.ts for testing)
function parseImages(htmlContent: string): Array<{alt: string, src: string, category: string, timing: 'before' | 'after'}> {
  const imgRegex = /<img[^>]+>/gi;
  const images: Array<{alt: string, src: string, category: string, timing: 'before' | 'after'}> = [];
  
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgTag = match[0];
    
    const altMatch = imgTag.match(/alt="([^"]+)"/i);
    const alt = altMatch ? altMatch[1] : '';
    
    const srcMatch = imgTag.match(/src="([^"]+)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    
    if (alt && src) {
      const parts = alt.split('_');
      if (parts.length >= 2) {
        const timing = parts[parts.length - 1].toLowerCase() as 'before' | 'after';
        const category = parts.slice(0, -1).join('_');
        
        if (timing === 'before' || timing === 'after') {
          images.push({
            alt,
            src,
            category,
            timing
          });
        }
      }
    }
  }
  
  return images;
}

function formatCategoryTitle(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

Deno.test("parseImages should extract image information correctly", () => {
  const htmlInput = `
    <img width="1170" height="2532" alt="tab_before" src="https://github.com/user-attachments/assets/b03fe17f-a129-4221-8162" />
    <img width="1170" height="2532" alt="sign_before" src="https://github.com/user-attachments/assets/66bf5573-ae4c-44aa-82ac" />
    <img width="1170" height="2532" alt="sign_after" src="https://github.com/user-attachments/assets/254ea76a-11db-4634-a187" />
    <img width="1170" height="2532" alt="tab_after" src="https://github.com/user-attachments/assets/51a73703-7fcd-41a7-965c" />
  `;
  
  const images = parseImages(htmlInput);
  
  assertEquals(images.length, 4);
  assertEquals(images[0].category, "tab");
  assertEquals(images[0].timing, "before");
  assertEquals(images[1].category, "sign");
  assertEquals(images[1].timing, "before");
  assertEquals(images[2].category, "sign");
  assertEquals(images[2].timing, "after");
  assertEquals(images[3].category, "tab");
  assertEquals(images[3].timing, "after");
});

Deno.test("formatCategoryTitle should format titles correctly", () => {
  assertEquals(formatCategoryTitle("tab"), "Tab");
  assertEquals(formatCategoryTitle("sign"), "Sign");
  assertEquals(formatCategoryTitle("my_long_category"), "My Long Category");
});
