#!/bin/bash

startYear=2021
startMonth=6
endYear=2024
endMonth=12
currentDir=$(pwd)
calendarDir="$currentDir/_calendars"
sampleCalendarFile="$calendarDir/_sample.md"
declare -a monthNames=(
    [0]=none
    [1]=january
    [2]=february
    [3]=march
    [4]=april
    [5]=may
    [6]=june
    [7]=july
    [8]=august
    [9]=september
    [10]=october
    [11]=november
    [12]=december
)
echo "Calendar directory..."
echo $calendarDir

for (( i=$startYear; i<=$endYear; i++));
do
    for (( j=$startMonth; j<=$endMonth; j++ ));
    do
        if [ $j -lt 10 ];
        then
            calendarFileName="$i-0$j.md"
        else
            calendarFileName="$i-$j.md"
        fi
        calendarFilePath="$calendarDir/$calendarFileName"
        if [ -f "$calendarFilePath" ];
        then
            echo "$calendarFilePath already exists"
        else
            echo "Copying sample to new calendar file named $calendarFilePath"
            cp $sampleCalendarFile $calendarFilePath
            yearSearch="1900"
            yearReplace="$i"
            monthIndexSearch="888"
            monthIndexReplace=$(( $j - 1))
            monthNumberSearch="999"
            monthNumberReplace="$j"
            monthNameSearch="MONTH_NAME"
            monthNameReplace="${monthNames[$j]}"
            monthRedirectFromSearch="777"
            if [ $j -lt 10 ];
            then
                monthRedirectoFromReplace="0$j"
            else
                monthRedirectoFromReplace="$j"
            fi
            sed -i '' -e "s/$yearSearch/$yearReplace/gi" $calendarFilePath
            sed -i '' -e "s/$monthIndexSearch/$monthIndexReplace/gi" $calendarFilePath
            sed -i '' -e "s/$monthNumberSearch/$monthNumberReplace/gi" $calendarFilePath
            sed -i '' -e "s/$monthNameSearch/$monthNameReplace/gi" $calendarFilePath
            sed -i '' -e "s/$monthRedirectFromSearch/$monthRedirectoFromReplace/gi" $calendarFilePath
        fi
    done
    startMonth=1
done
