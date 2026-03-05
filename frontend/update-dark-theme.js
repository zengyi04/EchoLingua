#!/usr/bin/env node

/**
 * Script to update all screen files to use dark glassmorphism theme
 * 
 * Changes:
 * - Background: #F9F7F2 → #0F172A (dark navy)
 * - Surface: #FFFFFF → #1E293B (lighter navy)
 * - Text: #1B4332 → #F1F5F9 (light)
 * - TextSecondary: #52796F → #94A3B8 (muted light)
 * - Glass containers: rgba(255,255,255,0.7-0.95) → rgba(255,255,255,0.08-0.15)
 * - Borders: rgba(0,0,0,0.06) → rgba(255,255,255,0.1)
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');
const NAVIGATION_DIR = path.join(__dirname, 'src', 'navigation');

// Color mappings from light to dark
const colorReplacements = [
  // Background colors
  { from: "backgroundColor: '#F9F7F2'", to: "backgroundColor: '#0F172A'" },
  { from: "backgroundColor: '#F8F9FA'", to: "backgroundColor: '#0F172A'" },
  { from: "backgroundColor: COLORS.background", to: "backgroundColor: COLORS.background" }, // Already updated in theme
  
  // Surface colors  
  { from: "backgroundColor: '#FFFFFF'", to: "backgroundColor: COLORS.surface" },
  { from: "backgroundColor: 'white'", to: "backgroundColor: COLORS.surface" },
  { from: "backgroundColor: COLORS.surface", to: "backgroundColor: COLORS.surface" }, // Already updated
  
  // Glass backgrounds
  { from: "'rgba(255, 255, 255, 0.95)'", to: "COLORS.glassLight" },
  { from: "'rgba(255, 255, 255, 0.9)'", to: "COLORS.glassLight" },
  { from: "'rgba(255, 255, 255, 0.85)'", to: "COLORS.glassMedium" },
  { from: "'rgba(255, 255, 255, 0.8)'", to: "COLORS.glassMedium" },
  { from: "'rgba(255, 255, 255, 0.7)'", to: "COLORS.glassMedium" },
  { from: "COLORS.glassLight", to: "COLORS.glassLight" }, // Already in dark theme
  
  // Borders
  { from: "'rgba(0, 0, 0, 0.06)'", to: "COLORS.cardBorder" },
  { from: "'rgba(0, 0, 0, 0.08)'", to: "COLORS.cardBorder" },
  { from: "'rgba(0, 0, 0, 0.1)'", to: "COLORS.cardBorder" },
];

// Text color replacements - need to be more careful
const textColorFixes = [
  { from: "color: '#1B4332'", to: "color: COLORS.text" },
  { from: "color: '#000'", to: "color: COLORS.text" },
  { from: "color: '#333'", to: "color: COLORS.text" },
  { from: "color: COLORS.text", to: "color: COLORS.text" }, // Already updated
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply color replacements
    colorReplacements.forEach(({ from, to }) => {
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.match(regex)) {
        content = content.replace(regex, to);
        modified = true;
      }
    });
    
    // Apply text color fixes
    textColorFixes.forEach(({ from, to }) => {
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.match(regex)) {
        content = content.replace(regex, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⏭️  Skipped: ${path.basename(filePath)} (no changes needed)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && file.endsWith('.js')) {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

console.log('🎨 Starting Dark Glassmorphism Theme Update...\n');

console.log('📂 Processing Screens...');
const screensUpdated = processDirectory(SCREENS_DIR);

console.log('\n📂 Processing Navigation...');
const navUpdated = processDirectory(NAVIGATION_DIR);

console.log(`\n✨ Theme update complete!`);
console.log(`   Files updated: ${screensUpdated + navUpdated}`);
console.log(`   Ready to test! 🚀\n`);
