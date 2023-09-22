#!/bin/bash

# this file will copy only the javadocs out of OpenSearch repo (uses output from `_generate_javadoc_toc.sh`)

OPENSEARCH_DIR=$1
CSV_FILE=$2
JAVADOC_TAR=$3
OUT_DIR=$4

i=0
EXEC_DIRECTORY=$(pwd)

echo "Removing current javadoc tar file"
rm $JAVADOC_TAR

echo "Switching to $OPENSEARCH_DIR"
cd $1

all_lines=`cat $CSV_FILE`
for line in $all_lines
do
  ((i++))
  # echo "$OPENSEARCH_DIR/..$JAVADOC_TAR"
  #if [[ i -lt 100 ]];
  #then
    if [[ -f $OPENSEARCH_DIR$line ]];
    then
      tar --append --file=$JAVADOC_TAR $line
    fi
  #fi
done

echo "done"
cd $OUT_DIR
tar  -xvf $JAVADOC_TAR