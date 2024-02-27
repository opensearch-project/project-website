---
layout: post
title:  "Enhancing security in OpenSearch 2.12.0: The end of the default admin password"
authors:
 - dchanp
date: 2024-02-27
categories:
 - community-updates
 - technical-posts
meta_keywords: OpenSearch security plugin, OpenSearch security, OpenSearch 2.12.0, security configuration
meta_description: Learn how OpenSearch 2.12.0 improves and secures the initial admin user setup processes using the demo configuration tool in the OpenSearch security plugin.
has_math: false
has_science_table: false
---


In the landscape of data management and search technologies, OpenSearch stands out by offering a comprehensive set of features and a flexible platform for users globally. With the rollout of OpenSearch version 2.12.0, an update aimed at improving the initial setup process for the "admin" user using the Security plugin's demo configuration tool has been introduced.

**Rethinking default admin credentials**

Until the release of OpenSearch 2.11.1, a default "admin" password was included in the demo configuration file of the Security plugin, intended to streamline the setup for new users. While this approach was convenient, it also posed a potential security risk. Despite numerous warnings in the demo tool, documentation, and console outputs about moving demo setups to production with the default password, occurrences of this issue persisted, leading to the decision to eliminate the default password for the admin user, who has comprehensive access and can leave the cluster vulnerable if the default password is not updated.

**Introducing a mandatory strong password for the admin**

A notable change in [OpenSearch 2.12.0](https://github.com/opensearch-project/opensearch-build/blob/main/release-notes/opensearch-release-notes-2.12.0.md) is the introduction of a requirement for a strong, custom password for the admin user during the demo configuration setup of the Security plugin. This measure is designed to enhance security from the start and applies solely to the admin user in version 2.12.0 and later.

**Custom admin password setup across distributions**

Setting up a custom admin password varies slightly depending on the distribution:

- **Tarball distribution:**
  - *Previously*: The setup was initiated with `./opensearch-tar-install`.
  - *Now*: Users must first set the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` environment variable to a strong password before running `./opensearch-tar-install`. For example:
    ```sh
    $ export OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123!
    $ ./opensearch-tar-install
    ```

- **Docker setup:**
  - Begin by creating a `.env` file in the same directory as your `docker-compose.yml` file.
  - Add the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` variable with a strong password to this file. For instance:
    ```sh
    $ touch .env
    $ echo OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123! >> .env
    $ docker-compose up -d
    ```

**Ensuring a secure setup**

To confirm that the cluster is securely configured with the custom admin password, execute a curl request with the admin credentials. For a local cluster, the command would be the following:

```sh
$ curl https://localhost:9200 -ku admin:yourStrongPassword123!
```

A successful response indicates that the cluster is operational and accessible to the admin user.

**Advancing OpenSearch security**

This update in OpenSearch 2.12.0 marks a deliberate move toward improved security, focusing on ensuring a secure setup by eliminating the default admin password and implementing a strong custom password for the admin user.

We recommend that all users implement this update to better protect their data and system.

**Learn more**

For additional information on setting up and managing the security demo configuration in OpenSearch, a detailed guide is available [here](/docs/latest/security/configuration/demo-configuration/).

