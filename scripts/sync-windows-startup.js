const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const STARTUP_FLAG = '--launch-at-login';

function parseArgs(argv) {
  const options = {
    dryRun: false,
    exePath: '',
    ifPresent: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--exe') {
      const pathSegments = [];
      let lookaheadIndex = index + 1;

      while (lookaheadIndex < argv.length && !argv[lookaheadIndex].startsWith('--')) {
        pathSegments.push(argv[lookaheadIndex]);
        lookaheadIndex += 1;
      }

      const value = pathSegments.join(' ');

      if (!value) {
        throw new Error('Missing value for --exe');
      }

      options.exePath = value;
      index = lookaheadIndex - 1;
      continue;
    }

    if (arg === '--if-present') {
      options.ifPresent = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPackageMetadata(rootDir) {
  const packageJson = readJson(path.join(rootDir, 'package.json'));
  const productName = packageJson.build?.productName;

  if (!productName) {
    throw new Error('package.json is missing build.productName');
  }

  return {
    productName,
    version: packageJson.version
  };
}

function getAvailablePortableExecutables(distDir, productName) {
  if (!fs.existsSync(distDir)) {
    return [];
  }

  return fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(`${productName} `) && name.endsWith('.exe'))
    .sort();
}

function resolveTargetExecutable(rootDir, productName, version, rawExePath) {
  if (rawExePath) {
    return path.resolve(rootDir, rawExePath);
  }

  return path.join(rootDir, 'dist', `${productName} ${version}.exe`);
}

function readRegistryValue(valueName) {
  try {
    const output = execFileSync('reg', ['query', RUN_KEY, '/v', valueName], {
      encoding: 'utf8',
      windowsHide: true
    });
    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const valueLine = lines.find((line) => line.startsWith(valueName));

    if (!valueLine) {
      return null;
    }

    return valueLine.replace(/^.+?\s+REG_\w+\s+/, '');
  } catch (error) {
    if (typeof error.status === 'number') {
      return null;
    }

    throw error;
  }
}

function writeRegistryValue(valueName, data) {
  execFileSync(
    'reg',
    ['add', RUN_KEY, '/v', valueName, '/t', 'REG_SZ', '/d', data, '/f'],
    {
      stdio: 'pipe',
      windowsHide: true
    }
  );
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (process.platform !== 'win32') {
    if (options.ifPresent) {
      console.log('Skipping startup sync because this platform is not Windows.');
      return;
    }

    throw new Error('This script only supports Windows.');
  }

  const rootDir = path.resolve(__dirname, '..');
  const { productName, version } = getPackageMetadata(rootDir);
  const distDir = path.join(rootDir, 'dist');
  const valueName = `electron.app.${productName}`;
  const currentValue = readRegistryValue(valueName);

  if (options.ifPresent && process.env.CI) {
    console.log('Skipping startup sync in CI mode.');
    return;
  }

  if (options.ifPresent && !currentValue) {
    console.log(`Skipping startup sync because ${valueName} is not currently registered.`);
    return;
  }

  const targetExecutable = resolveTargetExecutable(rootDir, productName, version, options.exePath);
  const availableExecutables = getAvailablePortableExecutables(distDir, productName);

  if (!fs.existsSync(targetExecutable)) {
    const hint = availableExecutables.length
      ? `Available portable executables: ${availableExecutables.join(', ')}`
      : 'No portable executables were found under dist/.';

    throw new Error(
      `Target executable was not found: ${targetExecutable}\n${hint}\nRun "npm run build:win" first or pass --exe.`
    );
  }

  const nextValue = `"${targetExecutable}" ${STARTUP_FLAG}`;

  console.log(`Value name: ${valueName}`);
  console.log(`Current startup value: ${currentValue || '(not set)'}`);
  console.log(`Target startup value: ${nextValue}`);

  if (currentValue === nextValue) {
    console.log('Windows startup registration is already up to date.');
    return;
  }

  if (options.dryRun) {
    console.log('Dry run only. No registry changes were made.');
    return;
  }

  writeRegistryValue(valueName, nextValue);

  const updatedValue = readRegistryValue(valueName);

  if (updatedValue !== nextValue) {
    throw new Error(`Startup value update could not be verified. Current value: ${updatedValue || '(not set)'}`);
  }

  console.log('Windows startup registration is now synchronized to the current portable executable.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
