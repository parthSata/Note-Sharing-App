const TIME_ZONE_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME_WITHOUT_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;

export function parseDatabaseUtcTimestamp(value: Date | string) {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds(),
      ),
    );
  }

  const trimmedValue = value.trim();

  if (
    TIME_ZONE_OFFSET_PATTERN.test(trimmedValue) ||
    !DATE_TIME_WITHOUT_ZONE_PATTERN.test(trimmedValue)
  ) {
    return new Date(trimmedValue);
  }

  return new Date(`${trimmedValue.replace(' ', 'T')}Z`);
}

export function serializeDatabaseUtcTimestamp(value: Date | string) {
  return parseDatabaseUtcTimestamp(value).toISOString();
}

export function serializeNullableDatabaseUtcTimestamp(
  value: Date | string | null,
) {
  return value ? serializeDatabaseUtcTimestamp(value) : null;
}
