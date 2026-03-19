const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const yaml = require('js-yaml');

const PACK_MANIFEST_NAMES = new Set(['pack.yaml', 'pack.yml']);
const SUPPORTED_MASCOT_IDS = new Set(['cat', 'penguin']);
const SUPPORTED_MODE_IDS = new Set(['idle', 'running']);
const DEFAULT_DISCOVERED_EXTENSIONS = new Set(['.webp', '.gif', '.png', '.jpg', '.jpeg', '.avif']);
const BUNDLED_PACKS_DIRECTORY_NAME = 'builtin';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))];
}

function toPositiveInteger(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue);
}

function normalizeIntervalMs(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const normalizedValue = toPositiveInteger(value);
    return normalizedValue ? { min: normalizedValue, max: normalizedValue } : null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const minValue = toPositiveInteger(value.min ?? value.minimum ?? value.from ?? value.value);
  const maxValue = toPositiveInteger(value.max ?? value.maximum ?? value.to ?? value.value ?? minValue);

  if (!minValue || !maxValue) {
    return null;
  }

  return {
    min: Math.min(minValue, maxValue),
    max: Math.max(minValue, maxValue)
  };
}

function resolveManifestRelativePath(manifestPath, relativePath, label) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error(`${label} must be a non-empty relative path`);
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must stay relative to the manifest`);
  }

  const manifestDir = path.dirname(manifestPath);
  const resolvedPath = path.resolve(manifestDir, relativePath);
  const relativeToManifest = path.relative(manifestDir, resolvedPath);

  if (relativeToManifest.startsWith('..') || path.isAbsolute(relativeToManifest)) {
    throw new Error(`${label} cannot escape the manifest directory`);
  }

  return resolvedPath;
}

function getRealPath(targetPath) {
  if (typeof fs.realpathSync.native === 'function') {
    return fs.realpathSync.native(targetPath);
  }

  return fs.realpathSync(targetPath);
}

function assertPathInsideManifestDirectory(manifestPath, resolvedPath, label) {
  const manifestDir = path.dirname(manifestPath);
  const realManifestDir = getRealPath(manifestDir);
  const realResolvedPath = getRealPath(resolvedPath);
  const relativeToManifest = path.relative(realManifestDir, realResolvedPath);

  if (relativeToManifest.startsWith('..') || path.isAbsolute(relativeToManifest)) {
    throw new Error(`${label} cannot escape the manifest directory via symlink`);
  }
}

function collectFilesFromDirectory(directoryPath, { recursive = false, extensions = DEFAULT_DISCOVERED_EXTENSIONS } = {}) {
  const collectedFiles = [];

  function walkDirectory(currentDirectory) {
    const directoryEntries = fs.readdirSync(currentDirectory, { withFileTypes: true })
      .sort((firstEntry, secondEntry) => firstEntry.name.localeCompare(secondEntry.name));

    directoryEntries.forEach((entry) => {
      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          walkDirectory(entryPath);
        }
        return;
      }

      if (!entry.isFile()) {
        return;
      }

      if (extensions.has(path.extname(entry.name).toLowerCase())) {
        collectedFiles.push(entryPath);
      }
    });
  }

  walkDirectory(directoryPath);
  return collectedFiles;
}

function normalizeFileEntries(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    return [rawValue];
  }

  return [];
}

function resolveModeFiles(manifestPath, modeConfig) {
  const directFiles = normalizeFileEntries(modeConfig.files ?? modeConfig.file)
    .map((filePath, index) => {
      const resolvedPath = resolveManifestRelativePath(manifestPath, filePath, `animations file[${index}]`);

      if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`animations file does not exist: ${filePath}`);
      }

      assertPathInsideManifestDirectory(manifestPath, resolvedPath, `animations file[${index}]`);
      return resolvedPath;
    });

  let discoveredFiles = [];

  if (modeConfig.directory !== undefined) {
    const resolvedDirectoryPath = resolveManifestRelativePath(manifestPath, modeConfig.directory, 'animations.directory');

    if (!fs.existsSync(resolvedDirectoryPath) || !fs.statSync(resolvedDirectoryPath).isDirectory()) {
      throw new Error(`animations.directory does not exist: ${modeConfig.directory}`);
    }

    assertPathInsideManifestDirectory(manifestPath, resolvedDirectoryPath, 'animations.directory');

    const extensionValues = normalizeFileEntries(modeConfig.extensions)
      .map((extension) => extension.trim().toLowerCase())
      .filter(Boolean)
      .map((extension) => (extension.startsWith('.') ? extension : `.${extension}`));
    const normalizedExtensions = extensionValues.length > 0
      ? new Set(extensionValues)
      : DEFAULT_DISCOVERED_EXTENSIONS;

    discoveredFiles = collectFilesFromDirectory(resolvedDirectoryPath, {
      recursive: Boolean(modeConfig.recursive),
      extensions: normalizedExtensions
    });
  }

  const resolvedFiles = uniqueStrings([...directFiles, ...discoveredFiles]);

  if (resolvedFiles.length === 0) {
    throw new Error('animations must define at least one file');
  }

  return resolvedFiles.map((resolvedFilePath) => pathToFileURL(resolvedFilePath).href);
}

function normalizeModeConfig(manifestPath, modeName, rawModeConfig) {
  if (!isPlainObject(rawModeConfig)) {
    throw new Error(`animations.${modeName} must be a mapping`);
  }

  const files = resolveModeFiles(manifestPath, rawModeConfig);
  const requestedSelection = typeof rawModeConfig.selection === 'string'
    ? rawModeConfig.selection.trim().toLowerCase()
    : '';
  const selection = requestedSelection === 'random'
    ? 'random'
    : files.length > 1
      ? 'random'
      : 'fixed';
  const intervalMs = normalizeIntervalMs(rawModeConfig.interval_ms ?? rawModeConfig.switch_interval_ms);

  return {
    files,
    replaceDefault: Boolean(rawModeConfig.replace_default),
    selection,
    intervalMs: selection === 'random' ? intervalMs : null
  };
}

function loadPackManifest(manifestPath) {
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const parsedManifest = yaml.load(manifestText);

  if (!isPlainObject(parsedManifest)) {
    throw new Error('manifest root must be a mapping');
  }

  const schemaVersion = Number(parsedManifest.schema_version ?? 1);

  if (schemaVersion !== 1) {
    throw new Error(`unsupported schema_version: ${parsedManifest.schema_version}`);
  }

  if (parsedManifest.enabled === false) {
    return null;
  }

  const mascotId = typeof parsedManifest.mascot === 'string'
    ? parsedManifest.mascot.trim()
    : '';

  if (!SUPPORTED_MASCOT_IDS.has(mascotId)) {
    throw new Error(`mascot must be one of: ${[...SUPPORTED_MASCOT_IDS].join(', ')}`);
  }

  if (!isPlainObject(parsedManifest.animations)) {
    throw new Error('animations must be a mapping');
  }

  const animationModes = {};

  SUPPORTED_MODE_IDS.forEach((modeName) => {
    if (parsedManifest.animations[modeName] === undefined) {
      return;
    }

    animationModes[modeName] = normalizeModeConfig(
      manifestPath,
      modeName,
      parsedManifest.animations[modeName]
    );
  });

  if (Object.keys(animationModes).length === 0) {
    throw new Error('manifest must define at least one supported animation mode');
  }

  const packDirectoryName = path.basename(path.dirname(manifestPath));
  const packId = typeof parsedManifest.id === 'string' && parsedManifest.id.trim()
    ? parsedManifest.id.trim()
    : packDirectoryName;

  return {
    id: packId,
    mascotId,
    manifestPath,
    animationModes
  };
}

function ensureDirectoryExists(directoryPath) {
  try {
    fs.mkdirSync(directoryPath, { recursive: true });
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      console.warn(`Failed to prepare animation pack directory: ${directoryPath}`, error);
    }
  }
}

function getAnimationPackDirectories(app) {
  const configuredDirectories = (process.env.MITARASHI_ANIMATION_PACKS_DIR || '')
    .split(path.delimiter)
    .map((directoryPath) => directoryPath.trim())
    .filter(Boolean);
  const bundledPackDirectory = path.join(app.getAppPath(), 'animation-packs');
  const userDataPackDirectory = path.join(app.getPath('userData'), 'animation-packs');

  ensureDirectoryExists(userDataPackDirectory);

  const fallbackDirectories = [
    bundledPackDirectory,
    userDataPackDirectory
  ];

  return uniqueStrings([...fallbackDirectories, ...configuredDirectories].map((directoryPath) => path.resolve(directoryPath)));
}

function isBundledManifestPath(rootDirectoryPath, manifestPath) {
  const relativePathSegments = path.relative(rootDirectoryPath, manifestPath).split(path.sep);
  return relativePathSegments[0]?.toLowerCase() === BUNDLED_PACKS_DIRECTORY_NAME;
}

function findManifestPaths(rootDirectoryPath) {
  if (!fs.existsSync(rootDirectoryPath) || !fs.statSync(rootDirectoryPath).isDirectory()) {
    return [];
  }

  const pendingDirectories = [rootDirectoryPath];
  const manifestPaths = [];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    const directoryEntries = fs.readdirSync(currentDirectory, { withFileTypes: true })
      .sort((firstEntry, secondEntry) => firstEntry.name.localeCompare(secondEntry.name));

    directoryEntries.forEach((entry) => {
      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        pendingDirectories.push(entryPath);
        return;
      }

      if (entry.isFile() && PACK_MANIFEST_NAMES.has(entry.name.toLowerCase())) {
        manifestPaths.push(entryPath);
      }
    });
  }

  return manifestPaths.sort((firstPath, secondPath) => {
    const firstIsBundled = isBundledManifestPath(rootDirectoryPath, firstPath);
    const secondIsBundled = isBundledManifestPath(rootDirectoryPath, secondPath);

    if (firstIsBundled !== secondIsBundled) {
      return firstIsBundled ? -1 : 1;
    }

    return firstPath.localeCompare(secondPath);
  });
}

function mergePackIntoCatalog(catalog, pack) {
  const mascotCatalog = catalog.mascots[pack.mascotId] || { animationModes: {} };

  Object.entries(pack.animationModes).forEach(([modeName, modeConfig]) => {
    const existingModeConfig = mascotCatalog.animationModes[modeName] || {
      files: [],
      replaceDefault: false,
      selection: null,
      intervalMs: null
    };
    const nextModeConfig = modeConfig.replaceDefault
      ? {
          files: [],
          replaceDefault: true,
          selection: existingModeConfig.selection,
          intervalMs: existingModeConfig.intervalMs
        }
      : { ...existingModeConfig };

    nextModeConfig.files = uniqueStrings([...nextModeConfig.files, ...modeConfig.files]);
    nextModeConfig.replaceDefault = nextModeConfig.replaceDefault || modeConfig.replaceDefault;

    if (modeConfig.selection) {
      nextModeConfig.selection = modeConfig.selection;
    }

    if (modeConfig.intervalMs) {
      nextModeConfig.intervalMs = modeConfig.intervalMs;
    }

    mascotCatalog.animationModes[modeName] = nextModeConfig;
  });

  catalog.mascots[pack.mascotId] = mascotCatalog;
  catalog.loadedPacks.push({
    id: pack.id,
    mascotId: pack.mascotId,
    manifestPath: pack.manifestPath
  });
}

function loadAnimationPackCatalog(app) {
  const packRoots = getAnimationPackDirectories(app);
  const catalog = {
    packRoots,
    mascots: {},
    loadedPacks: [],
    diagnostics: []
  };

  packRoots.forEach((rootDirectoryPath) => {
    findManifestPaths(rootDirectoryPath).forEach((manifestPath) => {
      try {
        const loadedPack = loadPackManifest(manifestPath);

        if (!loadedPack) {
          catalog.diagnostics.push({
            level: 'info',
            message: `Skipped disabled animation pack: ${manifestPath}`
          });
          return;
        }

        mergePackIntoCatalog(catalog, loadedPack);
        catalog.diagnostics.push({
          level: 'info',
          message: `Loaded animation pack "${loadedPack.id}" for mascot "${loadedPack.mascotId}" from ${manifestPath}`
        });
      } catch (error) {
        catalog.diagnostics.push({
          level: 'warn',
          message: `Failed to load animation pack from ${manifestPath}: ${error.message}`
        });
      }
    });
  });

  return catalog;
}

module.exports = {
  getAnimationPackDirectories,
  loadAnimationPackCatalog
};
