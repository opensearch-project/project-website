require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('node:fs/promises');
const path = require('path');
const mockMeetupEvents = require('./mock_meetup_events.json');

class EventCategory {
    
    static COMMUNITY = 'community';
    static DEVELOPMENT = 'development';
    static EVENTS = 'events';
    static isValidOrDefault(categoryName) {
        const validCategoryNames = [
            EventCategory.COMMUNITY,
            EventCategory.DEVELOPMENT,
            EventCategory.EVENTS,
        ];
        const defaultCategoryName = EventCategory.COMMUNITY;
        if (validCategoryNames.includes(categoryName)) {
            return categoryName;
        }
        return defaultCategoryName;
    }
}

class EventPhysicalLocation {

    /**
     * The name of the location city.
     * @property {string} city
     */
    city = '';

    /**
     * The name of the location country.
     * @property {string} country
     */
    country = '';

    constructor(city, country) {
        this.city = city;
        this.country = country;
    }
}

class EventSignupLinkDetails {

    /**
     * URL of the event signup page.
     * @property {string} url
     */
    url = '';

    /**
     * Title of the event signup button / link.
     */
    title = '';
}

class OpenSearchEvent {

    /**
     * The date of the event, without time, as a string to appear in the calendar view in the format of YYYY-MM-DD.
     * @property {string} calendar_date
     */
    calendar_date = '';

    /**
     * Event date and time (24 hr) here (mind the time-zone and daylight saving time!).
     * @property {string} eventdate 
     */
    eventdate = '';

    /**
     * Optional end date if the event last multiple days.
     * @propety {string} enddate
     */
    enddate = '';

    /**
     * The title - this is how it will show up in listing and headings on the site
     * @property {string} title
     */
    title = '';

    /**
     * Whether or not the event is online.
     * @property {boolean} online
     */
    online = true;

    /**
     * The location timezone.
     * @property {string} tz
     */
    tz = '';

    /**
     * The physical event location for non-online events.
     * @property {EventPhysicalLocation} location
     */
    location = null;

    /**
     * Event signup link / button details to render in the template.
     * @property {EventSignupLinkDetails} signup
     */
    signup = null;

    /**
     * Event category name. Valid values are defined as static properties of the EventCategory class.
     * @see {EventCategory} 
     * @property {string} category
     * @default 'community'
     */
    category = 'community';

    /**
     * The markdown content of the event after the Front Matter.
     * @property {string} content
     */ 
    content = '';
}

function signJWT(clientKey, memberId, signingKeyId, privateKey) {
    return jwt.sign(
        {},
        privateKey,
        {
            algorithm: 'RS256',
            issuer: clientKey,
            subject: memberId,
            audience: 'api.meetup.com',
            keyid: signingKeyId,
            expiresIn: 120
        },
    );
}

function transformMeetupEventDateTimeToCalendarDate(dateTime) {
    const splitDateTime = dateTime.split('T');
    const datePart = splitDateTime[0];
    return datePart;
}

/**
 * 
 * @param {string} dateTime 
 * @returns {string}
 */
function transformMeetupEventDateTimeToOpenSearchEventDate(dateTime) {

    // Example meetup date time: "2023-11-13T08:00-08:00"
    // Example desired output for Jekyll: 2023-11-13 08:00 -0800
    const splitDateTime = dateTime.split('T');
    const plusOrMinusPattern = /\+|\-/;
    const plusOrMinusMatches = plusOrMinusPattern.exec(splitDateTime[1]);
    const timeZoneOffsetPlusOrMinus = plusOrMinusMatches[0];
    const splitTime = splitDateTime[1].split(timeZoneOffsetPlusOrMinus);
    const formattedTimeZoneOffset = splitTime[1].replace(':', '');
    const openSearchEventDate = `${splitDateTime[0]} ${splitTime[0]} ${timeZoneOffsetPlusOrMinus}${formattedTimeZoneOffset}`;
    return openSearchEventDate;
}

/**
 * Extract the properties of an event edge node in the GraphQL schema required for an Event
 * Jekyll collection entry and return that object.
 * @param {object} meetupEventEdge 
 * @returns {OpenSearchEvent}
 */
