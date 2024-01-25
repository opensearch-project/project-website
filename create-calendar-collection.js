const { existsSync } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('path');

// The oldest event in the system is in May 2021.
// This pre-dates the file naming convention of the 'YYYY-MMDD' prefix.
// The calendar collection will begin from May 2021, and will extend until
// whatever is the latest month indicated by files in the Events Collection.
const HARD_START_DATE = [2021, 5];

/**
 * Return the filenames within the specified directory treated as a list of entries of a Jekyll collection.
 * This means that file names with an underscore prefix are omitted from the returned array.
 * @param {string} eventsCollectionPath Path to the Events collection directory.
 * @returns {string[]}
 */
async function getEventsCollectionFileNames(eventsCollectionPath) {
    const fileNames = await fs.readdir(eventsCollectionPath);

    // Filter out filenames prefixed with an underscore as that is a Jekyll
    // convention to omit the collection entry from the build.
    const filteredFileNames = fileNames.filter(fileName => !fileName.startsWith('_'));
    return filteredFileNames;
}

/**
 * Returns a sorted, deduplicated array of the Event collection filenames mapped to an array in the format of [year, month].
 * Any filename that does not conform to the naming convention of beginning with the event date as YYYY-MMDD will be omitted.
 * @param {string[]} fileNames Array of Event collection filenames.
 * @returns {number[]}
 */
function parseYearMonthPairsFromFileNames(fileNames) {
    const parsedFileNames = fileNames.map(fileName => {
        const pattern = /^(\d{4})-(\d{2})/;
        const matches = pattern.exec(fileName);
        if (matches) {
            const parsedYear = Number.parseInt(matches[1], 10);
            const parsedMonth = matches[2].startsWith('0') ?
                Number.parseInt(matches[2].charAt(1), 10) :
                Number.parseInt(matches[2], 10);
            return [parsedYear, parsedMonth];
        }
        return null;
    });
    const filteredParsedFileNames = parsedFileNames.filter(parsedData => !!parsedData);

    // Since only the year and month, and not the day in the filename is of concern then
    // it is reasonable to deduplicate the array.
    const deDuplicatedFileNames = Object.values(filteredParsedFileNames.reduce((carry, current) => {
        const joinedPair = current.join('-');
        if (typeof carry[joinedPair] === 'undefined') {
            carry[joinedPair] = current;
        }
        return carry;
    }, {}));

    // Fill in the gap from HARD_START_DATE up to the [year, month]
    // before the first entry. 
    const [firstYear, firstMonth] = deDuplicatedFileNames[0];
    const numberOfYearsGreaterThanHardStart = firstYear - HARD_START_DATE[0];
    let numberOfMonthsToPrepend = (numberOfYearsGreaterThanHardStart * 12) - (HARD_START_DATE[1] + firstMonth - 1);
    let currentMonthToPrepend = firstMonth > 1 ? firstMonth - 1 : 12;
    let currentYearToPrepend = currentMonthToPrepend !== 12 ? firstYear : firstYear - 1;
    while (numberOfMonthsToPrepend >= 0) {
        const monthYearPairToPrepend = [currentYearToPrepend, currentMonthToPrepend];
        deDuplicatedFileNames.unshift(monthYearPairToPrepend);
        if (currentMonthToPrepend > 1) {
            currentMonthToPrepend -= 1;
        } else {
            currentMonthToPrepend = 12;
        }
        if (currentMonthToPrepend === 12) {
            currentYearToPrepend -= 1;
        }
        --numberOfMonthsToPrepend;
    }
    return deDuplicatedFileNames;
}

/**
 * Returns the number of days in the month respecting leap years in the case of February where the index is 1.
 * Note that months are treated as a zero-based index like the JavaScript Date type.
 * @param {number} year 
 * @param {number} monthIndex 
 * @returns number
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
 * Returns a Calendar collection entry file data formatted according to what is expected by the Calendar layout template.
 * The Calendar collection folder contains a _sample.md file that details the expected Front Matter.
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
 * @param {number[]} yearMonth Array of numbers definining [year, month]
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
    const yearMonthPairs = parseYearMonthPairsFromFileNames(eventsFileNames);
    for (let i = 0; i < yearMonthPairs.length; ++i) {
        const yearMonth = yearMonthPairs[i];
        const calendarData = createCalendarCollectionEntryData(yearMonth);
        const calendarPath = createCalendarCollectionEntryPath(yearMonth, '_calendars_TEST');
        try {
            await writeCalendarCollectionEntryFile(calendarPath, calendarData);
        } catch (error) {
            console.error(error);
        }
    }
}).catch(console.error);
