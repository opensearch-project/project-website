require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('node:fs/promises');
const path = require('path');
const https = require('node:https');

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

class MeetupJWTSuccessResponse {

    /**
     * Access token to store.
     * @property {string} access_token 
     */
    access_token = '';

    /**
     * @property {string} token_type
     */
    token_type = 'bearer';

    /**
     * @property {number} expires_in
     */
    expires_in = 3600;

    /**
     * @property {string} refresh_token
     */
    refresh_token = ''
}

class MeetupJWTErrorResponse {

    static invalid_request = 'The request was malformed or missing parameters';

    static invalid_client = 'Client authentication failed';

    static unauthorized_client = 'The client is not authorized';

    static invalid_grant = 'The provided code was invalid';

    static unsupported_grant_type = 'Meetup does not support the provided grant type';

    /**
     * @property {string} error
     */
    error = '';
}


/**
 * Return a Promise resolved with a JSON Web Token signed for a Meetup API request.
 * @param {string} clientKey Meetup API client key
 * @param {string} memberId Meetup API member ID
 * @param {string} signingKeyId Meetup API private signing key ID
 * @param {string} privateKey Private signing key.
 * @param {object} payload Data to sign.
 * @returns {Promise<MeetupJWTSuccessResponse>}
 */
function signJWT(
    clientKey, 
    memberId, 
    signingKeyId, 
    privateKey, 
    payload = {},
    expiresInSeconds = process.env.MEETUP_API_JWT_EXPIRATION_TIME_IN_SECONDS,
) {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            privateKey,
            {
                algorithm: 'RS256',
                issuer: clientKey,
                subject: memberId,
                audience: 'api.meetup.com',
                keyid: signingKeyId,
                expiresIn: expiresInSeconds,
            },
            (error, token) => {
                if (error) {
                    const parsedErrorResponse = JSON.parse(error);
                    reject(parsedErrorResponse);
                } else {
                    const parsedTokenResponse = JSON.parse(token);
                    resolve(parsedTokenResponse);
                }
            },
        );
    });
}

/**
 * Make a GraphQL API POST request. The returned Promise is resolved with the query results.
 * It can contain both data and errors properties depending on the results of the query.
 * If an error occurs in the HTTPS library then the Promise is rejected with an error object
 * describing the error.
 * @param {string} postBody GraphQL query
 * @param {string} hostname Meetup API hostname
 * @returns {Promise<object>}
 */
function performApiRequest(postBody, hostname = process.env.MEETUP_API_BASE_URL) {
    return new Promise((resolve, reject) => {
        const meetupClientId = process.env.MEETUP_API_CLIENT_KEY;
        const meetupMemberId = process.env.MEETUP_API_AUTHORIZED_MEMBER_ID;
        const meetupKeyId = process.env.MEETUP_API_SIGNING_KEY_ID;
        const meetupPrivateKey = process.env.MEETUP_API_PRIVATE_KEY;
        const expiresInSeconds = parseInt(process.env.MEETUP_API_JWT_EXPIRATION_TIME_IN_SECONDS, 10);
        const signedPostBody = signJWT(
            meetupClientId, 
            meetupMemberId, 
            meetupKeyId, 
            meetupPrivateKey, 
            postBody,
            expiresInSeconds
        );
        const options = {
            hostname,
            path: '/gql',
            method: 'POST',
        };
        const request = https.request(options, (response) => {
            const chunks = [];
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                chunk.push(chunk);
            });
            response.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                const parsedBody = JSON.parse(body);
                resolve(parsedBody);
            });
            response.on('error', (error) => {
                reject(error);
            })
        });
        request.write(signedPostBody);
        request.end();
    });
}

async function queryForOpenSearchProNetwork(
    openSearchUrlName = 'opensearchproject',
    eventsCursor = '',
) {
    const query = `
    query($urlname: String!) {
        proNetworkByUrlname(urlname: $urlname) {
            id
            groupsSearch {
                count
            }
            eventsSearch {
                count
            }
        }
    }
    `;
    try {
        const queryResponse = await performApiRequest();
    } catch (error) {

    }
}

async function queryForGroupEvents(
    groupUrlName,
    eventsCursor = '',
) {
    const unifiedEventsField = eventsCursor !== '' ?
        `unifiedEvents(input: $input) {` :
        `unifiedEvents {`;
    const queryParameters = eventsCursor !== '' ?
        '$urlname: String!, $input: EventAdminInput' :
        '$urlname: String!';
    const query = `
    query(${queryParameters}) {
        groupByUrlname(urlname: $urlname) {
            ${unifiedEventsField}
                count
                edges {
                    cursor
                    node {
                        dateTime
                        description
                        endTime
                        eventUrl
                        isOnline
                        timezone
                        title
                        venue {
                            city
                            country
                        }
                    }
                }
            }
        }
    }
    `;
    const variables = {
        urlname: "${groupUrlName}",
    };
    if (eventsCursor !== '') {
        variables.input = {
            after: eventsCursor,
        };
    }
    const postBody = {
        query,
        variables,
    };
    const response = await performApiRequest(postBody);
    return response;
}

