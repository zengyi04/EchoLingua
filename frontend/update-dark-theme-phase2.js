#!/usr/bin/env node

/**
 * Phase 2: Update specific card and container styles for dark glassmorphism
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');

// Specific patterns to update
const stylePatterns = [
  // Card containers with white backgrounds
  {
    pattern: /backgroundColor:\s*['"]#FFFFFF['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.1)'"
  },
  {
    pattern: /backgroundColor:\s*['"]white['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.08)'"
  },
  {
    pattern: /backgroundColor:\s*['"]#FFF['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.08)'"
  },
  
  // Input backgrounds
  {
    pattern: /backgroundColor:\s*['"]#F5F5F5['"]/gi,
    replacement: "backgroundColor: COLORS.inputBackground"
  },
  
  // Text colors - black to white
  {
    pattern: /color:\s*['"]#000000['"]/gi,
    replacement: "color: COLORS.text"
  },
  {
    pattern: /color:\s*['"]black['"]/gi,
    replacement: "color: COLORS.text"
  },
  
  // Placeholder colors
  {
    pattern: /placeholderTextColor={['"]#999['"]}/gi,
    replacement: "placeholderTextColor={COLORS.textSecondary}"
  },
  {
    pattern: /placeholderTextColor={['"]#666['"]}/gi,
    replacement: "placeholderTextColor={COLORS.textSecondary}"
  },
  {
    pattern: /placeholderTextColor={['"]gray['"]}/gi,
    replacement: "placeholderTextColor={COLORS.textSecondary}"
  },
  
  // Border colors - dark to light
  {
    pattern: /borderColor:\s*['"]#E0E0E0['"]/gi,
    replacement: "borderColor: COLORS.cardBorder"
  },
  {
    pattern: /borderColor:\s*['"]#DDD['"]/gi,
    replacement: "borderColor: COLORS.cardBorder"
  },
  {
    pattern: /borderColor:\s*['"]#CCC['"]/gi,
    replacement: "borderColor: COLORS.cardBorder"
  },
  
  // Light backgrounds to dark glass
  {
    pattern: /backgroundColor:\s*['"]#F0F0F0['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.05)'"
  },
  {
    pattern: /backgroundColor:\s*['"]#F5F5F5['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.05)'"
  },
  {
    pattern: /backgroundColor:\s*['"]#FAFAFA['"]/gi,
    replacement: "backgroundColor: 'rgba(255, 255, 255, 0.05)'"
  },
];

function updateFileStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;
    
    stylePatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
        changeCount += matches.length;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.basename(filePath)} (${changeCount} changes)`);
      return true;
    } else {
      console.log(`⏭️  Skipped ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

console.log('🎨 Phase 2: Refining Dark Glassmorphism Styles...\n');

const files = fs.readdirSync(SCREENS_DIR);
let updatedCount = 0;

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(SCREENS_DIR, file);
    if (updateFileStyles(filePath)) {
      updatedCount++;
    }
  }
});

console.log(`\n✨ Phase 2 complete! ${updatedCount} files refined.`);
