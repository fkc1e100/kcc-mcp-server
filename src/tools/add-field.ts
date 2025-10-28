import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface AddFieldParams {
  resource: string;
  field_name: string;
  field_type: 'string' | 'int64' | 'bool' | 'object' | 'array';
  proto_path: string;
  parent_type?: string;
  description?: string;
  json_name?: string;
}

export function addField(
  repoPath: string,
  typesFile: string,
  params: AddFieldParams
): string {
  const filePath = join(repoPath, typesFile);
  let content = readFileSync(filePath, 'utf-8');

  // Determine Go type
  let goType: string;
  switch (params.field_type) {
    case 'string':
      goType = '*string';
      break;
    case 'int64':
      goType = '*int64';
      break;
    case 'bool':
      goType = '*bool';
      break;
    case 'array':
      goType = '[]string'; // Default, can be customized
      break;
    case 'object':
      goType = `*${params.resource}_${params.field_name}`;
      break;
    default:
      throw new Error(`Unsupported field type: ${params.field_type}`);
  }

  // JSON name (default to camelCase field name)
  const jsonName = params.json_name || toCamelCase(params.field_name);

  // Build field definition
  const fieldDef = buildFieldDefinition(
    params.field_name,
    goType,
    jsonName,
    params.proto_path,
    params.description
  );

  // Find insertion point
  const parentType = params.parent_type || `${params.resource}Spec`;
  const insertionPoint = findInsertionPoint(content, parentType);

  if (insertionPoint === -1) {
    throw new Error(
      `Could not find parent type: ${parentType}\n\n` +
        `Make sure the type exists in ${typesFile}`
    );
  }

  // Insert field
  const lines = content.split('\n');
  lines.splice(insertionPoint, 0, fieldDef);
  content = lines.join('\n');

  // Write back
  writeFileSync(filePath, content, 'utf-8');

  return `✅ Added field to ${typesFile}\n\n${fieldDef}`;
}

function buildFieldDefinition(
  fieldName: string,
  goType: string,
  jsonName: string,
  protoPath: string,
  description?: string
): string {
  const lines: string[] = [];

  // Add description comment if provided
  if (description) {
    lines.push(`\t// ${description}`);
  }

  // Add proto annotation
  lines.push(`\t// +kcc:proto=${protoPath}`);

  // Add field
  lines.push(`\t${fieldName} ${goType} \`json:"${jsonName},omitempty"\``);

  return lines.join('\n');
}

function findInsertionPoint(content: string, parentType: string): number {
  const lines = content.split('\n');

  // Find the parent type struct
  let inStruct = false;
  let lastFieldLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Found the struct definition
    if (line.includes(`type ${parentType} struct {`)) {
      inStruct = true;
      continue;
    }

    // Inside the struct, track last field line
    if (inStruct) {
      // Check if this is a field line (contains backticks for json tag)
      if (line.includes('`json:')) {
        lastFieldLine = i;
      }

      // End of struct
      if (line.trim() === '}') {
        // Insert before the closing brace
        return lastFieldLine + 1;
      }
    }
  }

  return -1;
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
