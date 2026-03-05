#!/usr/bin/env node

/**
 * Phase 3: Fix remaining hardcoded rgba backgrounds in feature screens
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'CommunityStoryScreen.js',
  'ProgressTrackerScreen.js', 
  'CulturalEventsScreen.js',
  'DictionaryScreen.js',
  'CulturalKnowledgeScreen.js',
  'FamilyLearningScreen.js'
];

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');

function fixFile(fileName) {
  const filePath = path.join(SCREENS_DIR, fileName);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Replace all rgba(255,255,255,X) patterns
    const replacements = [
      // High opacity (0.9-0.95) -> glassLight
      { from: /backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.95\)['"]/gi, to: "backgroundColor: 'rgba(255, 255, 255, 0.1)'" },
      { from: /backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.9\)['"]/gi, to: "backgroundColor: 'rgba(255, 255, 255, 0.1)'" },
      
      // Medium opacity (0.8-0.85) -> glassMedium  
      { from: /backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.85\)['"]/gi, to: "backgroundColor: 'rgba(255, 255, 255, 0.08)'" },
      { from: /backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.8\)['"]/gi, to: "backgroundColor: 'rgba(255, 255, 255, 0.08)'" },
      
      // Lower opacity (0.7) -> glassMedium
      { from: /backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.7\)['"]/gi, to: "backgroundColor: 'rgba(255, 255, 255, 0.08)'" },
    ];
    
    replacements.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        changes += matches.length;
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${fileName} (${changes} changes)`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${fileName}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error: ${fileName} - ${error.message}`);
    return false;
  }
}

console.log('🎨 Phase 3: Fixing remaining rgba backgrounds...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Phase 3 complete! Fixed ${fixedCount} files.`);
