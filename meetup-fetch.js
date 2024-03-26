require('dotenv').config();
const jwt = require('jsonwebtoken');
const { existsSync } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('path');
const https = require('node:https');

class MeetupAPISecrets {
    memberId = '';
    clientKey = '';
    clientSecret = '';
    tokenExpirationInSeconds = 120;
    signingKeyId = '';
    privateKey = '';
    proNetworkName = 'opensearchproject';
    graphQlBaseUrl = 'api.meetup.com';

    // TODO / TBD
    // Hoping to be able to eliminate the maintenance risk by being able 
    // to query for this list from the pro network query
    // I am speaking with less than 100% certainty here, because of the problem
    // I encountered using that query in the Meetup API docs GraphQL Playground.
    // The error message indcated failure, because "I need to be an admin OR I need to be logged in".
    // I think what the message really indicated was that I need to be logged in AS AN admin.
    // The usee of the "or" conjunction seemed like a poor grammatical choice.
    groupNames = 'pensearch-project-austin,opensearch-project-chicago,opensearch,opensearch-project-seattle,new-york-city-opensearch-user-group,opensearch-project-bristol,opensearch-project-amsterdam';
}

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

/**
 * @property {string} city The name of the location city.
 * @property {string} country The name of the location country.
 */
class EventPhysicalLocation {

    city = '';
    country = '';

    constructor(city, country) {
        this.city = city;
        this.country = country;
    }
}

/**
 * @property {string} url URL of the event signup page.
 * @property {string} title Title of the event signup button / link.
 */
class EventSignupLinkDetails {
    url = '';
    title = '';
}

/**
 * Definition of the properties required by Event Jekyll collection entries.
 * The property names - excluding the content property - match those of the 
 * Front Matter properties for an Event collection item. This includes maintaining
 * the mixed name casing FYI.
 * @class 
 * @property {string} calendar_date The date of the event, without time, as a string to appear in the calendar view in the format of YYYY-MM-DD.
 * @property {string} eventdate  Event date and time (24 hr) here (mind the time-zone and daylight saving time!).
 * @property {string} enddate Optional end date if the event last multiple days.
 * @property {string} title The title - this is how it will show up in listing and headings on the site
 * @property {boolean} online Whether or not the event is online.
 * @property {string} tz The location timezone.
 * @property {EventPhysicalLocation} location The physical event location for non-online events.
 * @property {EventSignupLinkDetails} signup Event signup link / button details to render in the template.
 * @property {string} category Event category name. Valid values are defined as static properties of the EventCategory class.
 *      @see {EventCategory} 
 *      @default 'community'
 * @property {string} content The markdown content of the event after the Front Matter.
 */
class OpenSearchEvent {
    calendar_date = '';
    eventdate = '';
    enddate = '';
    title = '';
    online = true;
    tz = '';
    location = null;
    signup = null;
    category = 'community'; 
    content = '';
}

/**
 * @property {string} access_token Access token.
 * @property {string} token_type Token type; default 'bearer'.
 * @property {number} expires_in Token expiration time; default 120.
 * @property {string} refresh_token Access refresh token.
 */
class MeetupJWTSuccessResponse {
    access_token = '';
    token_type = 'bearer';
    expires_in = 120;
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
 * Return a Promise resolved with a JSON Web Token signed for a Meetup API request payload.
 * @param {string} clientKey Meetup API client key
 * @param {string} memberId Meetup API member ID
 * @param {string} signingKeyId Meetup API private signing key ID
 * @param {string} privateKey Private signing key.
 * @param {object} payload Request data to sign.
 * @param {number} expiresInSeconds Token expiration time in seconds.
 * @returns {Promise<MeetupJWTSuccessResponse>}
 */
function signJWT(
    clientKey, 
    memberId, 
    signingKeyId, 
    privateKey, 
    payload = {},
    expiresInSeconds,
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
                    reject(error);
                } else {
                    resolve(token);
                }
            },
        );
    });
}

