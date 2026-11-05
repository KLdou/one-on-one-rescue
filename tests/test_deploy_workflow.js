const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function runTests() {
  const workflowPath = path.resolve(__dirname, '../.github/workflows/deploy.yml');

  console.log('--- Step 1: Checking workflow file existence ---');
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow file not found at ${workflowPath}`);
  }
  const content = fs.readFileSync(workflowPath, 'utf8');

  console.log('--- Step 2: Validating YAML format constraints ---');
  if (content.includes('\t')) {
    throw new Error('YAML file contains tab characters. Tabs are forbidden in YAML.');
  }

  const expectedPatterns = [
    { pattern: /name:\s*Deploy Game to GitHub Pages/, name: 'Workflow name' },
    { pattern: /on:\s+push:\s+branches:\s+-\s*master/m, name: 'Push to master trigger' },
    { pattern: /workflow_dispatch:/, name: 'Workflow dispatch trigger' },
    { pattern: /permissions:\s+contents:\s*read\s+pages:\s*write\s+id-token:\s*write/m, name: 'Permissions (contents: read, pages: write, id-token: write)' },
    { pattern: /concurrency:\s+group:\s*["']pages["']\s+cancel-in-progress:\s*false/m, name: 'Concurrency configuration' },
    { pattern: /build-and-deploy:/, name: 'Job build-and-deploy' },
    { pattern: /uses:\s*actions\/checkout@v4/, name: 'actions/checkout@v4' },
    { pattern: /node --check/, name: 'node --check sanity step' },
    { pattern: /uses:\s*actions\/configure-pages@v5/, name: 'actions/configure-pages@v5' },
    { pattern: /uses:\s*actions\/upload-pages-artifact@v3/, name: 'actions/upload-pages-artifact@v3' },
    { pattern: /path:\s*['"]\.\/game_modular['"]/, name: 'Artifact path ./game_modular' },
    { pattern: /uses:\s*actions\/deploy-pages@v4/, name: 'actions/deploy-pages@v4' }
  ];

  for (const { pattern, name } of expectedPatterns) {
    if (!pattern.test(content)) {
      throw new Error(`Workflow file failed assertion: Missing ${name}`);
    }
    console.log(`✓ Passed: ${name}`);
  }

  console.log('--- Step 3: Simulating CI Sanity Check (JS & JSON) ---');
  const jsDir = path.resolve(__dirname, '../game_modular/js');
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
  if (jsFiles.length === 0) {
    throw new Error('No JS files found in game_modular/js');
  }

  for (const file of jsFiles) {
    const fullPath = path.join(jsDir, file);
    execFileSync(process.execPath, ['--check', fullPath], { stdio: 'inherit' });
    console.log(`✓ JS syntax valid: ${file}`);
  }

  const dataDir = path.resolve(__dirname, '../game_modular/data');
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    throw new Error('No JSON files found in game_modular/data');
  }

  for (const file of jsonFiles) {
    const fullPath = path.join(dataDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    JSON.parse(raw);
    console.log(`✓ JSON parse valid: ${file}`);
  }

  console.log('\nAll workflow checks and CI simulations PASSED successfully.');
}

runTests();
