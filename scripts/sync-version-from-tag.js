const fs = require('fs');
const path = require('path');

function parseVersionFromTag(tagName) {
  const match = /^v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/.exec(tagName);

  if (!match) {
    throw new Error(`Tag "${tagName}" must match v<semver>, for example v0.2.0`);
  }

  return match[1];
}

function updateJsonFile(filePath, transform) {
  const source = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(source);
  const nextJson = transform(json);
  fs.writeFileSync(filePath, `${JSON.stringify(nextJson, null, 2)}\n`, 'utf8');
}

function main() {
  const rawTag = process.argv[2] || process.env.GITHUB_REF_NAME || '';

  if (!rawTag) {
    throw new Error('Missing tag name. Pass it as an argument or set GITHUB_REF_NAME.');
  }

  const version = parseVersionFromTag(rawTag);
  const rootDir = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageLockPath = path.join(rootDir, 'package-lock.json');

  updateJsonFile(packageJsonPath, (json) => ({
    ...json,
    version
  }));

  updateJsonFile(packageLockPath, (json) => ({
    ...json,
    version,
    packages: json.packages
      ? {
          ...json.packages,
          '': {
            ...json.packages[''],
            version
          }
        }
      : json.packages
  }));

  console.log(`Synchronized package version to ${version} from tag ${rawTag}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