async function mock__queryForGroupEvents(
    groupUrlName,
    eventsCursor = '',
) {
    return new Promise((resolve, reject) => {
        switch (groupUrlName) {
            case 'opensearch-project-austin':
                resolve(require('./meetup-api-mocks/opensearch-project-austin-groupByUrlname.json'));
                break;
            case 'opensearch-project-chicago':
                resolve(require('./meetup-api-mocks/opensearch-project-chicago-groupByUrlname.json'));
                break;
            case 'opensearch':
                switch (eventsCursor) {
                    case '':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-1.json'));
                        break;
                    case 'Mjk4MjExMTIzOjE3MDkwMzg4MDAwMDA=':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-2.json'));
                        break;
                    case 'bmdsY2t0eWdjZ2JuYjoxNzEyNzU0MDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-3.json'));
                        break;
                    case 'a3Zkemp0eWdjaGJtYzoxNzE2OTg0MDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-4.json'));
                        break;
                    case 'a3hsemh0eWdja2J0YjoxNzIxMDQ0ODAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-5.json'));
                        break;
                    case 'bmdsY2t0eWdjbGJsYzoxNzI0ODUwMDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-6.json'));
                        break;
                    case 'a3Zkemp0eWdjbmJ2YjoxNzI5MDgwMDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-7.json'));
                        break;
                    case 'a3hsemh0eWdjcWJkYjoxNzMzMTQ0NDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-8.json'));
                        break;
                    case 'bmdsY2t0eWhjY2J0YjoxNzM2OTQ5NjAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-9.json'));
                        break;
                    case 'bmdsY2t0eWhjY2JkYzoxNzM3NTU0NDAwMDAw':
                        resolve(require('./meetup-api-mocks/opensearch-groupByUrlname-response-10.json'));
                        break;
                    default:
                        reject('Unrecognized events cursor');
                        break;
                }
                break;
            case 'opensearch-project-seattle':
                resolve(require('./meetup-api-mocks/opensearch-project-seattle-groupByUrlname.json'));
                break;
            case 'new-york-city-opensearch-user-group':
                resolve(require('./meetup-api-mocks/new-york-city-opensearch-user-group-groupByUrlname.json'));
                break;
            case 'opensearch-project-bristol':
                resolve(require('./meetup-api-mocks/opensearch-project-bristol-groupByUrlname.json'));
                break;
            case 'opensearch-project-amsterdam':
                resolve(require('./meetup-api-mocks/opensearch-project-amsterdam-groupByUrlname.json'));
                break;
            default:
                reject('Unrecognized group name');
        }
    });
}


/**
 * Returns a string containing the date from a date time as required by the
 * Events Jekyll collection entry Front Matter so that an Event entry can be
 * rendered in a calendar view.
 * @param {string} dateTime ISO8601 format date-time string
 * @returns {string}
 */
function transformMeetupEventDateTimeToCalendarDate(dateTime) {
    const splitDateTime = dateTime.split('T');
    const datePart = splitDateTime[0];
    return datePart;
}

/**
 * Returns a boolean indicating whether or not the time string contains seconds, by 
 * validating against the hours:minutes:seconds pattern.
 * @param {string} time 
 * @returns {boolean}
 */
function timeHasSeconds(time) {
    const timeWithSecondsPattern = /\d{2}:\d{2}:\d{2}/;
    const patternMatches = timeWithSecondsPattern.test(time);
    return patternMatches;
}

/**
 * Transforms the ISO8601 format date-time string into the format that Jekyll expects.
 * It is worth noting that the ISO8601 format dates retrieved from Meetup do not include
 * the seconds component of the event time. This is reasonable given that it would be surprising
 * for any event to be scheduled with such granularity. However, Jekyll would not build without
 * the seconds being included for whatever reason. So, this function ensures that zero seconds (:00)
 * is appended if it is not already present.
 * @param {string} dateTime 
 * @returns {string}
 * @see {timeHasSeconds}
 */
