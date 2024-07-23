import { getTimeZones } from '@vvo/tzdb';
import humanizeDurationUtil from 'humanize-duration';
import type { Falsy, IntentionalAny } from 'src/types';

export function array<T = unknown>(t: T | T[]): T[] {
  return Array.isArray(t) ? t : [t];
}

export function filterOutFalsy<T>(
  items: (T | Falsy)[],
): Exclude<T, Falsy>[] {
  return items.filter(item => Boolean(item)) as Exclude<T, Falsy>[];
}

/**
 * Returns the intersection of two arrays (in the order of a)
 * @param a An array
 * @param b An array
 * @param comparator (optional) A comparator function for two elements
 *   (one from a and one from b).
 */
export function getIntersection<T>(
  a: T[],
  b: T[],
  comparator: (elA: T, elB: T) => boolean,
): T[] {
  return a.filter(elA => {
    return b.some(elB => {
      return comparator(elA, elB);
    });
  });
}

/**
 * Cuts text to a certain length and if the text exceeds the length, appends an ellipsis to the end.
 */
export function shorten(msg: string, length: number): string {
  if (msg.length <= length) return msg;
  return `${msg.substring(0, length)}...`;
}

/**
 * For parsing command input of delays. Note that this function is NOT used for parsing input of dates.
 * Throws an error if it's not parsable.
 * TODO: support weeks, months and years as well
 * @param {string} arg Some string representation of time, e.g. "600" or "10 minutes" or "July 10th".
 *   If the argument is purely numeric, then it will be treated as milliseconds.
 * @returns An integer representing the number of milliseconds for delay.
 */
export function parseDelay(arg: string): number {
  arg = arg.trim();
  const pureDigits = /^\d+$/;
  const milliseconds = /\d+\s?(ms|milliseconds?)$/;
  const secs = /\d+\s?(s|secs?|seconds?)$/;
  const mins = /\d+\s?(m|mins?|minutes?)$/;
  const hours = /\d+\s?(hr?|hours?)$/;
  const days = /\d+\s?(d|days?)$/;
  if (pureDigits.test(arg)) {
    return parseInt(arg, 10);
  }
  const numericalMatch = arg.match(/\d+/);
  const numericalPart = numericalMatch ? parseInt(numericalMatch[0], 10) : null;
  let unitMultiplier: number | null = null;
  if (milliseconds.test(arg)) {
    unitMultiplier = 1;
  }
  if (secs.test(arg)) {
    unitMultiplier = 1000;
  }
  if (mins.test(arg)) {
    unitMultiplier = 60 * 1000;
  }
  if (hours.test(arg)) {
    unitMultiplier = 60 * 60 * 1000;
  }
  if (days.test(arg)) {
    unitMultiplier = 24 * 60 * 60 * 1000;
  }
  if (!numericalPart || !unitMultiplier) {
    throw new Error(`Could not parse delay: ${arg}`);
  }
  return numericalPart * unitMultiplier;
}

/**
 * Finds the current time zone offset (account for daylight savings time) by abbreviation or name.
 * If there are multiple abbreviations, the preferredName arg will be used to figure out which abbreviation to prefer.
 */
export function getTimezoneOffsetFromFilter(filter: string): number | null {
  if (filter.toLowerCase() === 'utc') return 0;
  const timeZones = getTimeZones();
  const filteredZones = timeZones.filter(tz => {
    return (
      tz.abbreviation.toLowerCase() === filter.toLowerCase()
      || tz.name.toLowerCase() === filter.toLowerCase()
      || Boolean(tz.group.find(tzName => tzName.toLowerCase() === filter.toLowerCase()))
    );
  });
  const tzOffset: number | undefined = filteredZones[0]?.currentTimeOffsetInMinutes;
  if (!tzOffset) return null;
  return tzOffset - new Date().getTimezoneOffset();
}

/**
 * Accepts epochTime in seconds
 */
export function getDateString(epochTime: number): string {
  return new Date(epochTime * 1000).toISOString();
}

export function humanizeDuration(durationMs: number): string {
  return humanizeDurationUtil(durationMs, {
    maxDecimalPoints: 0,
  });
}

