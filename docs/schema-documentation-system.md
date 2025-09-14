# Universal Schema Documentation System

This repository includes an automated documentation generation system that uses [Wetzel](https://github.com/CesiumGS/wetzel) to generate Markdown documentation from JSON Schema files for all attribute extensions.

## Overview

The system automatically scans all attribute extensions in the repository and generates detailed documentation with JSON type information directly from their schema files. This ensures documentation always stays in sync with the schema definitions.

## How It Works

### 1. **Automatic Discovery**
The system scans the `attributes/` directory recursively to find extensions that have:
- A `schema.json` file
- A `README.md` file with documentation placeholders

### 2. **Placeholder-Based Updates**
Extensions opt into automatic documentation by adding placeholder markers in their README.md:

```html
<!-- GENERATED_SCHEMA_DOCS_START -->
[fallback content - will be replaced]
<!-- GENERATED_SCHEMA_DOCS_END -->
```

### 3. **Wetzel Integration**
For each extension found:
- Runs Wetzel on the `schema.json` file
- Extracts the properties table and field details
- Updates the README.md between the placeholder markers

### 4. **Pre-commit Automation**
A pre-commit hook automatically runs the documentation update when:
- Any `schema.json` file changes
- Any `README.md` file with placeholders changes

## Setup

### Prerequisites
- Node.js 14+ 
- Python (for pre-commit)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   pip install pre-commit
   ```

2. **Install pre-commit hooks:**
   ```bash
   npm run install-hooks
   # or directly: pre-commit install
   ```

## Usage

### Automatic (Recommended)
The system runs automatically via pre-commit hooks. Just commit your changes and the documentation will be updated automatically.

### Manual
To manually update all extension documentation:
```bash
npm run update-docs
# or directly: node scripts/update-attribute-docs.js
```

## Adding Documentation to New Extensions

To enable automatic documentation for a new attribute extension:

1. **Create your extension** with a `schema.json` file

2. **Add placeholders to README.md:**
   ```markdown
   ## Specification
   
   <!-- GENERATED_SCHEMA_DOCS_START -->
   ### Fields
   
   - `field1`: Description of field1
   - `field2`: Description of field2
   <!-- GENERATED_SCHEMA_DOCS_END -->
   ```

3. **Commit your changes** - the pre-commit hook will automatically generate the detailed documentation

## Generated Documentation Format

The system generates:

### Properties Table
A comprehensive table showing:
- Field names
- JSON types (e.g., `string`, `number []`, `string [2]`)
- Descriptions
- Required/optional status

### Field Details
Detailed sections for each field including:
- Precise type information
- Validation rules (patterns, min/max values, array lengths)
- Allowed values for enums
- Additional constraints

## Example Output

```markdown
**`extension-name` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**version**|`string`|Version of the extension| ✓ Yes|
|**bbox**|`number` `[]`|Bounding box coordinates|No|
|**transform**|`number` `[]`|Transformation matrix|No|

### Field Details

#### extension-name.version
Version of the extension
* **Type**: `string`
* **Required**: ✓ Yes
* **Allowed values**: `"1.0"`

#### extension-name.bbox
Bounding box coordinates
* **Type**: `number` `[]` (array of numbers)
* **Required**: No
* **Length**: 4 or 6 elements
```

## Benefits

- **Consistency**: Documentation always matches the schema
- **Type Safety**: JSON types are automatically extracted and displayed
- **No Duplication**: Single source of truth for field definitions
- **Automation**: No manual work needed to keep docs in sync
- **Scalability**: Works for all current and future attribute extensions
- **Maintainability**: Easy to add new extensions to the system

## Current Status

The system is fully implemented and ready to use. Currently, extensions with external schema references (like `geo:proj`) will be skipped until Wetzel is updated to handle external references. Once that's resolved, all extensions will be automatically supported.

## Files

- `scripts/update-attribute-docs.js` - Universal documentation generator
- `.pre-commit-config.yaml` - Pre-commit hook configuration
- `package.json` - Node.js dependencies and scripts

## Troubleshooting

### Extension Not Found
If your extension isn't being processed:
1. Ensure it has both `schema.json` and `README.md`
2. Verify the README contains the placeholder markers
3. Check that the schema file is valid JSON

### External Schema References
Extensions with external `$ref` will be skipped until Wetzel supports them. This is expected behavior and will be resolved when Wetzel is updated.

### Pre-commit Hook Not Running
1. Ensure pre-commit is installed: `pip install pre-commit`
2. Install hooks: `pre-commit install`
3. Test manually: `pre-commit run --all-files`
