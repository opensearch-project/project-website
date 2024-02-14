---
layout: post
title:  "Enhancing Security in OpenSearch 2.12.0: The End of Default Admin Password"
authors:
 - dchanp
date: 2024-02-21
categories:
 - community-updates
 - technical-posts
meta_keywords: "OpenSearch Security, Security Demo Configuration"
meta_description: Learn about the changes to Security plugin's demo configuration setup
has_math: false
has_science_table: false
---


In the landscape of data management and search technologies, OpenSearch stands out by offering a comprehensive set of features and a flexible platform for users globally. With the rollout of OpenSearch version 2.12.0, an update aimed at improving the initial setup process for "admin" user using the security plugin's demo configuration tool has been introduced.

**Rethinking Default Admin Credentials**

Until the release of OpenSearch 2.11.1, a default 'admin' password was included in the demo configuration file of the security plugin, intended to streamline the setup for new users. While this approach was convenient, it also posed a potential security risk. Despite numerous warnings in the demo tool, documentation, and console outputs about moving demo setups to production with the default password, occurrences of this issue persisted, leading to the decision to eliminate the default password for the admin user, who has comprehensive access, and can leave the cluster vulnerable if the default password is not updated.

**Introducing Mandatory Strong Password for Admin**

The notable change in OpenSearch 2.12.0 is the introduction of a requirement for a strong, custom password for the admin user during the demo configuration setup of the security plugin. This measure is designed to enhance security from the start and applies solely to the admin user in version 2.12.0 and beyond.

**Custom Admin Password Setup Across Distributions**

Setting up a custom admin password varies slightly depending on the distribution:

- **TARball Distribution:**
  - *Previously*: The setup was initiated with `./opensearch-tar-install`.
  - *Now*: Users must first set the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` environment variable to a strong password before running `./opensearch-tar-install`. For example:
    ```sh
    $ export OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123!
    $ ./opensearch-tar-install
    ```

- **Docker Setup:**
  - Begin by creating a `.env` file in the same directory as your `docker-compose.yml`.
  - Add the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` variable with a strong password to this file. For instance:
    ```sh
    $ touch .env
    $ echo OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123! >> .env
    $ docker-compose up -d
    ```

**Ensuring a Secure Setup**

To confirm the cluster is securely configured with the custom admin password, execute a curl request with the admin credentials. For a local cluster, the command would be:

```sh
$ curl https://localhost:9200 -ku admin:yourStrongPassword123!
```

A successful response indicates the cluster is operational and accessible as the admin user.

**Advancing OpenSearch Security**

This update in OpenSearch 2.12.0 marks a deliberate move towards improved security, focusing on ensuring a secure setup by eliminating the default admin password and advocating for strong custom password for admin user.

We recommend all users to implement this update to better protect their data and system.

**Learn More**

For additional information on setting up and managing the security features in OpenSearch, a detailed guide is available [here](insert security demo config setup guide link from doc website).

