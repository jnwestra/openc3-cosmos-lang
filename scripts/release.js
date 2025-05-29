#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = `v${packageJson.version}`;
const extensionName = packageJson.name;
const vsixFilename = `${extensionName}-${packageJson.version}.vsix`;

// Parse command line arguments
const args = process.argv.slice(2);
const releaseNotes = args[0] || `Release ${version}`;

console.log(`=== Creating release ${version} ===`);

try {
  // Package the extension
  console.log('Packaging extension...');
  execSync('vsce package', { stdio: 'inherit' });

  // Create git tag
  console.log('Creating git tag...');
  execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' });

  // Push tag to remote
  console.log('Pushing tag to remote...');
  execSync(`git push origin ${version}`, { stdio: 'inherit' });

  // Create GitHub release if gh CLI is available
  try {
    console.log('Creating GitHub release...');
    execSync(`gh release create ${version} "${vsixFilename}" --title "Version ${version}" --notes "${releaseNotes}"`, { stdio: 'inherit' });
    console.log('GitHub release created successfully!');
  } catch (error) {
    console.warn('Warning: Could not create GitHub release. Is GitHub CLI installed and configured?');
    console.warn('You can create the release manually with the VSIX file.');
  }

  console.log(`\n✅ Release ${version} completed successfully!`);
  console.log(`VSIX file created: ${vsixFilename}`);

} catch (error) {
  console.error('\n❌ Release process failed:');
  console.error(error.message);
  process.exit(1);
}