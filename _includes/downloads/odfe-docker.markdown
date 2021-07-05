These steps will setup a two node cluster of Elasticsearch plus Kibana:

1. Download [docker-compose.yml](#) into your desired directory
2. Run `docker compose up`
3. Have a nice coffee while everything is downloading and starting up
4. Navigate to [https://localhost:5601/](https://localhost:5601/) for Kibana
5. Login with the default username (`admin`) and password (`admin`)

For further details about using Open Distro on Docker, see the [Open Distro documentation](https://opendistro.github.io/for-elasticsearch-docs/docs/install/docker/#start-a-cluster).

You can also find the standalone docker images on Docker Hub:
* [Open Distro for Elasticsearch - Elasticsearch Docker v1.13.2](https://hub.docker.com/r/amazon/opendistro-for-elasticsearch)
* [Open Distro for Elasticsearch - Kibana Docker v1.13.2](https://hub.docker.com/r/amazon/opendistro-for-elasticsearch-kibana)

---