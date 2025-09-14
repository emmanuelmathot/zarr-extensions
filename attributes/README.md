# Attributes Extensions

This directory contains specifications for Zarr v3 attribute extensions.

## What are Attribute Extensions?

Attribute extensions define standardized schemas and semantics for metadata stored in the attributes of Zarr arrays and groups. These extensions enable interoperability by establishing common conventions for domain-specific metadata.


## Creating an Attribute Extension

When creating an attribute extension, consider:

1. **Namespace**: Use a unique prefix to avoid conflicts (e.g., `proj:` for projection)
2. **Schema**: Provide a JSON schema for validation
3. **Inheritance**: Define behavior when attributes are set at group vs array level
4. **Compatibility**: Consider interoperability with existing tools and standards
5. **Example data**: Where possible, consider including a complete Zarr hierarchy that implements the extension.
## Extension Requirements

Each attribute extension MUST:
- Define the attribute key(s) and structure
- Provide a JSON schema for validation
- Include examples of usage
- Document any inheritance or precedence rules

## Automated Schema Documentation

This repository includes an automated documentation generation system that creates detailed field documentation directly from JSON Schema files. This ensures documentation always stays in sync with schema definitions and provides precise JSON type information.

### How It Works

The system uses [Wetzel](https://github.com/CesiumGS/wetzel) to automatically generate Markdown documentation from JSON Schema files, including:

- **Properties tables** with precise JSON types (e.g., `string`, `number []`, `string [2]`)
- **Field details** with validation rules, patterns, and constraints
- **Type information** extracted directly from the schema
- **Requirement status** for each field

### Enabling Documentation Generation

To enable automatic documentation for your extension:

1. **Create your extension** with a `schema.json` file
2. **Add placeholder markers** to your `README.md`:

```markdown
## Specification

<!-- GENERATED_SCHEMA_DOCS_START -->
### Fields

- `field1`: Basic description of field1
- `field2`: Basic description of field2
<!-- GENERATED_SCHEMA_DOCS_END -->
```

3. **Commit your changes** - the pre-commit hook will automatically generate detailed documentation

### Generated Documentation Format

The system replaces the placeholder content with:

- **Properties table** showing field names, JSON types, descriptions, and required status
- **Field details** sections with comprehensive type information, validation rules, and constraints

Example output:
```markdown
**`extension-name` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**version**|`string`|Version of the extension| ✓ Yes|
|**bbox**|`number` `[]`|Bounding box coordinates|No|

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

### Manual Documentation Updates

To manually update documentation for all extensions:

```bash
npm run update-docs
```

