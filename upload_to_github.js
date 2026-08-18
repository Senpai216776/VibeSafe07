import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from '@octokit/rest';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('🚀 VibeSafe Automatic GitHub Uploader');
  console.log('======================================================\n');

  console.log('To upload your files automatically, you need a GitHub Token:');
  console.log('👉 Create one in 10 seconds at: https://github.com/settings/tokens/new');
  console.log('   (Check the "repo" box and click "Generate token")\n');

  const token = await askQuestion('🔑 Enter your GitHub Personal Access Token: ');
  if (!token.trim()) {
    console.log('❌ Token required. Exiting.');
    rl.close();
    return;
  }

  const octokit = new Octokit({ auth: token.trim() });

  let user;
  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    user = data;
    console.log(`✅ Logged in as GitHub user: @${user.login} (${user.name || user.login})`);
  } catch (err) {
    console.error('❌ Invalid GitHub Token:', err.message);
    rl.close();
    return;
  }

  const repoName = (await askQuestion('📁 Enter repository name (default: vibesafe): ')) || 'vibesafe';

  // Create repo if doesn't exist
  let repo;
  try {
    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'VibeSafe - ESP32-C3 SOS Emergency Wearable Dashboard & Backend',
      private: false,
      auto_init: false,
    });
    repo = data;
    console.log(`✅ Created new GitHub repository: https://github.com/${user.login}/${repoName}`);
  } catch (err) {
    if (err.status === 422) {
      console.log(`ℹ️ Repository "${repoName}" already exists on your account. Uploading files into it...`);
    } else {
      console.error('❌ Error creating repo:', err.message);
    }
  }

  // Gather all files to upload (excluding node_modules, .git, .vercel)
  const ignoredFolders = ['node_modules', '.git', '.vercel', 'dist'];
  const filesToUpload = [];

  function scanDir(currentDir, relativeDir = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredFolders.includes(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else {
        filesToUpload.push({ fullPath, relPath });
      }
    }
  }

  scanDir(__dirname);

  console.log(`\n📦 Found ${filesToUpload.length} files to upload to https://github.com/${user.login}/${repoName}...`);

  let uploaded = 0;
  for (const file of filesToUpload) {
    const content = fs.readFileSync(file.fullPath);
    const contentBase64 = content.toString('base64');

    // Check if file already exists to get SHA for update
    let sha = undefined;
    try {
      const existing = await octokit.rest.repos.getContent({
        owner: user.login,
        repo: repoName,
        path: file.relPath,
      });
      if (existing.data && existing.data.sha) {
        sha = existing.data.sha;
      }
    } catch (e) {
      // File doesn't exist yet
    }

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: file.relPath,
        message: `Upload ${file.relPath}`,
        content: contentBase64,
        sha,
      });
      uploaded++;
      console.log(`  [${uploaded}/${filesToUpload.length}] ✅ Uploaded: ${file.relPath}`);
    } catch (err) {
      console.error(`  ❌ Failed to upload ${file.relPath}:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL FILES SUCCESSFULLY UPLOADED TO GITHUB!`);
  console.log(`🌐 Repository URL: https://github.com/${user.login}/${repoName}`);
  console.log('======================================================\n');

  rl.close();
}

main().catch(console.error);
