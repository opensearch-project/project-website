---
layout: post
title:  "Building custom threat detection rules with OpenSearch Security Analytics"
authors:
- xeniatup
- jimishs
- sandeshkr419
date: 2023-11-28
categories:
 - feature
 - technical-posts
meta_keywords: OpenSearch Security Analytics, threat detection, security analytics plugin, detection rules
meta_description: Learn how to create custom detection rules in OpenSearch Security Analytics for specific use cases or any log sources.
excerpt: The threat detection rules scan log data to produce security findings representing potential threats. Security Analytics provides more than 2,200 prepackaged, open-source Sigma rules to help you identify potential security threats from a variety of log sources, including Microsoft Windows, AWS CloudTrail, Amazon S3 access logs, and many more. Additionally, you have the flexibility to create new detection rules and customize them for your log sources. In this blog we will show you how to create custom detection rules using an example in which you need to monitor audit logs from Microsoft 365 for contacts with emails belonging to specific domain names and create alerts based on those findings. 
---

OpenSearch Security Analytics provides new threat monitoring, detection, and alerting features. These capabilities help you to detect and investigate potential security threats that may disrupt your business operations or pose a threat to sensitive organizational data. Security Analytics can simplify and increase the efficiency of your security operations by using its threat detection engine to find potential threats in real time. Security Analytics includes a collection of prepackaged detection rules, which you can tailor to your specific security requirements. The detection rules scan log data to produce security findings representing potential threats, visualizing them on a dashboard that includes details like severity, category, and tags. Additionally, you have the flexibility to create new detection rules and customize them for your log sources.

