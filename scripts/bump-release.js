#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major
const releaseNotes = args[1] || '';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Version type must be one of: patch, minor, major');
  process.exit(1);
}

console.log(`=== Bumping ${versionType} version and creating release ===`);

try {
  // Bump version in package.json
  console.log(`Bumping ${versionType} version...`);
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

  // Get the new version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = `v${packageJson.version}`;
  const extensionName = packageJson.name;
  const vsixFilename = `${extensionName}-${packageJson.version}.vsix`;

  // Commit the version bump
  console.log('Committing version bump...');
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "Bump version to ${packageJson.version}"`, { stdio: 'inherit' });

  // Package the extension
  console.log('Packaging extension...');
  execSync('vsce package', { stdio: 'inherit' });

  // Create git tag
  console.log('Creating git tag...');
  execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' });

  // Push changes and tag to remote
  console.log('Pushing changes and tag to remote...');
  execSync('git push', { stdio: 'inherit' });
  execSync(`git push origin ${version}`, { stdio: 'inherit' });

  // Create GitHub release if gh CLI is available
  try {
    console.log('Creating GitHub release...');
    const notes = releaseNotes || `Release ${version}`;
    execSync(`gh release create ${version} "${vsixFilename}" --title "Version ${version}" --notes "${notes}"`, { stdio: 'inherit' });
    console.log('GitHub release created successfully!');
  } catch (error) {
    console.warn('Warning: Could not create GitHub release. Is GitHub CLI installed and configured?');
    console.warn('You can create the release manually with the VSIX file.');
  }

  console.log(`\n✅ Version bumped and release ${version} completed successfully!`);
  console.log(`VSIX file created: ${vsixFilename}`);

} catch (error) {
  console.error('\n❌ Release process failed:');
  console.error(error.message);
  process.exit(1);
}