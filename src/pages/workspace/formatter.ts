import type {
  ListItem,
  ParentFormState,
  ChildFormState,
  CompanyFormState,
} from "./types";

export function extractId(item: ListItem): string {
  return String(item.id || item._id || item.uid || "");
}

export function matchesSearch(item: ListItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const term = search.toLowerCase();
  return Object.values(item)
    .map((value) => String(value || "").toLowerCase())
    .some((value) => value.includes(term));
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseIdList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getParentDocument(item: ListItem): string {
  return String(item.document || item.cpf || "");
}

export function normalizeDateInput(value: string): string {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export function toParentFormState(item: ListItem): ParentFormState {
  const address =
    item.address &&
    typeof item.address === "object" &&
    !Array.isArray(item.address)
      ? (item.address as Record<string, unknown>)
      : {};

  const children = Array.isArray(item.children)
    ? item.children.map((value) => String(value)).join(", ")
    : String(item.children || "");

  return {
    name: String(item.name || ""),
    document: normalizeDigits(getParentDocument(item)).slice(0, 11),
    email: String(item.email || ""),
    contact: normalizeDigits(String(item.contact || "")).slice(0, 11),
    birthDate: normalizeDateInput(String(item.birthDate || "")),
    children,
    addressStreet: String(address.street || ""),
    addressNumber: String(address.number || ""),
    addressDistrict: String(address.district || ""),
    addressCity: String(address.city || ""),
    addressState: String(address.state || ""),
    addressZipCode: normalizeDigits(String(address.zipCode || "")).slice(0, 8),
    addressComplement: String(address.complement || ""),
    addressCountry: String(address.country || ""),
  };
}

export function toChildFormState(item: ListItem): ChildFormState {
  const address =
    item.address &&
    typeof item.address === "object" &&
    !Array.isArray(item.address)
      ? (item.address as Record<string, unknown>)
      : {};

  const parents = Array.isArray(item.parents)
    ? item.parents.map((value) => String(value)).join(", ")
    : String(item.parents || "");

  return {
    name: String(item.name || ""),
    document: normalizeDigits(String(item.document || "")).slice(0, 11),
    email: String(item.email || ""),
    contact: normalizeDigits(String(item.contact || "")).slice(0, 11),
    birthDate: normalizeDateInput(String(item.birthDate || "")),
    parents,
    inheritParentAddress: false,
    addressStreet: String(address.street || ""),
    addressNumber: String(address.number || ""),
    addressDistrict: String(address.district || ""),
    addressCity: String(address.city || ""),
    addressState: String(address.state || ""),
    addressZipCode: normalizeDigits(String(address.zipCode || "")).slice(0, 8),
    addressComplement: String(address.complement || ""),
    addressCountry: String(address.country || ""),
  };
}

export function toCompanyFormState(item: ListItem): CompanyFormState {
  const address =
    item.address &&
    typeof item.address === "object" &&
    !Array.isArray(item.address)
      ? (item.address as Record<string, unknown>)
      : {};

  return {
    name: String(item.name || ""),
    legalName: String(item.legalName || ""),
    cnpj: normalizeDigits(String(item.cnpj || "")).slice(0, 14),
    contact: normalizeDigits(String(item.contact || "")).slice(0, 11),
    email: String(item.email || ""),
    addressStreet: String(address.street || ""),
    addressNumber: String(address.number || ""),
    addressDistrict: String(address.district || ""),
    addressCity: String(address.city || ""),
    addressState: String(address.state || ""),
    addressZipCode: normalizeDigits(String(address.zipCode || "")).slice(0, 8),
    addressComplement: String(address.complement || ""),
    addressCountry: String(address.country || ""),
  };
}

export function matchesParentSearch(item: ListItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const lowerSearch = search.trim().toLowerCase();
  const digitSearch = normalizeDigits(search);
  const name = String(item.name || "").toLowerCase();
  const document = getParentDocument(item);
  const documentDigits = normalizeDigits(document);

  if (name.includes(lowerSearch)) {
    return true;
  }

  if (!digitSearch) {
    return document.toLowerCase().includes(lowerSearch);
  }

  return documentDigits.includes(digitSearch);
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function isTimestampObject(value: unknown): value is {
  _seconds?: number;
  seconds?: number;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record._seconds === "number" || typeof record.seconds === "number"
  );
}

export function formatTimestamp(value: unknown): string {
  if (!isTimestampObject(value)) {
    return "";
  }

  const unixSeconds =
    typeof value._seconds === "number" ? value._seconds : value.seconds;

  if (typeof unixSeconds !== "number") {
    return "";
  }

  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return String(unixSeconds);
  }

  return date.toLocaleString("pt-BR");
}

export function sortByPriority(keys: string[], priority: string[]): string[] {
  return [...keys].sort((a, b) => {
    const indexA = priority.indexOf(a);
    const indexB = priority.indexOf(b);
    const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.localeCompare(b);
  });
}

export function flattenRecord(
  source: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey;

    if (isTimestampObject(rawValue)) {
      result[key] = formatTimestamp(rawValue);
      return;
    }

    if (
      rawValue &&
      typeof rawValue === "object" &&
      !Array.isArray(rawValue) &&
      !(rawValue instanceof Date)
    ) {
      Object.assign(
        result,
        flattenRecord(rawValue as Record<string, unknown>, key),
      );
      return;
    }

    if (Array.isArray(rawValue)) {
      result[key] = rawValue.map((item) => String(item)).join(", ");
      return;
    }

    result[key] =
      rawValue === null || rawValue === undefined ? "" : String(rawValue);
  });

  return result;
}

export function toFieldLabel(key: string): string {
  return key
    .split(".")
    .map((part) =>
      part
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim(),
    )
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" - ");
}

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskZipCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskByFieldKey(key: string, value: string): string {
  if (!value) {
    return value;
  }

  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "cnpj") {
    return maskCnpj(value);
  }

  if (normalizedKey.endsWith("zipcode") || normalizedKey.endsWith("zip_code")) {
    return maskZipCode(value);
  }

  if (normalizedKey === "contact" || normalizedKey.endsWith("phone")) {
    return maskPhone(value);
  }

  if (normalizedKey === "document") {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      return maskCpf(value);
    }

    if (digits.length === 14) {
      return maskCnpj(value);
    }
  }

  return value;
}