Real-time threat detection requires a deep knowledge of security threat attack patterns and specialized investigation skills. Creating customized queries and rules to detect threats is a time-consuming task that can take hours or sometimes days. Security Analytics provides more than 2,200 prepackaged, open-source [Sigma rules](https://github.com/SigmaHQ/sigma) to help you identify potential security threats from a variety of log sources, including Microsoft Windows, AWS CloudTrail, Amazon S3 access logs, and many more. This saves users the time-consuming task of defining rules to detect common and emerging threats. In addition, Security Analytics provides a customizable framework that enables you to create custom detection rules for specific use cases or custom log sources.

In this blog we will show you how to create custom detection rule for monitoring your log data for contacts to a specific set of domains. You will learn how to take advantage of the granularity and the precision in defining the threat signals that custom rules can provide.  

Before diving deep, it is essential to understand the basic concepts of security analytics such as detectors, findings, detection rules, and alerts. If you aren’t familiar with these terms, please refer to the [documentation](https://opensearch.org/docs/latest/security-analytics/index/) before proceeding.

### Why use custom detection rules?

Prepackaged detection rules are helpful in detecting known threats in real time from a diverse set of log sources. Often, users have business-specific applications, such as a fraud detection application, that generate nonstandard logs. To address the users' need to monitor custom applications, Security Analytics lets you create custom detection rules and include them in detectors that monitor custom application logs for malicious attack signatures. Custom detection rules open up possibilities to employ all other security analytics capabilities, including the correlation engine, security findings, and alerts, to detect and investigate threats from virtually any log source.

The common use cases for using custom detection rules include: 

1. Monitoring your data against a known list of values, such as emails or IP address ranges, that could be "in the list" and "not in list". For example, an alert can be triggered when someone deletes one of 10 different security groups.
2. Reducing false positives in threat detection by using exceptions for a specific field. For example, an alert can be triggered for every user that is not created by a specific person from a specific index.
3. Generating alerts on the detected threats according to wildcard exceptions. For example, an alert can be triggered only if someone creates a new DNS record with a hostname from one particular domain, and not another domain.

In the remainder of this blog, we guide you through the process of creating custom detection rules and providing filter criteria to help you narrow down on specific entities, ensuring you're alerted when a potential threat associated with those entities is detected. For purposes of illustration, we will create a custom detection rule that enables the user to detect potentially malicious contacts from the organization email addresses.

### How to create a custom detection rule?

Let's consider an example in which you need to monitor audit logs from Microsoft 365 for contacts with emails belonging to specific domain names and create alerts based on those findings. 

In this example we will create a detection rule with the criteria as follows:

- Monitor email logs of user-sent emails 
- Include a filter criteria that checks for external recipient email address domain 
- Exclude a list of users (marketing team) who are known to send emails to external addresses.

Following are the step-by-step instructions to create a detection rule to be used as part of a custom detector:

1. [To start, log in to OpenSearch Dashboards](https://opensearch.org/docs/latest/quickstart/), navigate to the Security Analytics plugin, and then continue to drill down to the **Detection rules** page. 
2. Select **Create detection rule** to open a page showing parameters of your custom rule.

To create custom detection rules using the API, refer to the [Rule APIs documentation](https://opensearch.org/docs/latest/security-analytics/api-tools/rule-api/).
 
The detection rules are stored in [Sigma rule format](https://github.com/SigmaHQ/sigma/wiki/Rule-Creation-Guide), and the workflow covers the fields that are aligned with the terminology adopted by the Sigma community.

3. Enter the rule meta information in all the required **Rule overview** fields. 

![Detection rule overview section](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/rule-overview.png)

4. In the **Details** section, select a log type, rule severity, and rule status. 

![Rule details section](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/details.png)

5. Complete **Selection_1** in the **Detection** section to define the criteria used for the rule.

You can add multiple **Selections** with multiple maps for the log fields. **Map** is a directory that contains key-value pairs. **Modifiers** transform values and lists or convert them into regular expressions. To learn more about the Sigma rule format, go to the [Sigma documentation](https://github.com/SigmaHQ/sigma). 

- Create a Map with **Key**: `UserID`, **Modifier**: `contains`, and **Value**: `<your organization domain name>`.
- Create a Map with **Key**: `Recipient`, **Modifier**: `endswith`, and **List**: `<values that include the domains to be detected>`. 

![Selection_1 section](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/selection1.png)

6. Create another **Selection** where **Key**: `UserId` is a list of emails belonging to the marketing team by uploading the list from a .csv (or .txt) file. 

![Upload a file dialog](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/upload-a-file.png)

After uploading the list, **Selection_2** will look like this:

![Selection_2 section](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/selection2.png)

7. Enter  `Selection_1 AND NOT include Selection_2` in the **Condition** fields to define how each **Selection** will contribute to the final query. 

The user interface (UI) allows for the combining of multiple selections using operators, including `AND`, `AND NOT`, `OR`, and `OR NOT`. 

**Pro tip**: If you’re more comfortable using YAML formats, you can switch to the YAML editor at the top of the page under the page title at any point and write a **Condition** as code without losing the context.

![Condition section](/assets/media/blog-images/2023-11-28-how-to-create-custom-threat-detection-rules/condition.png) 

Once a custom rule is added, it will show up on the **Detection rules** page and can be used in any new or existing detector for customized fine-grained threat detection.

### What are the benefits?

A custom approach to detection rules that are tailored to your unique business cases helps target specific malicious activity across a range of cloud environments and troubleshoot application-specific threats. OpenSearch Security Analytics provides the capability to configure alerts and customize notification messages, helping you to find threats that need further investigation. By using the custom detection rules workflow, you can expand the detection criteria to include custom application log sources and monitor them for specific threat patterns. You can also use correlation rules to find patterns between standard and custom application logs. 

Integrating custom rules to the threat detection strategies empowers your security teams to enhance coverage for detecting security threats across a variety of log sources. Custom rules can be written with a deep understanding of an organization's infrastructure, making them more precise in identifying specific threats and reducing false positives. Combining custom and prepackaged rules for threat detection strikes a balance between tailored and standardized protection.

To get started on creating a custom detection rule for a custom log source or application log, refer to [documentation](https://opensearch.org/docs/latest/security-analytics/usage/rules/#creating-detection-rules). To learn more about security analytics and its capabilities, see the [Working with detection rules documentation](https://opensearch.org/docs/latest/security-analytics/index/).



