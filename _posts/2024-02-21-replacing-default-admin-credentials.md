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

In the realm of data management and search engines, OpenSearch has been a key player, offering robust features and a flexible platform for users worldwide. With the release of OpenSearch 2.12.0, a significant security upgrade is set to transform how administrators initially set up their clusters using the security plugin's demo configuration tool.

**The Vulnerability of Default Passwords**

Until OpenSearch version 2.11.x, the security plugin shipped with a default admin password, 'admin'. While this facilitated ease of use during initial setup, it posed a significant security risk. Despite warnings from the demo configuration tool against using this default password in production, the risk of leaving clusters vulnerable was a pressing concern.

**A Shift to Mandatory Strong Passwords**

Addressing this issue, OpenSearch 2.12.0 introduces a critical change: the requirement to set a strong, custom password for the admin user during the security plugin's demo configuration setup. This requirement applies to all versions starting from 2.12.0 and ensures a more secure initial setup.

**Implementation in Different Distributions**

Let's take a look at couple of different distributions and how to setup a custom admin password with each of these:

- **TARball Distribution:**
  - *Before*: Run `./opensearch-tar-install`.
  - *After*: Set the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` environment variable with a strong password, then run `./opensearch-tar-install`. For example:
    ```shell
    export OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123!
    ./opensearch-tar-install
    ```

- **Docker Setup:**
  - Create a `.env` file in the same directory as `docker-compose.yml`.
  - Set the `OPENSEARCH_INITIAL_ADMIN_PASSWORD` variable with a strong password. For example:
    ```shell
    touch .env
    echo OPENSEARCH_INITIAL_ADMIN_PASSWORD=yourStrongPassword123! >> .env
    docker-compose up -d
    ```

**Ensuring Successful Setup**

To verify the successful setup of the cluster with the custom password, users can execute a curl request using the admin credentials. For a cluster running on localhost, the command would look like this:

```shell
curl https://localhost:9200 -ku admin:yourStrongPassword123!
```

This command should return cluster details, confirming that the cluster is operational with the new security settings.

**The Road to a More Secure OpenSearch**

This change in OpenSearch 2.12.0 is more than a mere update; it represents a significant step towards a secure-by-default posture for the security plugin. By eliminating default passwords and mandating strong custom passwords, OpenSearch is enhancing its security framework, ensuring that users start on a solid, secure foundation.

This update introduces a significant enhancement to OpenSearch's security strategy. It's a positive change that we recommend users embrace to strengthen the protection of their data and operations.

**Further Information**

For those interested in learning more about setting up and using the security configuration in OpenSearch, a comprehensive setup guide is available [here](insert security demo config setup guide link from doc website).
