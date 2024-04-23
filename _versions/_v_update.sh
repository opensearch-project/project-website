#/bin/sh

if ! yq -V | grep -q 'version v4.';  then
    echo "ERROR - This script needs yq (https://mikefarah.gitbook.io/yq/) version 4"
    exit 2
fi 


if [ -z "$1" ]; then
    echo "ERROR - specify a origin as the first argument"
    exit 2
fi

if [ -z "$2" ]; then
    echo "ERROR - specify the new version number in the second argument"
    exit 2
fi

if [ -z "$3" ]; then
    echo "ERROR - specify the release date in the third argument"
    exit 2
fi

if [ -z "$4" ]; then
    echo "ERROR - specify the version sort in the fourth argument"
    exit 2
fi



VERSION_FILE="$3-opensearch-$2.markdown"
if [ ! -f "$VERSION_FILE" ]; then
    cp $1 $VERSION_FILE
fi

echo "Setting the version"
VERSION_PATH="./$VERSION_FILE"
export VERSION_ASSIGN=$2
yq e --front-matter=process -i '.version = strenv(VERSION_ASSIGN)' $VERSION_PATH

echo "Setting the release notes URL"
export RELEASE_NOTES_URL="https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-$2.md"
yq e --front-matter=process -i '.release_notes = strenv(RELEASE_NOTES_URL)' $VERSION_PATH

echo "Setting the release date"
export RELEASE_DATE=$3
yq e --front-matter=process -i '.date = strenv(RELEASE_DATE)' $VERSION_PATH

echo "Setting the version sort"
export VERSION_SORT=$4
yq e --front-matter=process -i '.version_sort = strenv(VERSION_SORT)' $VERSION_PATH




cmdLineArgs=( "$@" )
cmdCurrent=4
while [ ${cmdLineArgs[cmdCurrent]} ]
do
    if [ ${cmdLineArgs[cmdCurrent]} ] && [ ${cmdLineArgs[cmdCurrent+1]} ]; then
        echo "Settting artifact '${cmdLineArgs[cmdCurrent]}' version to '${cmdLineArgs[cmdCurrent+1]}'"
        export TO_MODIFY=${cmdLineArgs[cmdCurrent]}
        export NEW_VALUE=${cmdLineArgs[cmdCurrent+1]}
        yq e --front-matter=process -i '(.components.[] | select(.artifact == strenv(TO_MODIFY)) | .version) = strenv(NEW_VALUE)'  $VERSION_PATH
    fi
    cmdCurrent=$((cmdCurrent+2))
done