#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all attribute extension directories
function findAttributeExtensions() {
  const attributesDir = path.join(__dirname, '..', 'attributes');
  const extensions = [];
  
  function scanDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = path.join(dir, item.name);
        const relPath = path.join(relativePath, item.name);
        
        // Check if this directory has a schema file and README with placeholders
        const hasSchema = fs.existsSync(path.join(fullPath, 'schema.json'));
        const readmePath = path.join(fullPath, 'README.md');
        const hasReadme = fs.existsSync(readmePath);
        
        if (hasSchema && hasReadme) {
          // Check if README has placeholder markers
          const readmeContent = fs.readFileSync(readmePath, 'utf8');
          const hasPlaceholders = readmeContent.includes('<!-- GENERATED_SCHEMA_DOCS_START -->') &&
                                 readmeContent.includes('<!-- GENERATED_SCHEMA_DOCS_END -->');
          
          if (hasPlaceholders) {
            extensions.push({
              name: relPath,
              path: fullPath,
              schemaPath: path.join(fullPath, 'schema.json'),
              readmePath: readmePath
            });
          }
        }
        
        // Recursively scan subdirectories
        scanDirectory(fullPath, relPath);
      }
    }
  }
  
  scanDirectory(attributesDir);
  return extensions;
}

// Create a temporary schema with resolved external references
function createResolvedSchema(originalSchemaPath) {
  const schema = JSON.parse(fs.readFileSync(originalSchemaPath, 'utf8'));
  
  // Function to recursively resolve external $ref
  function resolveExternalRefs(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(resolveExternalRefs);
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '$ref' && typeof value === 'string' && value.startsWith('http')) {
        // Replace external reference with a generic object type for documentation
        console.log(`    Resolving external $ref: ${value}`);
        result.type = ['object', 'null'];
        result.description = `External schema reference: ${value}`;
      } else if (key === 'oneOf' && Array.isArray(value)) {
        // Handle oneOf with external references
        const resolved = value.map(item => {
          if (item.$ref && item.$ref.startsWith('http')) {
            return {
              type: ['object', 'null'],
              description: `External schema reference: ${item.$ref}`
            };
          }
          return resolveExternalRefs(item);
        });
        result[key] = resolved;
      } else {
        result[key] = resolveExternalRefs(value);
      }
    }
    
    return result;
  }
  
  let resolvedSchema = resolveExternalRefs(schema);
  
  // Extract the actual extension schema if it's nested under attributes
  if (resolvedSchema.properties && resolvedSchema.properties.attributes && 
      resolvedSchema.properties.attributes.properties) {
    const attributeProps = resolvedSchema.properties.attributes.properties;
    const extensionKeys = Object.keys(attributeProps);
    
    if (extensionKeys.length === 1) {
      const extensionKey = extensionKeys[0];
      let extensionSchema = attributeProps[extensionKey];
      
      // Handle anyOf structure - take the first (and usually only) schema
      if (extensionSchema.anyOf && extensionSchema.anyOf.length > 0) {
        extensionSchema = extensionSchema.anyOf[0];
      }
      
      // Create a new schema focused on the extension
      resolvedSchema = {
        $schema: resolvedSchema.$schema,
        $id: resolvedSchema.$id,
        title: extensionKey,
        description: extensionSchema.description || resolvedSchema.description,
        type: extensionSchema.type || 'object',
        properties: extensionSchema.properties || {},
        required: extensionSchema.required || [],
        additionalProperties: extensionSchema.additionalProperties
      };
    }
  }
  
  // Create a temporary file for the resolved schema
  const tempPath = originalSchemaPath.replace('.json', '-resolved.json');
  fs.writeFileSync(tempPath, JSON.stringify(resolvedSchema, null, 2));
  
  return tempPath;
}

