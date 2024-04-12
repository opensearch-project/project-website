const { existsSync } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('path');
const matter = require('gray-matter');

/**
 * Return the filenames within the specified directory treated as a list of entries of a Jekyll collection.
 * This means that file names with an underscore prefix are omitted from the returned array.
 * @param {string} eventsCollectionPath Path to the Events collection directory.
 * @returns {Promise<string[]>}
 */
async function getEventsCollectionFileNames(eventsCollectionPath) {
    const fileNames = await fs.readdir(eventsCollectionPath);

    // Filter out filenames prefixed with an underscore as that is a Jekyll
    // convention to omit the collection entry from the build.
    const filteredFileNames = fileNames.filter(fileName => !fileName.startsWith('_'));
    return filteredFileNames;
}

/**
 * Returns an array of number arrays that represent [year, month] pairs extracted from event collection entries.
 * @param {object[]} openSearchEvents Array of event collection data.
 * @returns {number[]} Array of number arrays representing [year, month] pairs.
 */
function aggregateDeduplicatedYearMonthPairs(openSearchEvents) {
    const yearMonthPairs = openSearchEvents.reduce((carry, current) => {
        const { calendar_date } = current;
        const datePartsPattern = /^(20\d{2})-(\d{2})/;
        const datePartsMatches = datePartsPattern.exec(calendar_date);
        if (datePartsMatches) {
            const year = Number.parseInt(datePartsMatches[1], 10);
            const month = Number.parseInt(datePartsMatches[2], 10);
            if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month && month <= 12) {
                const pairAlreadyExists = carry.findIndex(([y, m]) => y === year && m === month);
                if (pairAlreadyExists === -1) {
                    return [...carry, [year, month]];
                }
            }
        }
        return carry;
    }, []);
    return yearMonthPairs;
}

/**
 * Returns a Promise resolved with an object matching shape of OpenSearchEvent containing the data parsed from the specfied Events collection file.
 * @param {string} eventFilePath Fully qualified path to an Events collection file.
 * @returns {Promise<OpenSearchEvent>}
 * @throws {Error}
 */
async function readOpenSearchEvent(eventFilePath) {
    try {
        const eventFileData = await fs.readFile(eventFilePath, { encoding: 'utf8' });
        const parsedEventData = matter(eventFileData);
        const parsedFrontMatter = Object.entries(parsedEventData.data);
        const openSearchEvent = parsedFrontMatter.reduce((event, parsedEntryData) => {
            const [key, value] = parsedEntryData;
            return {
                [key]: value,
                ...event,
            };
        }, {});
        openSearchEvent.content = parsedEventData.content;
        return openSearchEvent;
    } catch (error) {
        console.error(`Unable to read events collection file ${eventFilePath}`);
        console.error(error.message);
        return null;
    }
}

/**
 * Returns the number of days in the month respecting leap years in the case of February where the index is 1.
 * Note that months are treated as a zero-based index like the JavaScript Date type.
 * @param {number} year 
 * @param {number} monthIndex 
 * @returns {number}
 */
function getDaysInMonth(year, monthIndex) {
    const daysInMonth = [
        31,
        year % 4 === 0 ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    const dayCount = daysInMonth[monthIndex];
    return dayCount;
}

/**
 * Returns the number of days to count back to get from dayName to sunday.
 * @param {string} dayName Lowercase long name of the weekday.
 * @returns {number}
 */
function getCountOfDaysToSunday(dayName) {
    const weekdayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ];
    const indexOfDayName = weekdayNames.indexOf(dayName);
    const dayCount = indexOfDayName > 0 ? -indexOfDayName : 0;
    return dayCount;
}

/**
 * Returns the number of days to count forward to get from dayName to saturday.
 * @param {string} dayName Lowercase long name of the weekday.
 * @returns {number}
 */
function getCountOfDaysToSaturday(dayName) {
    const weekdayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ];
    const indexOfDayName = weekdayNames.indexOf(dayName);
    const dayCount = weekdayNames.length - 1 - indexOfDayName;
    return dayCount;
}

