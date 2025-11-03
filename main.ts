interface ImageInfo {
  alt: string;
  src: string;
  category: string;
  timing: 'before' | 'after' | 'standalone';
}

/**
 * Checks if the app is running from the app bundle
 */
function isRunningFromApp(): boolean {
  const execPath = Deno.execPath();
  return execPath.includes('.app/') || Deno.args.includes('--app-mode');
}

/**
 * Shows a macOS dialog using osascript
 */
async function showDialog(message: string, title: string = "Screenshot Table", type: 'info' | 'error' = 'info'): Promise<void> {
  if (!isRunningFromApp()) {
    console.log(`${type === 'error' ? '❌' : '✅'} ${title}: ${message}`);
    return;
  }

  const iconType = type === 'error' ? 'stop' : 'note';
  const script = `display dialog "${message.replace(/"/g, '\\"')}" with title "${title}" buttons {"OK"} default button "OK" with icon ${iconType}`;
  
  const process = new Deno.Command("osascript", {
    args: ["-e", script],
    stdout: "piped",
    stderr: "piped"
  });
  
  await process.output();
}

/**
 * Shows a progress notification
 */
async function showProgress(message: string): Promise<void> {
  if (!isRunningFromApp()) {
    console.log(message);
    return;
  }

  const script = `display notification "${message.replace(/"/g, '\\"')}" with title "Screenshot Table"`;
  
  const process = new Deno.Command("osascript", {
    args: ["-e", script],
    stdout: "piped",
    stderr: "piped"
  });
  
  await process.output();
}

/**
 * Reads HTML content from the clipboard
 */
async function readClipboard(): Promise<string> {
  const process = new Deno.Command("pbpaste", {
    stdout: "piped",
    stderr: "piped"
  });
  
  const output = await process.output();
  
  if (!output.success) {
    throw new Error("Failed to read clipboard");
  }
  
  return new TextDecoder().decode(output.stdout);
}

/**
 * Writes content to the clipboard
 */
async function writeClipboard(content: string): Promise<void> {
  const process = new Deno.Command("pbcopy", {
    stdin: "piped",
    stdout: "piped",
    stderr: "piped"
  });
  
  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(content));
  await writer.close();
  
  const output = await child.output();
  
  if (!output.success) {
    throw new Error("Failed to write to clipboard");
  }
}

/**
 * Parses HTML content and extracts image information
 */
function parseImages(htmlContent: string): ImageInfo[] {
  const imgRegex = /<img[^>]+>/gi;
  const images: ImageInfo[] = [];
  
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgTag = match[0];
    
    // Extract alt attribute
    const altMatch = imgTag.match(/alt="([^"]+)"/i);
    const alt = altMatch ? altMatch[1] : '';
    
    // Extract src attribute
    const srcMatch = imgTag.match(/src="([^"]+)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    
    if (alt && src) {
      // Parse alt to extract category and timing
      const parts = alt.split('_');
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1].toLowerCase();
        if (lastPart === 'before' || lastPart === 'after') {
          const timing = lastPart as 'before' | 'after';
          const category = parts.slice(0, -1).join('_');
          
          images.push({
            alt,
            src,
            category,
            timing
          });
        } else {
          // This is a standalone image (doesn't end with before/after)
          images.push({
            alt,
            src,
            category: alt, // Use the entire alt text as category for standalone images
            timing: 'standalone'
          });
        }
      } else {
        // Single word alt text - treat as standalone
        images.push({
          alt,
          src,
          category: alt,
          timing: 'standalone'
        });
      }
    }
  }
  
  return images;
}

/**
 * Groups images by category and creates table rows
 */
function groupImagesByCategory(images: ImageInfo[]): { 
  standaloneImages: ImageInfo[];
  pairedGroups: Map<string, { before?: ImageInfo; after?: ImageInfo }>;
} {
  const standaloneImages: ImageInfo[] = [];
  const pairedGroups = new Map<string, { before?: ImageInfo; after?: ImageInfo }>();
  
  for (const image of images) {
    if (image.timing === 'standalone') {
      standaloneImages.push(image);
    } else {
      if (!pairedGroups.has(image.category)) {
        pairedGroups.set(image.category, {});
      }
      
      const group = pairedGroups.get(image.category)!;
      group[image.timing] = image;
    }
  }
  
  return { standaloneImages, pairedGroups };
}

