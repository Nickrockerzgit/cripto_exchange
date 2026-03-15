// Script to replace all PrismaClient instances with singleton
// Run this with: node fix-prisma.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'src/controllers/adminAuthController.js',
  'src/controllers/adminDeposit.controller.js',
  'src/controllers/adminTransaction.controller.js',
  'src/controllers/deposit.controller.js',
  'src/controllers/refralsControllers.js',
  'src/controllers/robot.controller.js',
  'src/controllers/userController.js',
  'src/services/transfer.service.js',
  'src/services/user.service.js',
  'src/services/blockchain/depositScanner.service.js',
  'src/services/blockchain/robotActivation.service.js',
];

const patterns = [
  {
    old: /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]\s*;?\n\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\)\s*;?/g,
    new: "import prisma from '../config/prisma.js';"
  },
  {
    old: /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]\s*;?\n+const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\)\s*;?/g,
    new: "import prisma from '../config/prisma.js';"
  },
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Determine import path based on file location
    const depth = file.split('/').length - 2; // -2 for src/ and filename
    const importPath = depth > 1 ? '../../config/prisma.js' : '../config/prisma.js';
    
    patterns.forEach(pattern => {
      if (pattern.old.test(content)) {
        content = content.replace(pattern.old, `import prisma from '${importPath}';`);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⏭️  Skipped (no changes needed): ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✅ All files processed!');
