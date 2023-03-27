---
layout: post
title:  "Introducing Security Analytics"
authors:
  - christophermoore
date:   2023-03-13 12:15:00 -0700
categories:
  - releases
meta_keywords: security analytics, security analytics in OpenSearch, open source SIEM tools
meta_description: Learn how the powerful security analytics capabilities in OpenSearch allow administrators to track and analyze activity in the cluster to combat cyber threats.
---

Recently one of the largest wireless carriers in the US revealed that hackers had compromised a company database of customer information through unauthorized use of an API and had acquired the personal details of as many as 37 million individuals, including names, addresses, phone numbers, and account numbers. In the modern world, where devices are interconnected across virtual boundaries, security attacks such as this one have become commonplace.

With an ever-increasing volume of data shared online and stored in the cloud, malicious attempts to disrupt the interests of enterprises large and small are now simply part of the reality of doing business. And in light of these threats, it’s therefore essential that these enterprises have tools in place to detect and identify the signatures of possible attacks in real time so they can act to intervene as quickly as possible. To address these needs, OpenSearch now includes a package of pre-built features and functionality that allow organizations to quickly and easily roll out a security solution for confronting a full range of cyber threats. The default distribution of OpenSearch now includes Security Analytics—OpenSearch's Security Information and Event Management (SIEM) solution—and it installs automatically. After installation, users can fine tune its functionality to meet the security needs of their organization.

## The role of Security Analytics in OpenSearch

OpenSearch already includes powerful features that allow administrators to analyze application logs and other security event logs within the cluster. They provide users the ability to identify anomalous behavior and set up alerts and notifications to signal users when these events occur. However, scaling these existing tools for security use cases, handling a large volume of data, and assembling a team of professionals to manage and interpret results, pose challenges to managing and training costs and keeping the system up to date to detect complex threats.

Security Analytics takes a different approach. It provides organizations with a single solution that contains a comprehensive suite of features and capabilities. This leads to lower costs and low-latency performance at scale. Security Analytics also leverages widely used Sigma rules to find threat patterns in your security event logs. The security rules are pre-packaged with OpenSearch and provide rules that detect many of the common threats across a diverse set of log sources. Combined with a number of robust features, the rules also allow Security Analytics to be highly customizable.

## The parts of the whole

To see how this works, let’s first look at some of the components in Security Analytics.

### Detectors

Central to Security Analytics are its detectors. Detectors are components that interpret log data, compare that data to a schema of rules, and enable you to configure alert triggers that generate findings and the alerts that notify administrators of possible security events in your infrastructure. Their advantage is that they offer flexibility through their configuration. This allows a business to fine tune its detection capabilities for specific threats, wider objectives, or targets in between.

### Rules

Security Analytics leverages the versatility, portability, and comprehensive framework of [Sigma rules](https://github.com/SigmaHQ/sigma). These rules define the conditional logic applied to ingested log data and determine exactly what type of event or attack the system should monitor, thereby allowing a detector to identify a particular event of interest. Security Analytics uses these prepackaged, open-source rules as a starting point for describing relevant log events. But with their inherently flexible format and wide compatibility, users can import and customize Sigma rules to meet their needs.

### Log types

Log data is key to understanding activity in any network. Whether it’s server logs, firewall logs, infrastructure logs, application logs, or endpoint logs, this data is elemental in gaining insight into the activity within a network. In terms of security coverage, the more log data a security infrastructure can process the better. Similarly, the wider the variety of log types that infrastructure can ingest, the more versatile that solution. Security Analytics launched with options for the most common log types. Since then, we have continued to expand the number of available log types. And that trend will continue.

### The user interface and dashboards

In addition to the rich set of APIs that allow users to interact and manage the solution, Security Analytics interfaces with OpenSearch Dashboards and provides real-time visualizations for findings, alerts, and other analytics. Interaction with the Dashboards UI is intuitive and lets users easily navigate features and perform essential actions. Most importantly, the interface presents graphical information on network events happening in the moment. And to facilitate analysis of findings, we are continuously expanding support for dashboards that can present findings in a number of varied formats—such as charts, graphs, and maps—giving users the ability to customize their visualizations.

(Dev or Jimish - provide screen grab of the Overview page lit up like a Christmas tree. Or, one of the dashboards packed full of graphics.)

By integrating these separate components into one operation, we arrive at a solution that can detect and identify suspicious events in the network, alert security operations to the possibility of an attack, and display findings in real time so that users can inspect and evaluate events to determine whether they need to take action.

## How it works

Security Analytics interprets data in a company’s existing log files to identify abnormalities or suspicious patterns in network activity. After the log data is ingested in the system, detectors map the data to a common rule schema and transform it into meaningful events that can be applied to the rules. Depending on which rules have been assigned during configuration of the detector, the detector applies certain criteria to the log data and executes a match when any of the criteria are met. This generates a finding, which is simply an incident in which the detector has isolated as an event of interest. Simultaneously, the event triggers an alert, and security operations members are notified of the incident.

The user interface in OpenSearch Dashboards lists individual findings according to preferred metrics and displays these findings in a configurable graph so that users can drill down to see incidents in a short time frame, or expand out to get a sense of trends over a longer time period. The same format is applied to an Alerts dashboard so that users can track alerts in a selected span of time and view them by severity levels or whether or not they are still active or acknowledged.

## Looking ahead

Since its release in version 2.4, Security Analytics has experienced refinements to both its functionality and number of features. Our intention is to continue along this line. Here are a few areas for development we hope to work on in the near future.

The more compatibility Security Analytics has with different log types, the greater its ability to process a broader range of log data. Incrementally, we plan to continue adding to the number of log types that Security Analytics supports.

Closely related, we also plan to increase support of out-of-the-box dashboards for a larger pool of log types. Currently, when users create detectors for the **Network events**, **CloudTrail logs**, or **S3 access logs** log types, the system automatically generates a dashboard for visualizing the data generated by the detector. This will include more log types in future versions.

In terms of threat detection, the ability to correlate threat patterns across different log sources offers a clearer and more thorough view of potential malicious activity in a network. To enable Security Analytics to accomplish this, we have plans to create a [Correlation engine](https://github.com/opensearch-project/security-analytics/issues/369) that could not only draw these connections across log types but between current and previous findings.

Other improvements on the horizon include chaining of alerts, more efficient processing of log data, and further integration with other OpenSearch functionality. These are just a few of the steps along the way to making Security Analytics a highly effective tool for protecting your data and preventing disruptions to business. The modern reality of doing business may never be completely free from bad actors interested in unlawful access to and theft of other’s data. But the industry is responding to those circumstances in smart ways with smart solutions. In that spirit, Security Analytics addresses the challenges of keeping data safe from attacks so data owners can focus more time on the business of doing business.

## Getting involved

As the first open-source SIEM available in the market, Security Analytics presents opportunities for the community to become involved early in its evolution. There are a few different options for participating in the project. We’d love to hear from you. To get involved in the discussion, have a look at the [Security Analytics forum(https://forum.opensearch.org/c/plugins/security-analytics/73). To keep up to date on developments, see the [list of issues](https://github.com/opensearch-project/security-analytics/issues) in the Security Analytics repository to find out what enhancements are in the pipeline. And to make contributions, see the [Contributing Guidelines](https://github.com/opensearch-project/security-analytics/blob/main/CONTRIBUTING.md) in the repository.

