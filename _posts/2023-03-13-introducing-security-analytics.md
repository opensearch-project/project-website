---
layout: post
title:  "Introducing Security Analytics"
authors:
  - christophermoore
date:   2023-03-13 12:15:00 -0700
categories:
  - releases
meta_keywords: security analytics
meta_description: Provides and overview of Security Analytics and how it fits in with the OpenSearch Project
---

# Introducing Security Analytics

In January of 2023, one of the largest wireless carriers in the US revealed that hackers had compromised a company database of customer information through unauthorized use of an API and had acquired the personal details of as many as 37 million individuals, including names, addresses, phone numbers, and account numbers. Once identified, the company was able to halt the malicious activity within a day. However, investigations indicated that the data breach had likely occurred at the end of November the previous year, giving the hackers over a month to extract the information.

Although unfortunate, occurrences like these now appear frequently in the media and have become almost commonplace in the modern world. With an ever-increasing volume of business data shared online and stored in the cloud, malicious attempts to disrupt companies’ business interests are now simply part of the reality of doing business. And in light of these threats, it’s therefore essential that companies have tools in place to detect and identify the signatures of possible attacks in real time so they can act to intervene as quickly as possible. To address these needs, OpenSearch now includes a package of pre-built features and functionality that allow businesses to quickly and easily roll out a security solution for confronting a full range of cyber threats. Security Analytics is this solution for OpenSearch, and it installs automatically with any distribution.

## The role of Security Analytics in OpenSearch

OpenSearch already includes powerful features that allow administrators to track and analyze activity within the cluster. They provide users the ability to identify anomalous behavior in system data and set up alerts and notifications to signal users when these events occur. However, scaling these existing tools to serve the specific needs of various industries, handling the volume of data they possess, and then assembling a team of professionals to manage and interpret the results, pose a number of challenges.

Security Analytics takes a different approach. It lets businesses use their existing OpenSearch cluster for detecting security threats, rather than requiring them to bear the cost of duplicating and storing their data for a separate off-the-shelf security solution. Security Analytics also leverages a schema of rules that it applies to log data to look for matches with abnormal events. These standardized rules address specific threats known throughout the industry and form a knowledge base of known attacks. Combined with a number of robust features, the rules also allow Security Analytics to be highly customizable.

## The parts of the whole

To see how this works, let’s first look at some of the components in Security Analytics.

### Detectors

Central to Security Analytics are its detectors. Detectors are components that interpret log data, compare that data to a schema of rules, and define the triggers that generate findings and the alerts that notify administrators of possible security events in the system. Their advantage is that they offer flexibility through their configuration, and this allows a business to fine tune its detection capabilities for specific threats, wider objectives, or targets in between.

### Rules

Security Analytics leverages the versatility, portability, and up-to-date framework of [Sigma rules](https://github.com/SigmaHQ/sigma). These rules define the conditional logic applied to ingested log data and allow the system to identify an event of interest. In general, they determine exactly what type of event or attack the system is looking out for. Security Analytics uses these prepackaged, open-source rules as a starting point for describing relevant log events. But with their inherently flexible format and wide compatibility, users can import and customize Sigma rules to meet their needs.

### Log types

Log data is key to understanding activity in any network. Whether it’s server logs, firewall logs, infrastructure logs, application logs, or endpoint logs, this data is elemental in gaining insight into the activity within a network. In terms of security coverage, the more log data a security infrastructure can process the better. Similarly, the wider the variety of log types that infrastructure can ingest, the more versatile that solution. Security Analytics launched with options for the most common log types. Since then, we have devoted significant energy to expanding support for more and more log types. And that trend will continue.

### The user interface and dashboards

The Security Analytics user interface is part of OpenSearch Dashboards and provides real-time visualizations for findings, alerts, and other analytics. Interaction with the Dashboards UI is intuitive and lets users easily navigate features and perform essential actions. Most importantly, the interface presents graphical information on network events happening in the moment. And to facilitate analysis of findings, we are continuously expanding support for dashboards that can present findings in a number of varied formats—such as charts, graphs, and maps—giving users the ability to customize their visualizations.

(Dev or Jimish - provide screen grab of the Overview page lit up like a Christmas tree. Or, one of the dashboards packed full of graphics.)

By integrating these separate components into one operation, we arrive at a solution that can detect and identify suspicious events in the network, alert security operations to the possibility of an attack, and display findings in real time so that users can inspect and evaluate events to determine whether they need to take action.

## How it works

Security Analytics interprets data in a company’s existing log files to identify abnormalities or suspicious patterns in network activity. After the log data is ingested in the system, detectors map the data to a common rule schema and transform it into meaningful events that can be applied to the rules. Depending on which rules have been assigned during configuration of the detector, the detector applies certain criteria to the log data and executes a match when any of the criteria are met. This generates a finding, which is simply an incident in which the detector has isolated as an event of interest. Simultaneously, the event triggers an alert, and security operations members are notified of the incident.

(There could be a flow diagram graphic here to visually represent the sequence of events above)

The user interface in OpenSearch Dashboards lists individual findings according to preferred metrics and displays these findings in a configurable graph so that users can drill down to see incidents in a short time frame, or expand out to get a sense of trends over a longer time period. The same format is applied to an Alerts dashboard so that users can track alerts in a selected span of time and view them by severity levels or whether or not they are still active or acknowledged.

## Looking ahead

Since its release in version 2.4, Security Analytics has experienced refinements to both its functionality and number of features. However, there is room for improvement and more work to do before Security Analytics becomes the comprehensive tool we envisioned at the outset of development. Here are a few of the updates we hope to address in the near future.

Keeping in line with our efforts to date, we will continue to expand log-type compatibility so that the options for using log data are as extensive as the systems that generate the data. This will be an incremental effort. But the list of supported log types will increase with each new version. Some log types we plan to add in upcoming releases include Cisco ASA, Palo Alto Networks Firewall logs, Cloudfront, SecurityHub findings, and Route53, to name just a few.

Closely related, we also plan to increase support of out-of-the-box dashboards for a larger pool of log types. Currently, when users create detectors for the **Network events**, **CloudTrail logs**, or **S3 access logs** log types, the system automatically generates a dashboard for visualizing the data generated by the detector. This will be true for more and more log types in future versions.

In terms of threat detection, the ability to correlate threat patterns across different log sources offers a clearer and more thorough view of potential malicious activity in a network. To enable Security Analytics to accomplish this, we have plans to create a Correlation engine that could not only draw these connections across log types but between current and previous findings.

Other improvements on the horizon include chaining of alerts, better ingestion of log data, and further integration with other OpenSearch functionality. These are just a few of the steps along the way to making Security Analytics a highly effective tool for protecting your data and preventing disruptions to business. The modern reality of doing business may never be completely free from bad actors interested in unlawful access to and theft of other’s data. But the industry is responding to those circumstances in smart ways with smart solutions. In that spirit, Security Analytics addresses the challenges of keeping data safe from attacks so data owners can focus more time on the business of doing business.

## Getting involved

As the first open-source SIEM available in the market, Security Analytics presents opportunities for the community to become involved early in its evolution. There are a few different options for participating in the project. And we’d love to hear from you. To get involved in the discussion, have a look at the [Security Analytics forum(https://forum.opensearch.org/c/plugins/security-analytics/73). To keep up to date on developments, see the [list of issues](https://github.com/opensearch-project/security-analytics/issues) in the Security Analytics repository to find out what enhancements are in the pipeline. And to make contributions, see the [Contributing Guidelines](https://github.com/opensearch-project/security-analytics/blob/main/CONTRIBUTING.md) in the repository.

