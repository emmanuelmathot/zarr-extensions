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
    
    // Extract the properties table and field descriptions
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
    const fieldDescriptions = lines.slice(fieldDescriptionsStart).join('\n').trim();
    
    return {
      propertiesTable,
      fieldDescriptions
    };
    
  } catch (error) {
    console.error('Error generating documentation:', error.message);
    process.exit(1);
  }
}

// Update README.md with generated documentation
function updateReadme() {
  const readmePath = path.join(__dirname, 'README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  // Generate the new documentation
  const docs = generateSchemaDocumentation();
  
  // Create the new content to replace between the placeholders
  const newContent = `**\`geo:proj\` Properties**

${docs.propertiesTable.replace('**`geo:proj` Properties**', '').trim()}

**Requirements:**
- The \`version\` field is required
- At least one of \`code\`, \`wkt2\`, or \`projjson\` must be provided

### Field Details

${docs.fieldDescriptions.replace(/######/g, '####')}`;
  
  // Replace content between placeholders
  const startMarker = '<!-- GENERATED_SCHEMA_DOCS_START -->';
  const endMarker = '<!-- GENERATED_SCHEMA_DOCS_END -->';
  
  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find placeholder markers in README.md');
  }
  
  const beforePlaceholder = readmeContent.substring(0, startIndex + startMarker.length);
  const afterPlaceholder = readmeContent.substring(endIndex);
  
  const updatedContent = beforePlaceholder + '\n' + newContent + '\n' + afterPlaceholder;
  
  // Write the updated content back to the file
  fs.writeFileSync(readmePath, updatedContent);
  
  console.log('README.md updated successfully with generated schema documentation');
}

// Run the update
updateReadme();
