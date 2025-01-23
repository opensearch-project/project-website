---
layout: post
title:  "Enhancing Anomaly Detection in Amazon OpenSearch Service: A Customer Success Story"
authors:
 - kaituo
 - kentonparton
 - amitgalitz
date: 2025-01-22
categories:
 - technical-posts
 - community
meta_keywords: OpenSearch anomaly detection, rule, expected value, ratio, customer success
meta_description: By collaborating closely with customers like EBSCO, we released rule-based anomaly detection to deliver more accurate, actionable, and customizable monitoring solutions.
has_math: true
has_science_table: false
---

As organizations increasingly rely on cloud services, monitoring and detecting anomalies in system behavior has become crucial for maintaining reliable operations. In this post, we'll explore recent improvements to Amazon OpenSearch Service's Anomaly Detection (AD) feature, highlighting how these enhancements have helped EBSCO Information Services optimize their transaction logging system monitoring.

## Introduction
Amazon OpenSearch Service's Anomaly Detection helps customers automatically identify unusual patterns in their data. While the feature has proven valuable for many users, we recognized opportunities for improvement based on customer feedback. This post details significant updates to the AD plugin model, particularly focusing on rule-based anomaly detection and its real-world application.

## The Challenge
EBSCO Information Services, a leading provider of research databases and discovery services, uses Amazon OpenSearch Service to monitor transaction logging across their entire product suite. This monitoring plays a vital role in understanding customer engagement with EBSCO products and helps customers make informed decisions about database subscriptions through detailed usage reporting.

While activity levels across EBSCO's products naturally fluctuate, significant and sustained changes in usage patterns can indicate potential issues. Most commonly, these changes result from transaction producers inadvertently modifying their application or logging logic. In these cases, particularly when there are substantial drops in activity, EBSCO needs to quickly identify the change and alert the responsible development team.

Initially, EBSCO faced two primary challenges with anomaly detection:
1. False Positives: The system generated an excessive number of alerts, making it difficult to isolate genuinely anomalous patterns  
2. Missing Critical Events: The system sometimes failed to identify significant volume drops, including instances where service volumes decreased by up to 50%

## Enhanced Features: Customizable Suppression Rules
To address these challenges, we've implemented significant improvements in OpenSearch 2.17 and above, focusing on Customizable Suppression Rules. This enhancement allows users to set specific thresholds to ignore anomalies based on both absolute values and relative percentages.

The suppression rules feature is particularly powerful for handling common scenarios that previously generated false positives. For example, in monitoring transaction volumes, EBSCO could configure rules to suppress alerts when variations stay within expected thresholds (such as ignoring drops less than 25% and increases greater than 50% above normal levels), while still detecting significant drops that might indicate real issues.

## Implementation and Results
After implementing these improvements, EBSCO saw significant enhancements in their anomaly detection capabilities:

1. Reduced False Positives: Through customizable suppression rules, they could filter out minor variations (like 16% changes) while maintaining sensitivity to genuine anomalies  
2. More Actionable Alerts: The team now receives fewer but more meaningful notifications, allowing them to focus on genuine issues requiring attention