/**
 * Converts category name to proper title case
 */
function formatCategoryTitle(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates HTML table from grouped images
 */
function generateTable(standaloneImages: ImageInfo[], pairedGroups: Map<string, { before?: ImageInfo; after?: ImageInfo }>): string {
  let tableHtml = '<table>\n';
  
  // First, add standalone images (max 2 per row)
  if (standaloneImages.length > 0) {
    for (let i = 0; i < standaloneImages.length; i += 2) {
      tableHtml += '  <tr>\n';
      
      // First image in the row
      const image1 = standaloneImages[i];
      const title1 = formatCategoryTitle(image1.category);
      tableHtml += `    <th>${title1}</th>\n`;
      
      // Second image in the row (if exists)
      if (i + 1 < standaloneImages.length) {
        const image2 = standaloneImages[i + 1];
        const title2 = formatCategoryTitle(image2.category);
        tableHtml += `    <th>${title2}</th>\n`;
      } else {
        tableHtml += '    <th></th>\n';
      }
      
      tableHtml += '  </tr>\n';
      
      // Add image row
      tableHtml += '  <tr>\n';
      tableHtml += `    <td><img src="${image1.src}" width="400"></td>\n`;
      
      if (i + 1 < standaloneImages.length) {
        const image2 = standaloneImages[i + 1];
        tableHtml += `    <td><img src="${image2.src}" width="400"></td>\n`;
      } else {
        tableHtml += '    <td></td>\n';
      }
      
      tableHtml += '  </tr>\n';
    }
  }
  
  // Then, add paired groups (before/after)
  for (const [category, group] of pairedGroups) {
    const categoryTitle = formatCategoryTitle(category);
    
    // Add header row
    tableHtml += '  <tr>\n';
    tableHtml += `    <th>${categoryTitle} Before</th>\n`;
    tableHtml += `    <th>${categoryTitle} After</th>\n`;
    tableHtml += '  </tr>\n';
    
    // Add image row
    tableHtml += '  <tr>\n';
    
    if (group.before) {
      tableHtml += `    <td><img src="${group.before.src}" width="400"></td>\n`;
    } else {
      tableHtml += '    <td></td>\n';
    }
    
    if (group.after) {
      tableHtml += `    <td><img src="${group.after.src}" width="400"></td>\n`;
    } else {
      tableHtml += '    <td></td>\n';
    }
    
    tableHtml += '  </tr>\n';
  }
  
  tableHtml += '</table>';
  
  return tableHtml;
}

/**
 * Main function that orchestrates the clipboard conversion
 */
async function convertClipboard(): Promise<void> {
  try {
    await showProgress("Reading clipboard content...");
    const clipboardContent = await readClipboard();
    
    if (!clipboardContent.trim()) {
      await showDialog("Clipboard is empty. Please copy some HTML content with image tags first.", "No Content", 'error');
      return;
    }
    
    await showProgress("Parsing images...");
    const images = parseImages(clipboardContent);
    
    if (images.length === 0) {
      await showDialog("No valid images found in clipboard content. Make sure your HTML contains img tags with alt attributes.", "No Images Found", 'error');
      return;
    }
    
    await showProgress(`Found ${images.length} images, grouping by category...`);
    const { standaloneImages, pairedGroups } = groupImagesByCategory(images);
    
    await showProgress("Generating table...");
    const tableHtml = generateTable(standaloneImages, pairedGroups);
    
    await showProgress("Writing result to clipboard...");
    await writeClipboard(tableHtml);
    
    const totalCategories = standaloneImages.length + pairedGroups.size;
    await showDialog(`Successfully converted clipboard content to table format!\nProcessed ${totalCategories} categories with ${images.length} images.`, "Success");
    
    // If running from app, we can exit cleanly
    if (isRunningFromApp()) {
      Deno.exit(0);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await showDialog(`An error occurred: ${errorMessage}`, "Error", 'error');
    
    if (isRunningFromApp()) {
      Deno.exit(1);
    } else {
      console.error("❌ Error:", errorMessage);
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  await convertClipboard();
}