/**
 * Invoke a HTTP POST request to the identified host, for the identified resource path with the provided body, and headers.
 * At a minimum the 'content-type' request header must be defined.
 * The returned Promise is resolved with either a string, or an object in the case that the POST response headers include a
 * value of 'application/json' for the 'content-type'.
 * Note: All response data is processed with a UTF8 encoding.
 * @param {string} hostname Hostname of the server to call.
 * @param {string} path URL path string
 * @param {string} postBodyString POST body as a string.
 * @param {object} headers HTTP request header tuples; at a minimum the 'content-type' header should be defined to match what is in the POST body.
 * @returns {Promise<string|object>}
 */
function invokePostRequest(hostname, path, postBodyString, headers) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname,
            path,
            port: 443,
            method: 'POST',
            headers,
        };
        const request = https.request(options, (response) => {
            const responseDataChunkStack = [];
            response.setEncoding('utf8');
            response.on('data', (responseDataChunk) => {
                responseDataChunkStack.push(responseDataChunk);
            });
            response.on('end', () => {
                const accumulatedResponse = responseDataChunkStack.join('');
                if (response.headers['content-type'] === 'application/json') {
                    const parsedResponse = JSON.parse(accumulatedResponse);
                    resolve(parsedResponse);
                } else {
                    resolve(accumulatedResponse);
                }
            });
            response.on('error', reject);
        });
        request.on('error', reject);
        request.write(postBodyString);
        request.end();
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
async function performApiRequest(postBody, hostname = process.env.MEETUP_API_BASE_URL) {
    const meetupClientId = process.env.MEETUP_API_CLIENT_KEY;
    const meetupMemberId = process.env.MEETUP_API_AUTHORIZED_MEMBER_ID;
    const meetupKeyId = process.env.MEETUP_API_SIGNING_KEY_ID;
    const meetupPrivateKey = process.env.MEETUP_API_PRIVATE_KEY;
    const expiresInSeconds = parseInt(process.env.MEETUP_API_JWT_EXPIRATION_TIME_IN_SECONDS, 10) + Math.floor(Date.now() / 1000);
    const stringifiedPostBody = JSON.stringify(postBody);
    const signedJwt = await signJWT(
        meetupClientId, 
        meetupMemberId, 
        meetupKeyId, 
        meetupPrivateKey, 
        postBody,
        expiresInSeconds
    );
    const queryByteLength = Buffer.byteLength(stringifiedPostBody);
    const requestHeaders = {
        Authorization: `Bearer: ${signedJwt}`,
        ['Content-Type']: 'application/json',
        ['Content-Length']: queryByteLength,
        timeout: parseInt(process.env.MEETUP_API_JWT_EXPIRATION_TIME_IN_SECONDS, 10) * 1000,
    };

    // TODO: Implement a retry count on timeout.
    const apiResponse = await invokePostRequest(hostname, '/gql', stringifiedPostBody, requestHeaders);
    return apiResponse;
}

/**
 * TODO: The Meetup API Documentation GraphQL Playground does not permit my user account to
 * query the groupsSearch field, nor the eventsSearch field on the proNetworkByUrlname schema.
 * I suspect that this would be a more future proof way to aggregate all events from all groups
 * that are associated with the OpenSearch Project instead of relying on maintaining a list
 * of hardcoded values in an environment variable observed by actually looking at the OpenSearch Project
 * Meetup page, and collecting those group url names. 
 * @param {string} openSearchUrlName 
 * @param {string} eventsCursor 
 */
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

/**
 * Returns a Promise resolved with the results of a query for a list of events for a specifed group.
 * The "groupByUrlname" query is used to query for the group's "unifiedEvents" field.
 * Paged results can be retrieved via follow up calls by providing a non-empty value the eventsCursor parameter
 * which will be used as the "after" property value for the "input" variable for the "unifiedEvents" field
 * @param {string} groupUrlName URL name of a Meetup Group associated with the OpenSearch Project for whose events are being queried.
 * @param {string} eventsCursor Events list results paging cursor for making round trips for additional paged results.
 * @returns {Promise<obejct>} 
 * @see {@link "https://www.meetup.com/api/schema/#groupByUrlname"}
 */
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
        urlname: `${groupUrlName}`,
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
 * for any event to be scheduled with such granularity. However, Jekyll does not build without
 * the seconds being included. So, this function ensures that zero seconds (:00)
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
 * Note that if a file already exists at the desired path then it is not overwritten.
 * @param {OpenSearchEvent} openSearchEvent 
 * @returns {Promise<string>} Returns a Promise resolved with the event file path.
 */
