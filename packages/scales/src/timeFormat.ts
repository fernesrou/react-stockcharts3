import { timeSecond, timeMinute, timeHour, timeDay, timeWeek, timeMonth, timeYear } from "d3-time";
import { timeFormat as d3TimeFormat } from "d3-time-format";
import { toZonedTime, format as formatTz } from "date-fns-tz";

const formatMillisecond = d3TimeFormat(".%L");
const formatSecond = d3TimeFormat(":%S");
const formatMinute = d3TimeFormat("%H:%M");
const formatHour = d3TimeFormat("%H:%M");
const formatDay = d3TimeFormat("%e");
const formatWeek = d3TimeFormat("%e");
const formatMonth = d3TimeFormat("%b");
const formatYear = d3TimeFormat("%Y");

export const timeFormat = (date: Date, timezone?: string) => {
    if (timezone) {
        return timeFormatWithTimezone(date, timezone);
    }

    return (
        timeSecond(date) < date
            ? formatMillisecond
            : timeMinute(date) < date
            ? formatSecond
            : timeHour(date) < date
            ? formatMinute
            : timeDay(date) < date
            ? formatHour
            : timeMonth(date) < date
            ? timeWeek(date) < date
                ? formatDay
                : formatWeek
            : timeYear(date) < date
            ? formatMonth
            : formatYear
    )(date);
};

export const timeFormatWithTimezone = (date: Date, timezone: string): string => {
    const zonedDate = toZonedTime(date, timezone);

    // Determine the appropriate format based on the granularity
    if (timeSecond(date) < date) {
        return formatTz(zonedDate, ".SSS", { timeZone: timezone });
    } else if (timeMinute(date) < date) {
        return formatTz(zonedDate, ":ss", { timeZone: timezone });
    } else if (timeHour(date) < date) {
        return formatTz(zonedDate, "HH:mm", { timeZone: timezone });
    } else if (timeDay(date) < date) {
        return formatTz(zonedDate, "HH:mm", { timeZone: timezone });
    } else if (timeMonth(date) < date) {
        if (timeWeek(date) < date) {
            return formatTz(zonedDate, "d", { timeZone: timezone });
        }
        return formatTz(zonedDate, "d", { timeZone: timezone });
    } else if (timeYear(date) < date) {
        return formatTz(zonedDate, "MMM", { timeZone: timezone });
    }
    return formatTz(zonedDate, "yyyy", { timeZone: timezone });
};
