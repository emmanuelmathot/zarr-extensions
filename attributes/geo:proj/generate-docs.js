#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate documentation from schema using Wetzel
function generateSchemaDocumentation() {
  try {
    const wetzelOutput = execSync('npx wetzel geo-proj-schema.json -l 4', {
      cwd: __dirname,
      encoding: 'utf8'
    });
    
    // Extract just the properties table and field descriptions
    const lines = wetzelOutput.split('\n');
    let propertiesTableStart = -1;
    let propertiesTableEnd = -1;
    let fieldDescriptionsStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('**`geo:proj` Properties**')) {
        propertiesTableStart = i;
      }
      if (propertiesTableStart !== -1 && lines[i].includes('Additional properties are not allowed.')) {
        propertiesTableEnd = i;
        fieldDescriptionsStart = i + 2; // Skip the blank line
        break;
      }
    }
    
    if (propertiesTableStart === -1) {
      throw new Error('Could not find properties table in Wetzel output');
    }
    
    // Extract the properties table
    const propertiesTable = lines.slice(propertiesTableStart, propertiesTableEnd).join('\n');
    
    // Extract field descriptions (everything after the table)
    const fieldDescriptions = lines.slice(fieldDescriptionsStart).join('\n');
    
    return {
      propertiesTable,
      fieldDescriptions: fieldDescriptions.trim()
    };
    
  } catch (error) {
    console.error('Error generating documentation:', error.message);
    process.exit(1);
  }
}

// Generate the documentation
const docs = generateSchemaDocumentation();

console.log('Generated documentation:');
console.log('======================');
console.log(docs.propertiesTable);
console.log('\n' + docs.fieldDescriptions);

// Optionally write to a file
fs.writeFileSync(path.join(__dirname, 'generated-schema-docs.md'), 
  docs.propertiesTable + '\n\n' + docs.fieldDescriptions);

console.log('\nDocumentation saved to generated-schema-docs.md');
