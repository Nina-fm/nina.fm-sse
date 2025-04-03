import { DateTime } from 'luxon';

export default function parseAirTimeDate(date: string) {
  return DateTime.fromFormat(date.replace(/\.\d+$/, ''), 'yyyy-MM-dd HH:mm:ss');
}
