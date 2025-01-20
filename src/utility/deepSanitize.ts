import sanitizeHtml from 'sanitize-html';

function deepSanitize<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }) as T;  // Ensuring sanitized string is returned with the same type T
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize) as T;  // Recursively sanitize array elements
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = deepSanitize(value[key as keyof T]);
      return acc;
    }, {}) as T;  // Recursively sanitize object properties
  }
  return value;  // For non-string, non-object types, return the value as is
}

export default deepSanitize;