export function getClockString(durationMs: number, minPortionLength = 0): string {
  const secondsInMs = 1000;
  const minutesInMs = 60 * secondsInMs;
  const hoursInMs = 60 * minutesInMs;
  const numHours = Math.floor(durationMs / hoursInMs);
  durationMs -= numHours * hoursInMs;
  const numMins = Math.floor(durationMs / minutesInMs);
  durationMs -= numMins * minutesInMs;
  const numSecs = Math.floor(durationMs / secondsInMs);
  return [numHours, numMins, numSecs].reduce((acc, portion, i, portions) => {
    const isRequired = (portions.length - minPortionLength) <= i;
    if (!acc && !portion && !isRequired) return '';
    const formatted = String(portion).padStart(2, '0');
    if (acc) return `${acc}:${formatted}`;
    return formatted;
  }, '') || '0';
}

export function getSecondsFromClockString(clockString: string): number {
  const clockStringRegex = /^(\d{1,2}:){0,2}(\d{1,2})$/;
  if (!clockStringRegex.test(clockString)) throw new Error('Clock string is not formatted properly');
  const parts = clockString.split(':');
  return parts.reverse().reduce((acc, part, i) => {
    // only supports up to hours, so this exponential logic works
    return acc + (60 ** i) * Number(part);
  }, 0);
}

export function getSecondsFromUrlTimestamp(urlTimestamp: string): number {
  // (?![^\d]|$) specifies that the string must have some digits
  const urlTimestampRegex = /(^\d+$)|(^(?![^\d]|$)(\d+h)?(\d+m)?(\d+s)?$)/;
  if (!urlTimestampRegex.test(urlTimestamp)) throw new Error('URL timestamp is not formatted properly');

  if (/^\d+$/.test(urlTimestamp)) return Number(urlTimestamp);

  const match = urlTimestamp.match(/((\d+)h)?((\d+)m)?((\d+)s)?/);
  const hours = match?.[2] || '0';
  const minutes = match?.[4] || '0';
  const seconds = match?.[6] || '0';

  return Number(seconds) + Number(minutes) * 60 + Number(hours) * 60 ** 2;
}

/**
 * Randomize array in-place using Durstenfeld shuffle algorithm.
 * https://stackoverflow.com/a/12646864/2554605
 */
export function shuffleArray<T = unknown>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function testUrl(href: string, tests: {
  origin: RegExp,
  path?: RegExp,
  search?: RegExp,
}): boolean {
  try {
    const { origin, pathname, search } = new URL(href);
    return tests.origin.test(origin)
      && (!tests.path || tests.path.test(pathname))
      && (!tests.search || tests.search.test(search));
  } catch {
    return false;
  }
}

export function isYoutubeLink(str: string): boolean {
  return testUrl(str, {
    origin: /^https:\/\/(www.)?youtube.com$/,
    path: /^\/watch$/,
    search: /^\?.*v=[\da-zA-Z_-]+/,
  });
}

export function getRandomElement<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const TWITCH_ORIGIN_REGEX = /^https:\/\/(www\.)?twitch\.tv$/;

export function isTwitchVodLink(str: string): boolean {
  return testUrl(str, {
    origin: TWITCH_ORIGIN_REGEX,
    path: /^\/videos\/\d+$/,
  });
}

export function isTwitchLivestreamLink(str: string): boolean {
  return testUrl(str, {
    origin: TWITCH_ORIGIN_REGEX,
    path: /^\/[^/]+$/,
  });
}

export function isRedditLink(str: string): boolean {
  return testUrl(str, {
    origin: /^https:\/\/(www\.)?reddit\.com/,
  });
}

export function isTwitterLink(str: string): boolean {
  return testUrl(str, {
    origin: /^https:\/\/(www\.)?(twitter|x)\.com$/,
    path: /^\/[^/]+\/status\/\d+$/,
  });
}

export function chunkString(str: string, size: number): string[] {
  const chunks = [];
  for (let i = 0; i * size < str.length; i++) {
    const start = i * size;
    chunks.push(str.slice(start, start + size));
  }
  return chunks;
}

export const getUniqueId = (() => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
})();

export function isNumber(input: unknown): input is number {
  return !Number.isNaN(Number(input));
}

export function isValidKey<T extends object>(obj: T, key: keyof IntentionalAny): key is keyof T {
  return key in obj;
}

export function camelCaseToSnakeCase(input: string): string {
  return input.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function isUuid(input: string): boolean {
  // This is not strictly correct since invalid UUIDv4s will pass this regex, but it covers the validation we're after
  return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(input);
}

export function notUuidValidator(input: string): void {
  if (isUuid(input)) throw new Error('Do not use UUIDs for custom IDs');
}
