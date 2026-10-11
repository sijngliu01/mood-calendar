const pad = (value: number) => String(value).padStart(2, '0');

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getNowFields() {
  const now = new Date();
  return { date: toDateKey(now), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
}

export function getGreeting(hour = new Date().getHours()) {
  if (hour < 5) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 23) return '晚上好';
  return '夜深了';
}

export function getLastDays(count: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (count - 1 - index));
    return toDateKey(date);
  });
}

export function getWeekday(dateKey: string) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseDateKey(dateKey).getDay()];
}

export function formatRecordDate(dateKey: string, todayKey = toDateKey(new Date())) {
  if (dateKey === todayKey) return `今天 · ${getWeekday(dateKey)}`;
  const date = parseDateKey(dateKey);
  const today = parseDateKey(todayKey);
  const year = date.getFullYear() === today.getFullYear() ? '' : `${date.getFullYear()}年`;
  return `${year}${date.getMonth() + 1}月${date.getDate()}日 · ${getWeekday(dateKey)}`;
}

export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === month - 1 };
  });
}
