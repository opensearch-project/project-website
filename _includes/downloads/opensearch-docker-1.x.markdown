The best way to try out OpenSearch is to use [Docker Compose](https://docs.docker.com/compose/install/). These steps will set up a two node cluster of OpenSearch plus OpenSearch Dashboards:

1. Set up your Docker host environment 
  - **macOS & Windows**: In Docker _Preferences_ > _Resources_, set RAM to at least 4 GB.
  - **Linux**: Ensure `vm.max_map_count` is set to at least 262144 as per the [documentation](/docs/opensearch/install/important-settings/).
2. Download [docker-compose.yml](/samples/1.x/docker-compose.yml) into your desired directory
3. Run `docker compose up`
4. Have a nice coffee while everything is downloading and starting up
5. Navigate to [http://localhost:5601/](http://localhost:5601) for OpenSearch Dashboards
6. Login with the default username (`admin`) and password (`admin`)
