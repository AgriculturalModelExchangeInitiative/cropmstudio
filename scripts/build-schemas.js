#!/usr/bin/env node

/**
 * Schema Builder - Resolve all $ref and generate complete standalone schemas
 *
 * This script reads all JSON schemas, resolves $ref references, and outputs
 * complete standalone schemas that can be used without a resolver.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SCHEMAS_DIR = path.join('src', 'schema');
const OUTPUT_DIR = path.join('src', '_schema');

/**
 * Recursively scan directory for JSON schema files
 */
function findSchemaFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      files.push(...findSchemaFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Get main schemas (files at the root of SCHEMAS_DIR)
 */
function getMainSchemas() {
  const entries = fs.readdirSync(SCHEMAS_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => entry.name);
}

// Dynamically discover schema files
const MAIN_SCHEMAS = getMainSchemas();
const ALL_SCHEMAS = findSchemaFiles(SCHEMAS_DIR);

/**
 * Load a JSON file
 */
function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Resolve a $ref path to absolute file path
 */
function resolveRefPath(currentDir, refPath) {
  // Remove the fragment if present (e.g., #/definitions/something)
  const [filePath] = refPath.split('#');

  if (!filePath) {
    // It's a local reference within the same file
    return null;
  }

  return path.resolve(currentDir, filePath);
}

/**
 * Deep clone an object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Recursively resolve all $ref in a schema
 */
function resolveRefs(schema, currentDir, visited = new Set()) {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(item => resolveRefs(item, currentDir, visited));
  }

  // Check for $ref
  if (schema.$ref) {
    const refPath = schema.$ref;
    const absolutePath = resolveRefPath(currentDir, refPath);

    if (!absolutePath) {
      // Local reference, keep it as is
      return schema;
    }

    // Prevent circular references
    if (visited.has(absolutePath)) {
      console.warn(`Circular reference detected: ${absolutePath}`);
      return {
        type: 'object',
        description: `Circular reference to ${path.basename(absolutePath)}`
      };
    }

    visited.add(absolutePath);

    // Load and resolve the referenced schema
    const referencedSchema = loadJSON(absolutePath);
    const referencedDir = path.dirname(absolutePath);

    // Clone to avoid modifying the original
    const resolvedSchema = deepClone(referencedSchema);

    // Recursively resolve refs in the referenced schema
    const fullyResolved = resolveRefs(
      resolvedSchema,
      referencedDir,
      new Set(visited)
    );

    // Merge properties from current schema (excluding $ref)
    const { $ref, ...otherProps } = schema;

    return {
      ...fullyResolved,
      ...otherProps
    };
  }

  // Recursively process all properties
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = resolveRefs(value, currentDir, visited);
  }

  return result;
}

/**
 * Remove internal $id fields from resolved schemas
 */
function cleanSchema(schema) {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(cleanSchema);
  }

  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    // Keep root $id but remove nested ones
    if (key === '$id' && value !== schema.$id) {
      continue;
    }
    result[key] = cleanSchema(value);
  }

  return result;
}

/**
 * Build a complete standalone schema
 */
function buildSchema(schemaFileName) {
  console.log(`\n📦 Building ${schemaFileName}...`);

  const schemaPath = path.join(SCHEMAS_DIR, schemaFileName);
  const schema = loadJSON(schemaPath);
  const schemaDir = path.dirname(schemaPath);

  console.log(`  ├─ Resolving $ref...`);
  const resolvedSchema = resolveRefs(schema, schemaDir);

  console.log(`  ├─ Cleaning schema...`);
  const cleanedSchema = cleanSchema(resolvedSchema);

  // Add metadata
  cleanedSchema._meta = {
    generated: new Date().toISOString(),
    source: schemaFileName,
    description: 'This is a standalone schema with all $ref resolved'
  };

  const outputFileName = schemaFileName;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  console.log(`  ├─ Writing to ${outputFileName}...`);
  fs.writeFileSync(outputPath, JSON.stringify(cleanedSchema, null, 2), 'utf8');

  console.log(`  └─ ✅ Done!`);

  return {
    input: schemaFileName,
    output: outputFileName,
    size: JSON.stringify(cleanedSchema).length
  };
}

/**
 * Generate index file
 */
function generateIndex(results) {
  console.log('\n📝 Generating index...');

  const index = {
    generated: new Date().toISOString(),
    schemas: results.map(r => ({
      name: r.input,
      resolved: r.output,
      size: r.size
    }))
  };

  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

  console.log('  └─ ✅ Done!');
}

/**
 * Main build process
 */
function main() {
  console.log('🔨 Schema Build Process Starting...');
  console.log('=====================================');
  console.log(`\n📁 Schemas directory: ${SCHEMAS_DIR}`);
  console.log(`\n📝 Discovered schemas:`);
  console.log(`  ├─ Main schemas (${MAIN_SCHEMAS.length}):`);
  MAIN_SCHEMAS.forEach(schema => console.log(`  │  ├─ ${schema}`));
  console.log(`  └─ All schemas (${ALL_SCHEMAS.length}):`);
  ALL_SCHEMAS.forEach(schema => console.log(`     ├─ ${schema}`));

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Build all main schemas
  const results = MAIN_SCHEMAS.map(buildSchema);

  // Generate index
  generateIndex(results);

  // Summary
  console.log('\n✨ Build Summary');
  console.log('=====================================');
  results.forEach(r => {
    const sizeKB = (r.size / 1024).toFixed(2);
    console.log(`  ${r.input} → ${r.output} (${sizeKB} KB)`);
  });

  console.log('\n✅ All schemas built successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Run the build
try {
  main();
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
