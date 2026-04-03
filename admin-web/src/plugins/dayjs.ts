import { extend } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/zh-cn';

export function setupDayjs() {
  extend(localeData);
}
