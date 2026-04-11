declare global {
  interface String {
    toFixed(digits?: number): string;
  }
}

const stringProto = String.prototype as String & { toFixed?: (digits?: number) => string };

if (typeof stringProto.toFixed !== "function") {
  Object.defineProperty(String.prototype, "toFixed", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function toFixedFromString(this: string, digits: number = 0): string {
      const parsed = Number(this);
      if (!Number.isFinite(parsed)) return "0";
      return parsed.toFixed(digits);
    },
  });
}

export {};