## Configuring Rules in AD: A Community Example
In a [forum post](https://forum.opensearch.org/t/using-anomaly-detection-to-detect-sudden-increases-or-decreases-in-the-amount-of-logs-received-for-an-index/8628), a user wanted to detect significant changes in log volume, using the AD plugin to count occurrences based on a timestamp field. However, the default settings flagged anomalies for relatively small increases of about 2–5%, which was too sensitive. Their goal was to receive alerts only for changes of about 10% or more.

To illustrate this scenario, we generated synthetic log data over a 24-hour period with a gradual upward trend. We then introduced random “change points,” where the log count level would shift by 2–5%. A feature was set up to track total log volume.

![feature](/assets/media/blog-images/2025-01-23-ad-rule-cx-success/feature.png){:class="img-centered"}

Initially without rule-based AD, the system reported multiple anomalies—even for minor fluctuations—making it difficult to spot genuinely significant changes.

![result-before](/assets/media/blog-images/2025-01-23-ad-rule-cx-success/result-before.png){:class="img-centered"}

By configuring a rule to only flag anomalies that deviate at least 10% (either above or below) from the expected value, we filtered out the noise. This ensures that only the meaningful spikes or dips are detected.  
Note: The user interface for setting rules may change. Refer to the [latest documentation page](https://opensearch.org/docs/latest/observing-your-data/ad/index/) for details.

![rule](/assets/media/blog-images/2025-01-23-ad-rule-cx-success/rule.png){:class="img-centered"}

Anomaly result with rule:

![result-after](/assets/media/blog-images/2025-01-23-ad-rule-cx-success/result-after.png){:class="img-centered"}

Note, if no custom rule is specified, AD defaults to a built-in filter that suppresses anomalies with less than a 20% deviation from the expected value for each enabled feature.

Additionally, in OpenSearch 2.19 and above, we have added the capability for users to add more general criteria for what a detector will consider as an anomaly. Each feature in a detector can now be configured so that we only look at either spikes or dips in the data for that feature. For example, if a user is configuring a feature which looks at CPU data across their fleet, they can configure their features so anomalies are only detected if the actual values are higher than the expected values because of a spike in CPU. A dip in CPU in this case would not trigger anomalies.

## Technical Details
The core of suppression rules is expected normal values. To build an expected value for an anomalous point, Random Cut Forest (RCF), the algorithm behind OpenSearch Anomaly Detection, replaces the anomalous point’s most suspicious dimension with a typical value learned from historical data. Here, each dimension corresponds to a metric value within a context or recent-history window, and the overall anomaly score depends on these dimensions.  
RCF partitions the data by selecting a dimension $i$ with probability proportional to its range, then choosing a random cut value within that range. If $l_i$ is the difference between the maximum and minimum values observed in dimension $i$, the probability of cutting along $i$ is $\frac{l_i}{\sum_j l_j}$. These random cuts isolate anomalous points, and RCF sums the anomaly scores across all dimensions to compute the final anomaly score. To identify which dimension contributes most to an anomaly, RCF tracks each dimension’s portion of the total anomaly score. The dimension with the highest contribution is deemed the most suspicious.  

RCF then imputes a more “normal” value for this suspicious dimension by treating it as if it were missing in the queried point. Specifically, the algorithm:  
- **Root to Leaf** – RCF starts at the root of each tree in the forest and traverses downward toward a leaf.  
- **Splitting Normally** – At each node, if the node’s split dimension is present in the query point, RCF follows that branch.  
- **Missing Dimension** – If the split dimension is “missing” (i.e., the dimension to be replaced), RCF explores both child nodes and selects the path with the lower anomaly score. Each internal node has two children—one on the left side of the random cut, and one on the right.  
- **Arriving at a Leaf** – Eventually, RCF reaches a leaf node deemed relatively normal. The algorithm uses that leaf’s value for the suspicious dimension, creating a “corrected” version of the anomalous point.  
- **Final Imputation** – RCF gathers these candidate values from all trees and takes their median as the final expected value for the anomalous dimension.

## Looking Forward
OpenSearch AD’s rule-based anomaly detection already supports suppressing anomalies when the difference or relative ratio between actual and expected values meets certain conditions. However, this is just the beginning. We plan to introduce additional rule types—such as only reporting anomalies that persist for multiple consecutive intervals. For example, while a CPU spike to 100% might be flagged as an anomaly by default, a user may only care if CPU usage remains between 80% and 100% for 10 consecutive intervals. In this case, the system can hold off on raising an alert until the extended condition is met.

We are also exploring rules based on categorical data, enabling component-specific thresholds or conditions. Different teams or owners can then define tailored anomaly detection rules for their areas of responsibility. Finally, we plan to incorporate planned outages or holidays into the RCF models, giving users the ability to mark these events so anomalies occurring during such periods are ignored. By incorporating the duration of extended anomalies, categorical data, and event calendars, OpenSearch AD can become even more flexible and accurate in separating true anomalies from ordinary fluctuations.

## Conclusion
The improvements to Amazon OpenSearch Service's Anomaly Detection feature demonstrate our commitment to meeting customer needs. Through collaboration with customers like EBSCO, we continue to enhance our services to provide more accurate, useful, and customizable monitoring solutions.

To learn more about Amazon OpenSearch Service's Anomaly Detection feature, visit our [documentation page](https://opensearch.org/docs/latest/observing-your-data/ad/index/).