function transformMeetupEventDateTimeToOpenSearchEventDate(dateTime) {

    // Example meetup date time: "2023-11-13T08:00-08:00"
    // Example desired output for Jekyll: 2023-11-13 08:00:00 -0800
    // NOTE: Jekyll needs the additional seconds otherwise the Liquid templates
    // throw an exception.
    const splitDateTime = dateTime.split('T');
    const plusOrMinusPattern = /\+|\-/;
    const plusOrMinusMatches = plusOrMinusPattern.exec(splitDateTime[1]);
    const timeZoneOffsetPlusOrMinus = plusOrMinusMatches[0];
    const splitTime = splitDateTime[1].split(timeZoneOffsetPlusOrMinus);
    let timePart = splitTime[0];
    if (!timeHasSeconds(timePart)) {
        timePart += ':00';
    }
    const formattedTimeZoneOffset = splitTime[1].replace(':', '');
    const openSearchEventDate = `${splitDateTime[0]} ${timePart} ${timeZoneOffsetPlusOrMinus}${formattedTimeZoneOffset}`;
    return openSearchEventDate;
}

/**
 * Extract the properties of an event edge node in the GraphQL schema required for an Event
 * Jekyll collection entry and return that object.
 * @param {object} meetupEventEdge 
 * @returns {OpenSearchEvent}
 * @see {@link https://www.meetup.com/api/schema/#Event|Meetup GraphQL Schema}
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
        online: meetupEventEdge.isOnline,
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

/**
 * Create a filename string in the format expected and consistent with existing Event Jekyll collection entries.
 * @param {OpenSearchEvent} openSearchEvent Representation of an event scheduled on Meetup.
 * @returns {string}
 */
function createEventCollectionEntryFileName(openSearchEvent) {
    const { title, eventdate } = openSearchEvent;
    const dateTimeParts = eventdate.split(' ');
    const datePart = dateTimeParts[0];
    const yearMonthDay = datePart.split('-');
    const dateFormattedForFileName = `${yearMonthDay[0]}-${yearMonthDay[1]}${yearMonthDay[2]}`;
    const titleFormattedForFileName = title.trim().toLowerCase().replace(/[^\w]+/g, '-');
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
    const fileAlreadyExists = fs.existsSync(filePath);
    if (fileAlreadyExists) {
        return filePath;
    }
    const fileContents = transformOpenSearchEventToMarkdownFileContent(openSearchEvent);
    await fs.writeFile(filePath, fileContents, 'utf8');
    return filePath;
}

/**
 * Returns an aggregated array of Meetup API GraphQL Schema Event objects
 * for all Meetup Groups associated with the OpenSearch Project Pro Meetup Network.
 * @returns {Promise<object>}
 */
async function requestEventsFromMeetupAPI() {

    // TODO
    // Figure out if its possible to use the proNetworkByUrlname,
    // or the proNetwork query to do one of the following:
    // * Use the eventsSearch field to retrieve all events associated with the pro network.
    // * Use the groupsSearch field to retrieve all associated groups, and then use each group
    //      to retrieve all associated events.
    // The expression "figure out" is used above, because the Meetup API
    // GraphQL Playground responds with an error message that says:
    //      "User must be logged-in or must be an admin of a network."
    // Given that I am logged-in, I assume that the correct conjuction in the error message
    // should actuall be "and", and not "or". As in "User must be logged-in AND an admin of a network".
    //
    // Observing the OpenSearch Project Pro Network Meetup page there
    // is 7 groups currently associated with the project. Only one has scheduled
    // events at this time. The names have been placed in the .env file, and a mock
    // implementation is provided that uses the data retrieved from the groupByUrlname
    // query in the Meetup GraphQL Playground.

    const openSearchGroupNames = process.env.MEETUP_OPENSEARCH_GROUP_NAMES.split(',');
    const groupCount = openSearchGroupNames.length;
    let aggregatedEvents = [];
    for (let i = 0; i < groupCount; ++i) {
        const groupName = openSearchGroupNames[i];
        const groupEventsResponse = await mock__queryForGroupEvents(groupName);
        const firstPageOfGroupEvents = groupEventsResponse?.data?.groupByUrlname?.unifiedEvents?.edges ?? [];
        if (firstPageOfGroupEvents.length > 0) {
            aggregatedEvents = [...aggregatedEvents, ...firstPageOfGroupEvents];
            let eventsCursor = firstPageOfGroupEvents[firstPageOfGroupEvents.length - 1].cursor;
            while (eventsCursor !== '') {
                const nextPageOfGroupEvents = await mock__queryForGroupEvents(groupName, eventsCursor);
                const nextEvents = nextPageOfGroupEvents?.data?.groupByUrlname?.unifiedEvents?.edges ?? [];
                if (nextEvents.length > 0) {
                    aggregatedEvents = [...aggregatedEvents, ...nextEvents];
                    eventsCursor = nextEvents[nextEvents.length - 1].cursor;
                } else {
                    eventsCursor = '';
                }
            }
        }
    }
    return aggregatedEvents;
}

requestEventsFromMeetupAPI().then(meetupEvents => {
    const openSearchEvents = meetupEvents.map(meetupEvent => transformMeetupEventToOpenSearchEvent(meetupEvent.node));
    openSearchEvents.forEach(writeEventCollectionFile);
}).catch(console.error);