function transformMeetupEventToOpenSearchEvent(meetupEventEdge) {
    const calendar_date = transformMeetupEventDateTimeToCalendarDate(meetupEventEdge.dateTime);
    const eventdate = transformMeetupEventDateTimeToOpenSearchEventDate(meetupEventEdge.dateTime);
    const enddate = transformMeetupEventDateTimeToOpenSearchEventDate(meetupEventEdge.endTime);
    const { venue } = meetupEventEdge;
    let location = null;
    if ((venue?.city ?? '') !== '' && (venue?.country ?? '') !== '') {
        location = new EventPhysicalLocation(venue.city, venue.country);
    }
    const openSearchEvent = {
        calendar_date,
        eventdate,
        enddate,
        title: meetupEventEdge.title,
        online: meetupEventEdge ? 'true' : 'false',
        tz: meetupEventEdge.timezone,
        location,
        signup: {
            url: meetupEventEdge.eventUrl,
            title: 'Join on Meetup',
        },
        category: EventCategory.COMMUNITY, 
        content: meetupEventEdge.description, 
    };
    return openSearchEvent;
}

/**
 * Transform the data properties of an OpenSearchEvent model into the Front Matter + Markdown
 * text required for an Event Jekyll collection entry file contents.
 * @param {OpenSearchEvent} openSearchEvent 
 * @returns {string}
 */
function transformOpenSearchEventToMarkdownFileContent(openSearchEvent) {

    const endDate = openSearchEvent.enddate ? `enddate: ${openSearchEvent.enddate}` : '';
    const timeZone = openSearchEvent.tz ? `tz: ${openSearchEvent.tz}` : '';

    const location = openSearchEvent.location ? `location:
  city: ${openSearchEvent.location.city}
  country: ${openSearchEvent.location.country}
` : '';

    const formattedMarkdownFileContent =  `---
calendar_date: '${openSearchEvent.calendar_date}'
eventdate: ${openSearchEvent.eventdate}
${endDate}
title: ${openSearchEvent.title}
online: ${openSearchEvent.online ? 'true' : 'false'}
${timeZone}
${location}
signup:
  url: ${openSearchEvent.signup.url}
  title: ${openSearchEvent.signup.title}
category: ${EventCategory.isValidOrDefault(openSearchEvent.category)}
---
${openSearchEvent.content}
`;

    return formattedMarkdownFileContent;
}

function createEventCollectionEntryFileName(openSearchEvent) {
    const { title, eventdate } = openSearchEvent;
    const dateTimeParts = eventdate.split(' ');
    const datePart = dateTimeParts[0];
    const yearMonthDay = datePart.split('-');
    const dateFormattedForFileName = `${yearMonthDay[0]}-${yearMonthDay[1]}${yearMonthDay[2]}`;
    const titleFormattedForFileName = title.replace(/[^\w]+g/, '-');
    const fileName = `${dateFormattedForFileName}-${titleFormattedForFileName}.md`;
    return fileName;
}

/**
 * Adds an Event Jekyll collection entry by writing a new Markdown file into the _events directory
 * with data created by transforming an OpenSearchEvent shaped object into the required
 * Front Matter + Markdown.
 * @param {OpenSearchEvent} openSearchEvent 
 * @returns {Promise<string>} Returns a Promise resolved with the event file path.
 */
async function writeEventCollectionFile(openSearchEvent) {
    const fileName = createEventCollectionEntryFileName(openSearchEvent);
    const filePath = path.join(__dirname, '_events', fileName);
    const fileContents = transformOpenSearchEventToMarkdownFileContent(openSearchEvent);
    await fs.writeFile(filePath, fileContents, 'utf8');
    return filePath;
}

async function requestEventsFromMeetupAPI() {
    return mockMeetupEvents;
}

const meetupClientId = process.env.MEETUP_API_CLIENT_KEY;
const meetupMemberId = process.env.MEETUP_API_AUTHORIZED_MEMBER_ID;
const meetupKeyId = process.env.MEETUP_API_SIGNING_KEY_ID;
const meetupPrivateKey = process.env.MEETUP_API_PRIVATE_KEY;

const jwt = signJWT(meetupClientId, meetupMemberId, meetupKeyId, meetupPrivateKey);

requestEventsFromMeetupAPI().then(meetupEvents => {
    const openSearchEvents = meetupEvents.map(transformMeetupEventToOpenSearchEvent);
    openSearchEvents.forEach(writeEventCollectionFile);
}).catch(console.error);
