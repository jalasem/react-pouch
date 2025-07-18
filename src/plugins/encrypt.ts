import type { Plugin } from "../core/types";

// Simple XOR encryption for demo - use proper encryption in production!
function simpleEncrypt(text: string, key: string): string {
  return btoa(
    text
      .split("")
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      )
      .join("")
  );
}

function simpleDecrypt(encrypted: string, key: string): string {
  return atob(encrypted)
    .split("")
    .map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join("");
}

export function encrypt<T>(secretKey: string): Plugin<T> {
  const PREFIX = "encrypted:";

  return {
    initialize(value: T): T {
      if (typeof value === "string" && value.startsWith(PREFIX)) {
        try {
          const decrypted = simpleDecrypt(
            value.slice(PREFIX.length),
            secretKey
          );
          return JSON.parse(decrypted);
        } catch (error) {
          console.error("Failed to decrypt:", error);
          return value;
        }
      }
      return value;
    },

    onSet(newValue: T): T {
      try {
        const serialized = JSON.stringify(newValue);
        if (serialized === undefined) {
          // Cannot encrypt undefined
          return newValue;
        }
        const encrypted = simpleEncrypt(serialized, secretKey);
        return (PREFIX + encrypted) as any;
      } catch (error) {
        console.error("Failed to encrypt:", error);
        return newValue;
      }
    },
  };
}
