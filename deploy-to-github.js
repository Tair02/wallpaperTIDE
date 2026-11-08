/**
 * Automated GitHub Pages Deployer for Team 4414 Interactive Wallpaper
 * Usage: node deploy-to-github.js <YOUR_GITHUB_TOKEN> [repo_name]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.argv[2] || process.env.GITHUB_TOKEN;
const repoName = process.argv[3] || 'team4414-interactive-wallpaper';

if (!token) {
  console.log('------------------------------------------------------------');
  console.log('GitHub Token required!');
  console.log('Usage: node deploy-to-github.js <YOUR_PERSONAL_ACCESS_TOKEN>');
  console.log('You can generate a token at: https://github.com/settings/tokens (classic, with "repo" scope)');
  console.log('------------------------------------------------------------');
  process.exit(1);
}

function githubRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'User-Agent': 'Node-GitHub-Deployer',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({ status: res.statusCode, data: json });
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '.git' || file === 'node_modules' || file === 'deploy-to-github.js') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await getAllFiles(filePath, baseDir));
    } else {
      results.push({
        relativePath: path.relative(baseDir, filePath).replace(/\\/g, '/'),
        absolutePath: filePath
      });
    }
  }
  return results;
}

async function run() {
  try {
    console.log('1. Checking GitHub authentication...');
    const user = await githubRequest('/user');
    console.log(`Authenticated as: ${user.login}`);

    console.log(`2. Creating/verifying repository "${repoName}"...`);
    let repo;
    try {
      repo = await githubRequest(`/repos/${user.login}/${repoName}`);
      console.log(`Repository already exists at: ${repo.html_url}`);
    } catch (e) {
      repo = await githubRequest('/user/repos', 'POST', {
        name: repoName,
        description: 'Team 4414 HighTide 2026 RIPCURRENT 2K Interactive Wallpaper',
        homepage: `https://${user.login}.github.io/${repoName}/`,
        private: false,
        auto_init: true
      });
      console.log(`Created new repository: ${repo.html_url}`);
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('3. Reading project files...');
    const files = await getAllFiles(__dirname);
    console.log(`Found ${files.length} files to upload.`);

    // Upload files via GitHub API
    for (const f of files) {
      const content = fs.readFileSync(f.absolutePath).toString('base64');
      process.stdout.write(`Uploading: ${f.relativePath}... `);
      
      let sha = null;
      try {
        const existing = await githubRequest(`/repos/${user.login}/${repoName}/contents/${f.relativePath}`);
        sha = existing.sha;
      } catch (e) {}

      await githubRequest(`/repos/${user.login}/${repoName}/contents/${f.relativePath}`, 'PUT', {
        message: `Deploy: ${f.relativePath}`,
        content: content,
        sha: sha || undefined
      });
      console.log('OK');
    }

    console.log('4. Enabling GitHub Pages...');
    try {
      await githubRequest(`/repos/${user.login}/${repoName}/pages`, 'POST', {
        source: { branch: 'main', path: '/' }
      });
      console.log('GitHub Pages enabled!');
    } catch (e) {
      console.log('Pages already configured or requires GitHub Actions.');
    }

    const pagesUrl = `https://${user.login}.github.io/${repoName}/`;
    console.log('========================================================');
    console.log('SUCCESSFULLY HOSTED ON GITHUB PAGES!');
    console.log(`Repository: ${repo.html_url}`);
    console.log(`Live Website: ${pagesUrl}`);
    console.log('========================================================');
  } catch (err) {
    console.error('Error during deployment:', err);
  }
}

run();
