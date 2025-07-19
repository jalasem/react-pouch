import type { SimplePlugin } from "../core/types";

interface SchemaDefinition {
  [key: string]: string | SchemaDefinition;
}

function validateSchema(
  value: any,
  schema: SchemaDefinition,
  path: string = ""
): void {
  for (const [key, expectedType] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${key}` : key;
    const actualValue = value[key];

    if (actualValue === undefined) {
      throw new Error(`Missing required field: ${currentPath}`);
    }

    if (typeof expectedType === "string") {
      const actualType = Array.isArray(actualValue)
        ? "array"
        : typeof actualValue;
      if (actualType !== expectedType) {
        throw new Error(
          `Invalid type for ${currentPath}: expected ${expectedType}, got ${actualType}`
        );
      }
    } else {
      validateSchema(actualValue, expectedType, currentPath);
    }
  }
}

export function schema<T>(schemaDefinition: SchemaDefinition): SimplePlugin<T> {
  return {
    onSet(newValue: T): void {
      validateSchema(newValue, schemaDefinition);
    },
  };
}
