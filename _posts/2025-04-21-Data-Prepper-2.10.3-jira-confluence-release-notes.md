

## Atlassian Jira as a source

Transform your Jira experience with powerful contextual search capabilities by seamlessly integrating your entire Jira content into OpenSearch. 
Data Prepper's new Atlassian Jira source plugin enables organizations to create a unified searchable knowledge base by synchronizing 
complete Jira projects, while maintaining real-time relevance through continuous monitoring and automatic synchronization 
of Jira updates. This integration allows for data synchronization with flexible filtering options for specific projects, issue types, 
and status, ensuring that only the information that you wanted is imported. To ensure secure and reliable connectivity, 
the plugin supports multiple authentication methods, including basic API key authentication and OAuth2 authentication, 
with the added security of managing credentials via AWS Secrets. It also features automatic token renewal for uninterrupted access, 
guaranteeing continuous operation. Built on Atlassian's robust [api-version-2](https://developer.atlassian.com/cloud/jira/platform/rest/v2/intro/#version">api-version-2), 
this integration empowers teams to unlock valuable insights from their Jira data through OpenSearch's advanced search capabilities, 
changing how organizations interact with and derive value from their Jira content. Here's how to get started:

```
version: "2"
extension:
    aws:
      secrets:
        jira-account-credentials:
          secret_id: <<secret-arn>>
          region: <<secrets-region>>
          sts_role_arn: <<role-to-access-secret>>
jira-pipeline:
  source:
    jira:
      hosts: ["<<Atlassian-host-url>>"]
      authentication: 
        basic:
          username: ${{aws_secrets:jira-account-credentials:jiraId}}
          password: ${{aws_secrets:jira-account-credentials:jiraCredential}}
      filter:
        project:
          key:
            include:
              - "<<project-key>>"
            exclude:
               - "<<project-key>>"
        issue_type:
          include: 
            - "Story"
            - "Epic"
            - "Task"
          exclude:
            - "Bug"
        status:
          include: 
            - "To Do"
            - "In Progress"
            - "Done"
          exclude:
            - "Closed"
  sink:
    - opensearch:

```

## Atlassian Confluence as a source

Elevate your team's knowledge management and collaboration capabilities by seamlessly integrating Atlassian Confluence content into OpenSearch 
through Data Prepper's new Confluence source plugin. This integration enables organizations to create a centralized, searchable repository of their collective knowledge, 
fostering improved information discovery and team productivity. By synchronizing Confluence content and continuously monitoring for updates, 
the plugin ensures that your OpenSearch index remains an up-to-date, comprehensive reflection of your organization's shared knowledge base. 
The integration offers flexible filtering options, allowing you to selectively import content from specific spaces or page types, tailoring the synchronized content to your organization's needs. 
The plugin supports both basic API key and OAuth2 authentication methods, with the added option of securely managing credentials through AWS Secrets. 
Furthermore, the plugin's automatic token renewal feature guarantees uninterrupted access and seamless operation. 
Built on Atlassian's Confluence [api-version](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/#auth), 
this integration empowers teams to leverage OpenSearch's advanced search capabilities across their Confluence content, 
dramatically enhancing information accessibility and utilization within the organization. Here's how to get started:

```
version: "2"
extension:
    aws:
      secrets:
        confluence-account-credentials:
          secret_id: <<secret-arn>>
          region: <<secrets-region>>
          sts_role_arn: <<role-to-access-secret>>
confluence-pipeline:
  source:
    confluence:
      hosts: ["<<Atlassian-host-url>>"]
      authentication: 
        basic:
          username: ${{aws_secrets:confluence-account-credentials:confluenceId}}
          password: ${{aws_secrets:confluence-account-credentials:confluenceCredential}}
      filter:
        space:
          key:
            include:
              - "<<space-key>>"
            exclude:
               - "<<space-key>>"
        page_type:
          include: 
            - "page"
            - "blogpost"
            - "comment"
          exclude:
            - "attachment"
  sink:
    - opensearch:

```

