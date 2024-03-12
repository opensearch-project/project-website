const {
    existsSync 
} = require('node:fs');
const fs = require('node:fs/promises');
const path = require('path');
const YAML = require('yaml');
const { move } = require('fs-extra');

/**
 * Output usage information to the user and exit.
 * Optionally a warning message about invalid user input and a non-zero exit status code can be provided.
 * @param {string} warnMessage Optional warning message to output to the user to indicate why the program is exiting prematurely.
 * @param {number} exitCode Optional program exit code useful when printing a warning message exiting because of user input error; default is 0.
 */
function exitWithUsage(warnMessage = '', exitCode = 0) {
    if (warnMessage !== '') {
        console.warn(warnMessage);
    }
    console.info('Moves the filesystem within the ./events/opensearch directories for an archive into its archive subdir, and update the navigatio menu.');
    console.info('Usage: $ npm run opensearchcon:archive -- FOUR_DIGIT_YEAR_ARG LOCATION_NAME');
    process.exit(exitCode);
}


/**
 * Returns a boolean indicating whether or not the `year` argument is or is not a 4 digit year.
 * @param {string} year A string containing the user input for the conference year.
 * @returns {boolean}
 */
function isValidYear(year) {
    const yearPattern = /^\d{4}$/;
    return yearPattern.test(year);
}

/**
 * Returns a boolean indicating whether or not the `location` argument conforms to acceptable
 * input values for a conference location. Acceptable formats consists of sequences of 
 * English alphabet characters optionally separated by a hypen. For example 'north-america',
 * or simply 'europe'. Case is ignored, however the string is expected to be trimmed with no
 * white space on either end. There is no minimum length greater than 1 as it is unclear how
 * to intelligently determine what might be a meaningful minimum length.
 * @param {string} location A string containing the name of the conference location.
 * @returns {boolean}
 */
function isValidLocationName(location) {
    const locationPattern = /^[a-z]+([a-z]+)*$/i;
    return locationPattern.test(location);
}


/**
 * Returns a copy of the `s` argument value the first character ensured to be upper case.
 * If the `s` argument is empty, or not a string then it is returned directly.
 * @param {string} s A non-zero length string.
 * @returns {string}
 */
function upperCaseFirstChar(s) {
    if (s !== '') {
        const ucFirst = `${s.charAt(0).toUpperCase()}${s.substring(1)}`;
        return ucFirst;
    }
    return s;
}

/**
 * Returns a readable transformation of the conference location name as provided as a runtime
 * command line argument. See the description of the `isValidLocationName` function for details
 * on what is considered valid parameter value format.
 * The returned form is each alphabetical (English) component in the program input for location name
 * changed so that its first character is upper case. 
 * For example, where `location` === 'europe' then the return value will be 'Europe'.
 * Where 'location' === 'north-america' then the return value will be 'North America'.
 * The value provided on the command line will be interpolated into URL strings and this value
 * will be interpolated into menu item text, and breadcrumb text, etc.
 * @param {string} location A string containing the name of the location of a conference.
 * @returns {string}
 * @see {isValidLocationName}
 */
function getReadableLocationName(location) {
    const readable = location.split(/[^a-z]+/ig).map(upperCaseFirstChar).join(' ');
    return readable;
}

/**
 * Returns on object with the runtime arguments provided by the user on the CLI for conference year,
 * location name.
 * The `argv` argument is treated the same as if it is the `process.argv` provided by the NodeJS runtime.
 * That is to say that it is an array of strings where indices 0, and 1 are the path to the NodeJS executable,
 * and this script respectfully. With the meaningful program arguments provided in indices 2, and 3.
 * 
 * * The returned object contains the following properties:
 * 
 * * conferenceYear
 * * conferenceLocation
 * 
 * If any of the input values do not pass validation then a warning message is printed, followed by 
 * the usage information text, and the program exits with exit code 1.
 * 
 * @param {string[]} argv rogram execution command line arguments as expected to be provided by the NodeJS runtime value in `process.argv`.
 * @returns {object}
 */
function getInputArgs(argv) {
    const [, , conferenceYear, conferenceLocation] = argv;
    if (!isValidYear(conferenceYear)) {
        exitWithUsage(`Invalid input value for conference year given: "${conferenceYear}"`, 1);
    }
    if (!isValidLocationName(conferenceLocation)) {
        exitWithUsage(`Invalid input value for conference location given: "${conferenceLocation}"`, 1);
    }
    return {
        conferenceYear,
        conferenceLocation,
    };
}

/**
 * Return a Promise resolved with an object representation of the YAML contents of a specified file system path.
 * @param {string} yamlPath File system path to a YAML file to be read and parsed into an object.
 * @returns {Promise<object>}
 * @see {@link https://www.npmjs.com/package/yaml}
 */
async function loadYamlDataAsJSObject(yamlPath) {
    const yamlData = await fs.readFile(yamlPath, 'utf8');
    const jsonData = YAML.parse(yamlData);
    return jsonData;
}

/**
 * Serialize an object representation of the site's top navigation menu configuration in YAML format.
 * The file will be written to the path formed by concatenating '/_data/top_nav.yml' to the value of
 * the `baseDir` argument.
 * The returned Promise is resolved with `undefined` upon success.
 * @param {string} baseDir File system path to the site repo working directory that contains the '_data' collection as a subdirectory.
 * @param {object} jsonData JavaScript object to serialize to disk in YAML format.
 * @returns {Promise<undefined>}
 * @see {@link https://www.npmjs.com/package/yaml}
 */