/**
 * Returns a Calendar collection entry file data string that is formatted according to what is expected by the Calendar layout template.
 * The Calendar collection folder contains a _sample.md file that details the expected Front Matter.
 * Also the template logic in the calendar layout template may be useful (_layouts/calendar.html).
 * @param {number[]} yearMonth Array of numbers defining [year, month].
 * @returns {string}
 */
function createCalendarCollectionEntryData(yearMonth) {

    const [year, month] = yearMonth;
    const monthIndex = month - 1;
    const previousMonthYear = monthIndex > 0 ? year : year - 1;
    const previousMonthIndex = monthIndex > 0 ? monthIndex - 1 : 11;
    const previousMonthEndDay = getDaysInMonth(previousMonthYear, previousMonthIndex);
    const hoursOffsetBetweenLocalAndUTC = (new Date()).getTimezoneOffset() / 60;
    const firstOfMonthDate = new Date(Date.UTC(year, monthIndex, 1, hoursOffsetBetweenLocalAndUTC));
    const endOfPreviousMonthDate = new Date(Date.UTC(previousMonthYear, previousMonthIndex, previousMonthEndDay, hoursOffsetBetweenLocalAndUTC));
    const firstOfMonthWeekDayName = firstOfMonthDate.toLocaleDateString('en-US', {
        weekday: 'long',
    }).toLowerCase();
    const calendarMonthName = firstOfMonthDate.toLocaleDateString('en-US', {
        month: 'long',
    }).toLowerCase();
    const formattedMonthNumber = month < 10 ? `0${month}` : `${month}`;
    const firstSundayDayOffset = getCountOfDaysToSunday(firstOfMonthWeekDayName);
    let firstSundayDate;
    if (firstSundayDayOffset !== 0) {
        const dateOffsetFromEndOfPreviousMonth = firstSundayDayOffset + 1;
        firstSundayDate = new Date(endOfPreviousMonthDate);
        firstSundayDate.setUTCDate(firstSundayDate.getUTCDate() + dateOffsetFromEndOfPreviousMonth);
    } else {
        firstSundayDate = new Date(firstOfMonthDate);
    }
    const calendarMonthEndDay = getDaysInMonth(year, monthIndex);
    const endOfMonthDate = new Date(Date.UTC(year, monthIndex, calendarMonthEndDay, hoursOffsetBetweenLocalAndUTC));
    const endOfMonthDayName = endOfMonthDate.toLocaleDateString('en-US', {
        weekday: 'long',
    }).toLowerCase();
    const lastSaturdayDayOffset = getCountOfDaysToSaturday(endOfMonthDayName);
    let lastSaturdayDate;
    if (lastSaturdayDayOffset !== 0) {
        const nextMonthIndex = monthIndex < 11 ? monthIndex + 1 : 0;
        const nextMonthYear = nextMonthIndex > 0 ? year : year + 1;
        const nextMonthFirstSaturdayDate = lastSaturdayDayOffset;
        lastSaturdayDate = new Date(Date.UTC(nextMonthYear, nextMonthIndex, nextMonthFirstSaturdayDate, hoursOffsetBetweenLocalAndUTC));
    } else {
        lastSaturdayDate = new Date(endOfMonthDate);
    }
    let numberOfDaysFromPreviousMonth = previousMonthEndDay - firstSundayDate.getUTCDate() + 1;
    if (firstSundayDate.getUTCMonth() === monthIndex) {
        numberOfDaysFromPreviousMonth = 0;
    }
    let numberOfDaysFromNextMonth = lastSaturdayDate.getUTCDate();
    if (lastSaturdayDate.getUTCMonth() === monthIndex) {
        numberOfDaysFromNextMonth = 0;
    }
    const numberOfDaysInCalendar = numberOfDaysFromPreviousMonth + calendarMonthEndDay + numberOfDaysFromNextMonth;
    const NUMBER_OF_DAYS_IN_WEEK = 7;
    const numberOfWeeksInCalendar = numberOfDaysInCalendar / NUMBER_OF_DAYS_IN_WEEK;
    const firstSundayDateUTCMonth = firstSundayDate.getUTCMonth() + 1;
    const lastSaturdayDateUTCMonth = lastSaturdayDate.getUTCMonth() + 1;
    const firstSundayUTCDate = firstSundayDate.getUTCDate();
    const lastSaturdayUTCDate = lastSaturdayDate.getUTCDate();
    const formattedDateOfFirstSunday = `${firstSundayDate.getUTCFullYear()}-${firstSundayDateUTCMonth < 10 ? `0${firstSundayDateUTCMonth}` : firstSundayDateUTCMonth}-${firstSundayUTCDate < 10 ? `0${firstSundayUTCDate}` : firstSundayUTCDate}`;
    const formattedDateOfLastSaturday = `${lastSaturdayDate.getUTCFullYear()}-${lastSaturdayDateUTCMonth < 10 ? `0${lastSaturdayDateUTCMonth}` : lastSaturdayDateUTCMonth}-${lastSaturdayUTCDate < 10 ? `0${lastSaturdayUTCDate}` : lastSaturdayUTCDate}`;

    const calendarEntryTpl = `---
layout: calendar
year: ${year}
month_index: ${monthIndex}
month_number: ${month}
date_of_first_sunday: '${formattedDateOfFirstSunday}'
date_of_last_saturday: '${formattedDateOfLastSaturday}'
calendar_view_week_count: ${numberOfWeeksInCalendar}
title: Events Calendar
breadcrumbs:
  icon: community
  items:
    - title: Community
    - title: Events
      url: '/events/calendar/${year}/${calendarMonthName}/'
permalink: '/events/calendar/${year}/${calendarMonthName}/'
redirect_from: '/events/calendar/${year}-${formattedMonthNumber}.html'
---
`
    return calendarEntryTpl;
}

