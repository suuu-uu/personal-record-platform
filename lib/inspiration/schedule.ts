export const INSPIRATION_TIMEZONE = "Asia/Shanghai";

const parts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat("en-US", {
  timeZone: INSPIRATION_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).formatToParts(date).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));

export function monthKeyInShanghai(date = new Date()) {
  const p = parts(date);
  return `${p.year}-${p.month}`;
}

export function isShanghaiMonthEndMidnight(date = new Date()) {
  const p = parts(date);
  if (p.hour !== "00" || p.minute !== "00") return false;
  const nextMonth = new Date(Date.UTC(Number(p.year), Number(p.month), 1));
  const lastDay = new Date(nextMonth.getTime() - 86400000).getUTCDate();
  return Number(p.day) === lastDay;
}

export function scheduledForUtc(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  // 上海月末 00:00 = 下月 1 日 00:00（上海）= 下月 1 日 16:00（UTC 前一天）
  return new Date(Date.UTC(year, month, 1, -8, 0, 0));
}

export function isMonthKey(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
