echo "checking for OpenSearch Dashboards"
dashboards_response=$( curl -sI http://localhost:5601/ | awk -v FS=": " '/^location/{print $2}')
length=`expr length "$dashboards_response"` 

until (($length > 1))
do
    sleep 2
    dashboards_response=$( curl -sI http://localhost:5601/ | awk -v FS=": " '/^location/{print $2}')
    length=`expr length "$dashboards_response"` 

    echo "not ready yet, waiting 2 seconds..."
done
echo "Dashboards ready"