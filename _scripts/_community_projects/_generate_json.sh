#!/bin/bash

# this file generates a community_projects folder with a list of json files in the _data directory

file=$1
outputFile=$2

# removes old data
rm $2

# fetches and writes new data
projects=$(sed 's/github.com/api.github.com\/repos/g' $file)
echo "[" >> $2
for project in $projects
do
    echo "$project"
    curl $project >> $2
    echo "," >> $2
done
truncate -s-2 $2
echo "]" >> $2