import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const CONFIG = {
  // Uses current working directory if run from root, or hardcodes your workspace root
  projectRoot: 'Q:/YourZeroesAndOnes/cureli/curely_erp',
  
  // Target directories relative to projectRoot
  targets: [
    'backend/src',
    'cadmin-web/src',
    'pharmacy-web/src'
  ],
  
  // Directories/files to skip entirely
  ignore: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'generated',
    'uploads',
    'static',
    'assets'
  ]
};

// Comment style mapper
const COMMENT_MAP = {
  // Slashes
  '.js': { start: '// ', end: '' },
  '.jsx': { start: '// ', end: '' },
  '.ts': { start: '// ', end: '' },
  '.tsx': { start: '// ', end: '' },
  '.mjs': { start: '// ', end: '' },
  '.cjs': { start: '// ', end: '' },
  '.prisma': { start: '// ', end: '' },
  // Block Comments
  '.css': { start: '/* ', end: ' */' },
  '.scss': { start: '/* ', end: ' */' },
  '.sass': { start: '/* ', end: ' */' },
  '.less': { start: '/* ', end: ' */' },
  // Markup / Docs
  '.html': { start: '<!-- ', end: ' -->' },
  '.xml': { start: '<!-- ', end: ' -->' },
  '.md': { start: '<!-- ', end: ' -->' },
  '.svg': { start: '<!-- ', end: ' -->' },
  '.vue': { start: '<!-- ', end: ' -->' },
  // Hashes
  '.env': { start: '# ', end: '' },
  '.yml': { start: '# ', end: '' },
  '.yaml': { start: '# ', end: '' },
  '.py': { start: '# ', end: '' },
  '.sh': { start: '# ', end: '' },
  '.gitignore': { start: '# ', end: '' },
};

// Helper to determine path formats and match comments
function getCommentSyntax(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  if (COMMENT_MAP[ext]) return COMMENT_MAP[ext];
  
  const basename = path.basename(filepath).toLowerCase();
  // Catch dynamically resolved files like .env.production, .env.local
  if (basename.startsWith('.env')) {
    return { start: '# ', end: '' };
  }
  if (basename === 'dockerfile') {
    return { start: '# ', end: '' };
  }
  return null; // Skip unsupported extensions (protects binary files, JSONs, etc.)
}

// Check for command line flags (like --dry-run)
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

if (isDryRun) {
  console.log('\x1b[33m%s\x1b[0m', '✨ Running in DRY-RUN mode. No files will be modified. ✨\n');
}

// Convert absolute to relative path (and enforce uniform forward slashes)
function getRelativePath(absolutePath) {
  const relative = path.relative(CONFIG.projectRoot, absolutePath);
  return relative.split(path.sep).join('/');
}

// Recursive directory scan
function getFilesRecursively(dir) {
  let filesList = [];
  if (!fs.existsSync(dir)) {
    console.warn(`\x1b[33mWarning: Directory not found: ${dir}\x1b[0m`);
    return filesList;
  }

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (CONFIG.ignore.includes(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      filesList = filesList.concat(getFilesRecursively(fullPath));
    } else {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

function processFile(filePath) {
  const relativePath = getRelativePath(filePath);
  const syntax = getCommentSyntax(filePath);

  // If file extension has no supported comment style, skip it
  if (!syntax) {
    return { status: 'skipped', reason: 'unsupported file type' };
  }

  let fileContent = '';
  try {
    fileContent = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return { status: 'error', reason: `could not read file: ${error.message}` };
  }

  const lines = fileContent.split(/\r?\n/);
  
  // Search for and remove existing target path comments within the first 5 lines
  let commentRemoved = false;
  let linesToKeep = [...lines];
  
  for (let i = 0; i < Math.min(5, linesToKeep.length); i++) {
    if (linesToKeep[i].includes('(do not remove this comment)')) {
      linesToKeep.splice(i, 1);
      commentRemoved = true;
      break; // Remove only the first matched line
    }
  }

  // Construct our safe comment line
  const newComment = `${syntax.start}${relativePath} (do not remove this comment)${syntax.end}`;

  // Find correct insertion index (if file starts with shebang, put comment on line 2)
  let insertIndex = 0;
  if (linesToKeep[0] && linesToKeep[0].startsWith('#!')) {
    insertIndex = 1;
  }

  linesToKeep.splice(insertIndex, 0, newComment);
  const updatedContent = linesToKeep.join('\n');

  if (!isDryRun) {
    try {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
    } catch (error) {
      return { status: 'error', reason: `could not write file: ${error.message}` };
    }
  }

  return { 
    status: 'success', 
    action: commentRemoved ? 'updated comment' : 'added comment',
    path: relativePath 
  };
}

// --- Main execution block ---
function run() {
  console.log(`🚀 Starting comment scanner inside: ${CONFIG.projectRoot}\n`);
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const targetDir of CONFIG.targets) {
    const targetFullPath = path.join(CONFIG.projectRoot, targetDir);
    console.log(`📂 Scanning directory: \x1b[36m${targetDir}\x1b[0m`);
    
    const files = getFilesRecursively(targetFullPath);
    
    for (const file of files) {
      const result = processFile(file);
      
      if (result.status === 'success') {
        totalProcessed++;
        totalUpdated++;
        console.log(`  \x1b[32m✔\x1b[0m [${result.action.toUpperCase()}] ${result.path}`);
      } else if (result.status === 'error') {
        totalErrors++;
        console.log(`  \x1b[31m✖\x1b[0m [ERROR] ${getRelativePath(file)}: ${result.reason}`);
      }
    }
  }

  console.log(`\n\x1b[32m%s\x1b[0m`, `🏁 Done! Processed files: ${totalProcessed} | Errors encountered: ${totalErrors}`);
}

run();