async function writeEventCollectionFile(openSearchEvent) {
    const fileName = createEventCollectionEntryFileName(openSearchEvent);
    const filePath = path.join(__dirname, '_events', fileName);
    const fileAlreadyExists = existsSync(filePath);
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
 * @param {MeetupAPISecrets} meetupSecrets
 * @returns {Promise<object>}
 */
async function requestEventsFromMeetupAPI(meetupSecrets) {

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
    // should actually be "and", and not "or". As in "User must be logged-in AND an admin of a network".

    const openSearchGroupNames = meetupSecrets.groupNames.split(',');
    const groupCount = openSearchGroupNames.length;
    let aggregatedEvents = [];
    for (let i = 0; i < groupCount; ++i) {
        const groupName = openSearchGroupNames[i];
        const groupEventsResponse = await queryForGroupEvents(groupName);
        const totalGroupEventCount = groupEventsResponse?.data?.groupByUrlname?.unifiedEvents?.count ?? 0;
        let accumulatedGroupEventCount = 0;
        const firstPageOfGroupEvents = groupEventsResponse?.data?.groupByUrlname?.unifiedEvents?.edges ?? [];
        if (firstPageOfGroupEvents.length > 0) {
            aggregatedEvents = [...aggregatedEvents, ...firstPageOfGroupEvents];
            accumulatedGroupEventCount += firstPageOfGroupEvents.length;
            let eventsCursor = firstPageOfGroupEvents[firstPageOfGroupEvents.length - 1].cursor;
            while (eventsCursor !== '' && accumulatedGroupEventCount < totalGroupEventCount) {
                const nextPageOfGroupEvents = await queryForGroupEvents(groupName, eventsCursor);
                const nextEvents = nextPageOfGroupEvents?.data?.groupByUrlname?.unifiedEvents?.edges ?? [];
                if (nextEvents.length > 0) {
                    aggregatedEvents = [...aggregatedEvents, ...nextEvents];
                    accumulatedGroupEventCount += nextEvents.length;
                    eventsCursor = nextEvents[nextEvents.length - 1].cursor;
                } else {
                    if (nextPageOfGroupEvents.error) {
                        console.dir(nextPageOfGroupEvents.error);
                    }
                    eventsCursor = '';
                }
            }
        }
    }
    return aggregatedEvents;
}

/**
 * 
 * @param {object} env Process environment variables or some sort of object with the required values.
 * @returns {MeetupAPISecrets}
 */
function getMeetupAPISecrets(env = process.env) {
    const meetupSecrets = {
        memberId: env?.MEETUP_API_AUTHORIZED_MEMBER_ID,
        clientKey: env?.MEETUP_API_CLIENT_KEY,
        clientSecret: env?.MEETUP_API_CLIENT_SECRET,
        tokenExpirationInSeconds: env?.MEETUP_API_JWT_EXPIRATION_TIME_IN_SECONDS ?? 120,
        signingKeyId: env?.MEETUP_API_SIGNING_KEY_ID,
        privateKey: env?.MEETUP_API_PRIVATE_KEY,
        proNetworkName: env?.MEETUP_OPENSEARCH_PROJECT_PRO_NETWORK_NAME ?? 'opensearchproject',
        graphQlBaseUrl: env?.MEETUP_API_BASE_URL ?? 'api.meetup.com',
        groupNames: env?.MEETUP_OPENSEARCH_GROUP_NAMES ?? 'opensearch',
    };
    if (!Object.entries(meetupSecrets).every(([k, v]) => {
        const hasValue = !!v;
        if (!hasValue) {
            throw new TypeError(`Missing Meetup configuration data value for ${k}`);
        }
        return true;
    })) {
        console.error('Invalid Meetup API Configuration. Cannot pull events.');
        return null;
    }
}

requestEventsFromMeetupAPI(getMeetupAPISecrets()).then(meetupEvents => {
    const openSearchEvents = meetupEvents.map(meetupEvent => transformMeetupEventToOpenSearchEvent(meetupEvent.node));
    openSearchEvents.forEach(writeEventCollectionFile);
}).catch(console.error);
