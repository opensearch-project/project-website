#!/bin/sh

#
# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0
#

##
#
# Adds a new Data Prepper artifact to the project. You need to commit it.
# You must run from the script directory.
#
# Sample run:
#
# ./_add_artifact.sh 2.4.0
#

if [ -z "$1" ]; then
    echo "Provide the Data Prepper version as the first argument."
    exit 1
fi

DATA_PREPPER_VERSION=$1

sed "s/DATA_PREPPER_VERSION/$DATA_PREPPER_VERSION/g" _data-prepper-docker-x64.template > "data-prepper-${DATA_PREPPER_VERSION}-docker-x64.markdown"
sed "s/DATA_PREPPER_VERSION/$DATA_PREPPER_VERSION/g" _data-prepper-linux-x64.template > "data-prepper-${DATA_PREPPER_VERSION}-linux-x64.markdown"
sed "s/DATA_PREPPER_VERSION/$DATA_PREPPER_VERSION/g" _data-prepper-no-jdk-linux-x64.template > "data-prepper-${DATA_PREPPER_VERSION}-no-jdk-linux-x64.markdown"