async function writeSiteTopNavMenu(baseDir, jsonData) {
    const topNavConfigPath = path.join(baseDir, '_data', 'top_nav.yml');
    console.log(`Writing top navigation menu configuration at "${topNavConfigPath}"`);
    const yamlData = YAML.stringify(jsonData);
    return await fs.writeFile(topNavConfigPath, yamlData, 'utf8');
}

/**
 * Read the site navigation configuration YAML file and return it parsed into a JavaScript object.
 * The path to the YAML file to read and whos contents are to be parsed is formed by concatenating
 * '/_data/top_nav.yml' to the value of the `baseDir` argument.
 * The returned Promise is resolved with an object representing the structure defined in './_data/top_nav.yml'.
 * Which is an array of items that contain some form of the following properties:
 * 
 * * label: Menu item label text.
 * * url: Relative or fully qualified URL for the menut item.
 * * children: Optional array of sub menu items following the same shape to form a tree of navigation items.
 * 
 * @param {string} baseDir File system path to the site repo working directory that contains the '_data' collection as a subdirectory.
 * @returns {Promise<object>}
 */
async function readSiteTopNavMenu(baseDir) {
    const topNavConfigPath = path.join(baseDir, '_data', 'top_nav.yml');
    console.log(`Reading top navigation menu configuration at "${topNavConfigPath}"`)
    const topNavMenuItems = await loadYamlDataAsJSObject(topNavConfigPath);
    return topNavMenuItems;
}

/**
 * Returns a Promise that is resolved with undefined upon success, and is rejected with an error message upon failure.
 * @param {string} baseDir A string defining the file system path to the repo base working directory.
 * @param {string} readableLocation A string defining the readable title-friendly, or label-text-friendly location name of the new conference.
 * @returns {Promise<undefined>}
 * @see {readSiteTopNavMenu}
 * @see {writeSiteTopNavMenu}
 */
async function updateTopNavMenu(baseDir, readableLocation) {
    const currentSiteNavMenu = await readSiteTopNavMenu(baseDir);
    const OPENSEARCHCON_TOP_MENU_INDEX = 0;
    const unarchivedConferenceMenuIndex = currentSiteNavMenu.items[OPENSEARCHCON_TOP_MENU_INDEX].children.findIndex(
        child => child.label === readableLocation
    );
    if (unarchivedConferenceMenuIndex === -1) {
        throw new TypeError(`Unable to update navigation menu data with conference readable name given: "${readableLocation}"`);
    }
    const conferenceMenu = currentSiteNavMenu.items[OPENSEARCHCON_TOP_MENU_INDEX].children[unarchivedConferenceMenuIndex];
    const topOpenSearchMenuSliced = [
        ...currentSiteNavMenu.items[OPENSEARCHCON_TOP_MENU_INDEX].children.slice(0, unarchivedConferenceMenuIndex),
        ...currentSiteNavMenu.items[OPENSEARCHCON_TOP_MENU_INDEX].children.slice(unarchivedConferenceMenuIndex),
    ];
    const archiveMenuIndex = topOpenSearchMenuSliced.findIndex(
        child => child.label.toLowerCase() === 'archive'
    );
    if (archiveMenuIndex === -1){
        throw new Error('Unable to update navigation menu data. Archive menu item could not be found.');
    }
    const archiveMenuChildren = [
        conferenceMenu,
        ...topOpenSearchMenuSliced[archiveMenuIndex].children,
    ];
    topOpenSearchMenuSliced[archiveMenuIndex].children = archiveMenuChildren;
    currentSiteNavMenu.items[OPENSEARCHCON_TOP_MENU_INDEX].children = topOpenSearchMenuSliced;
    console.log('Writing updated site navigation menu configuration.');
    await writeSiteTopNavMenu(baseDir, currentSiteNavMenu);
}

/**
 * Automate the archival process for an OpenSearchCon files, and navigation menu updates.
 * The files within './events/opensearchcon/YEAR/LOCATION' are moved to './events/opensearchcon/archive/YEAR/LOCATION'.
 * The top navigation menu item's children for OpenSearchCon is reorganized to move the YEAR/LOCATION conference menu
 * to be a child of the Archive menu item. 
 * At this time the first menu item is assumed to be in the first position (index 0), and the conference in question
 * is assumed to be labeled as usual "YEAR Location", for example "2024 Europe", and will be prepended to the children
 * array of the Archive menu items.
 * 
 * The returned Promise is resolved with the string 'done' upon success, and is rejected with an error message upon failure.
 * @param {string[]} inputArgs An object containing the validated input arguments as returned by `getInputArgs`.
 * @param {string} baseDir A string defining the repository root or base directory from which to perform all file system actions.
 * @returns {Promise<string>}
 */
async function run(inputArgs, baseDir) {
    const {conferenceYear, conferenceLocation } = inputArgs;
    const conferenceBaseDir = path.join(baseDir, 'events', 'opensearchcon', conferenceYear, conferenceLocation);
    const readableLocationName = getReadableLocationName(conferenceLocation);
    const conferenceArchiveDir = path.join(baseDir, 'events', 'opensearchcon', 'archive', conferenceYear);
    if (!existsSync(conferenceArchiveDir)) {
        await fs.mkdir(conferenceArchiveDir, { recursive: true });
    }
    const archiveDestinationDir = path.join(conferenceArchiveDir, conferenceLocation);
    await move(conferenceBaseDir, archiveDestinationDir, { overwrite: false });
    await updateTopNavMenu(baseDir, readableLocationName);
    return 'done';
}

if (process.argv.length === 2) {
    exitWithUsage();
} else if (process.argv.length >= 4) {
    const validatedInputArgs = getInputArgs(process.argv);
    run(validatedInputArgs, __dirname).then(console.log).catch(console.error);
} else {
    exitWithUsage(`Incomplete input arguments`, 1);
}