// Generate documentation from schema using Wetzel
function generateSchemaDocumentation(schemaPath, extensionName) {
  let tempSchemaPath = null;
  
  try {
    console.log(`  Running Wetzel on ${schemaPath}...`);
    
    // Check if schema has external references
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const hasExternalRefs = schemaContent.includes('"$ref"') && 
                           (schemaContent.includes('"http') || schemaContent.includes('"https'));
    
    let actualSchemaPath = schemaPath;
    
    if (hasExternalRefs) {
      console.log(`    Schema has external references, creating resolved version...`);
      tempSchemaPath = createResolvedSchema(schemaPath);
      actualSchemaPath = tempSchemaPath;
    }
    
    const wetzelOutput = execSync(`npx wetzel "${actualSchemaPath}" -l 4`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'] // Capture stderr to handle warnings
    });
    
    // Extract the properties table and field descriptions
    const lines = wetzelOutput.split('\n');
    let propertiesTableStart = -1;
    let propertiesTableEnd = -1;
    let fieldDescriptionsStart = -1;
    
    // Look for the properties table
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Properties**') && lines[i].includes('**')) {
        propertiesTableStart = i;
      }
      if (propertiesTableStart !== -1 && 
          (lines[i].includes('Additional properties') || 
           lines[i].includes('###') ||
           (i > propertiesTableStart + 10 && lines[i].trim() === ''))) {
        propertiesTableEnd = i;
        fieldDescriptionsStart = i + 1;
        break;
      }
    }
    
    if (propertiesTableStart === -1) {
      console.warn(`  Could not find properties table for ${extensionName}`);
      return null;
    }
    
    // Extract the properties table
    const propertiesTable = lines.slice(propertiesTableStart, propertiesTableEnd).join('\n');
    
    // Extract field descriptions (everything after the table)
    const fieldDescriptions = lines.slice(fieldDescriptionsStart).join('\n').trim();
    
    return {
      propertiesTable,
      fieldDescriptions
    };
    
  } catch (error) {
    console.error(`  Error generating documentation for ${extensionName}:`, error.message);
    return null;
  } finally {
    // Clean up temporary schema file
    if (tempSchemaPath && fs.existsSync(tempSchemaPath)) {
      fs.unlinkSync(tempSchemaPath);
    }
  }
}

// Update README.md with generated documentation
function updateReadme(readmePath, docs, extensionName) {
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Create the new content to replace between the placeholders
  const newContent = `${docs.propertiesTable}

### Field Details

${docs.fieldDescriptions.replace(/######/g, '####')}`;
  
  // Replace content between placeholders
  const startMarker = '<!-- GENERATED_SCHEMA_DOCS_START -->';
  const endMarker = '<!-- GENERATED_SCHEMA_DOCS_END -->';
  
  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.warn(`  No placeholder markers found in ${readmePath}. Skipping ${extensionName}.`);
    return false;
  }
  
  const beforePlaceholder = readmeContent.substring(0, startIndex + startMarker.length);
  const afterPlaceholder = readmeContent.substring(endIndex);
  
  const updatedContent = beforePlaceholder + '\n' + newContent + '\n' + afterPlaceholder;
  
  // Write the updated content back to the file
  fs.writeFileSync(readmePath, updatedContent);
  
  return true;
}

// Main function
function main() {
  console.log('Scanning for attribute extensions with schema documentation...');
  const extensions = findAttributeExtensions();
  
  if (extensions.length === 0) {
    console.log('No attribute extensions found with schema.json, README.md, and documentation placeholders.');
    return;
  }
  
  console.log(`Found ${extensions.length} attribute extension(s) with documentation placeholders:`);
  extensions.forEach(ext => console.log(`  - ${ext.name}`));
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const extension of extensions) {
    console.log(`\nProcessing ${extension.name}...`);
    
    try {
      // Generate documentation directly from the original schema
      const docs = generateSchemaDocumentation(extension.schemaPath, extension.name);
      
      if (docs) {
        // Update README
        const success = updateReadme(extension.readmePath, docs, extension.name);
        if (success) {
          console.log(`  ✓ Updated documentation for ${extension.name}`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        console.log(`  ⚠ Skipped ${extension.name} (could not generate documentation)`);
        skippedCount++;
      }
      
    } catch (error) {
      console.error(`  ✗ Error processing ${extension.name}:`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`\nCompleted: ${updatedCount} updated, ${skippedCount} skipped, ${extensions.length} total.`);
  
  if (skippedCount > 0) {
    console.log('\nNote: Some extensions were skipped due to external schema references.');
    console.log('These will be supported once Wetzel is updated to handle external references.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { findAttributeExtensions, generateSchemaDocumentation, updateReadme };