/**
 * Returns the full path to a Calendar collection entry for the specified year and month pair.
 * Note: Parametrizing the directory name was useful during testing.
 * @param {number[]} yearMonth Array of numbers definining [year, month]
 * @param {string} dirName Name of the destination subdirectory to place the file; defaults to '_calendars'.
 * @returns {string}
 */
function createCalendarCollectionEntryPath(yearMonth, dirName = '_calendars') {
    const [year, month] = yearMonth;
    const calendarFileName = `${year}-${month < 10 ? `0${month}` : month}.md`;
    const calendarPath = path.join(__dirname, dirName, calendarFileName);
    return calendarPath;
}

/**
 * Write the file data to the specified path.
 * If a file at the specified path already exists then it is not overwritten.
 * @param {string} path Calendar collection entry destination path.
 * @param {string} data Calendar collection entry file data.
 * @returns {Promise<string>} Returns a Promise resolved with the file path.
 */
async function writeCalendarCollectionEntryFile(path, data) {
    const fileAlreadyExists = existsSync(path);
    if (fileAlreadyExists) {
        return path;
    }
    await fs.writeFile(path, data, 'utf8');
    return path;
}

const eventsPath = path.join(__dirname, '_events');
getEventsCollectionFileNames(eventsPath).then(async (eventsFileNames) => {
    const openSearchEvents = [];
    for (let i = 0; i < eventsFileNames.length; ++i) {
        const fileName = eventsFileNames[i];
        const fullEventPath = path.join(eventsPath, fileName);
        const openSearchEvent = await readOpenSearchEvent(fullEventPath);
        if (openSearchEvent) {
            openSearchEvents.push(openSearchEvent);
        }
    }
    openSearchEvents.sort((a, b) => {
        const aEventDate = Date.parse(a.eventdate);
        const bEventDate = Date.parse(b.eventdate);

        if (aEventDate < bEventDate) {
            return -1;
        } else if (aEventDate > bEventDate) {
            return 1;
        }
        return 0;
    });
    const yearMonthPairs = aggregateDeduplicatedYearMonthPairs(openSearchEvents);
    for (let i = 0; i < yearMonthPairs.length; ++i) {
        const yearMonth = yearMonthPairs[i];
        const calendarData = createCalendarCollectionEntryData(yearMonth);
        const calendarPath = createCalendarCollectionEntryPath(yearMonth);
        try {
            await writeCalendarCollectionEntryFile(calendarPath, calendarData);
        } catch (error) {
            console.error(error);
        }
    }
}).catch(console.error);
