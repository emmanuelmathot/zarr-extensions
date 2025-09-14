# Schema Documentation Setup

This directory contains an automated documentation generation system based on [Wetzel](https://github.com/CesiumGS/wetzel) that generates Markdown documentation from JSON Schema files.

## Files

- `schema.json` - The original JSON schema with external references
- `geo-proj-schema.json` - Simplified schema for documentation generation (removes external refs)
- `update-readme.js` - Script that generates documentation and updates README.md
- `README.md` - Main documentation with placeholder markers for generated content

## How it works

1. The `README.md` file contains placeholder markers:
   ```html
   <!-- GENERATED_SCHEMA_DOCS_START -->
   [fallback content]
   <!-- GENERATED_SCHEMA_DOCS_END -->
   ```

2. The `update-readme.js` script:
   - Runs Wetzel on `geo-proj-schema.json` to generate documentation
   - Extracts the properties table and field details
   - Replaces content between the placeholder markers in `README.md`

3. A pre-commit hook automatically runs the update script when schema files change

## Setup

1. Install pre-commit:
   ```bash
   pip install pre-commit
   ```

2. Install the pre-commit hooks:
   ```bash
   pre-commit install
   ```

3. Install Node.js dependencies (optional, pre-commit will handle this automatically):
   ```bash
   npm install
   ```

## Manual Usage

To manually update the documentation:

```bash
cd attributes/geo:proj
node update-readme.js
```

## Updating the Schema

When updating the schema:

1. Update `schema.json` with your changes
2. Update `geo-proj-schema.json` to match (removing any external references)
3. The pre-commit hook will automatically update the README.md when you commit

## Benefits

- **Consistency**: Documentation always matches the schema
- **Automation**: No manual work needed to keep docs in sync
- **Type Safety**: JSON types are automatically extracted and displayed
- **Maintainability**: Single source of truth for field definitions
