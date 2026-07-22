#/bin/sh
if ! yq -V | grep -q 'version v4.';  then
    echo "ERROR - This script needs yq (https://mikefarah.gitbook.io/yq/) version 4"
    exit 2
fi 

if [ -z "$1" ]; then
    echo "ERROR - specify a directory as the first agrument"
    exit 2
fi

if [ -z "$2" ]; then
    echo "ERROR - specify an original version number as the 2nd agrument"
    exit 2
fi

if [ -z "$3" ]; then
    echo "ERROR - specify an new version number as the 3rd agrument"
    exit 2
fi

cd $1

for f in $(find . -name "*.markdown"); do
    version=$(yq e --front-matter=extract ".version"  $f);
    if [ "$2" == "$version" ]; then
        newfilename=${f/$2/$3};
        echo "Updating $f from $2 to $3. New filename: $newfilename";
        sed s/$2/$3/g $f > $newfilename
    fi
done