

## Atlassian Jira as a source

Atlassian Jira is a software application used for issue tracking, project management. 
Data Prepper now supports Atlassian Jira as a source to pull jira ticket details into the pipeline with flexible filter options to pull selected projects and selected issue types and selected issue status. 
Atlassian Jira source supports two kind of authentication methods. Basic API key based authentication and OAuth2 based authentication with an option to pass these values using AWS Secrets. 
Plugin also takes care of renewing the tokens when expired. This plugin is based on Atlassian jira [api-version-2](https://developer.atlassian.com/cloud/jira/platform/rest/v2/intro/#version">api-version-2)
Here is how you can use it

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

Confluence by Atlassian is a collaborative software tool designed for teams to create, share, and manage information.
Data Prepper now supports Atlassian Confluence as a source to pull content from Atlassian Confluence instance with flexible filter options to specific space or page type.
Atlassian Confluence source supports two kind of authentication methods. Basic API key based authentication and OAuth2 based authentication with an option to pass these values using AWS Secrets.
Plugin also takes care of renewing the tokens when expired. This plugin is based on Atlassian Confluence [api-version](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/#auth)
Here is how you can use it

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

