---
layout: post
title: "Enhancing OpenSearch Anomaly Detection: Reducing False Positives Through Algorithmic Improvements"
authors:
  - kaituo
  - kolchfa
date: 2024-12-26
categories:
  - technical-posts
has_math: true
has_science_table: true
meta_keywords: anomaly detection, false positives, algorithmic improvements, OpenSearch, nab benchmark
meta_description: Explore how recent algorithmic improvements in RCF reduces false positives in OpenSearch Anomaly Detection. Illustrate the improvements with NAB benchmark.
---

The Anomaly Detection (AD) plugin in OpenSearch is powered by the [Random Cut Forest (RCF)](https://github.com/aws/random-cut-forest-by-aws/) algorithm. In OpenSearch 2.17, The AD team has introduced four major enhancements to RCF, significantly reducing false positives. In this blog post, we'll explore four major algorithmic improvements to OpenSearch's Random Cut Forest (RCF) algorithm that have resulted in a 94.3% reduction in false positives while maintaining high detection accuracy, demonstrate these improvements through real-world case studies, and provide a detailed comparison with previous OpenSearch versions.

<style>

table { 
    font-size: 16px; 
}

h3 {
    font-size: 22px;
}
h4 {
    font-size: 20px;
}

td {
    text-align: right;
}

td:first-child {
    text-align: left;
}

th {
    background-color: #f5f7f7;
}​

</style>

## Improvements in the RCF algorithm

OpenSearch 2.17 introduced the following improvements in the RCF algorithm.

### Adaptive learning for data drift, level shifts, and recurring periodic spikes

The RCF algorithm employs statistical tracking and adaptive thresholds in order to handle gradual changes in data distribution (data drift), sudden baseline shifts (level shifts), and recurring periodic spikes. Instead of updating global statistics for all data, the algorithm focuses on a small set of instances that appear unusual—--the candidate anomalies identified by high RCF scores. By incrementally updating their running mean and variance using exponential decay, the algorithm can quickly recalibrate its definition of normal behavior. This targeted approach gives recent observations greater influence, allowing the system to quickly adapt to new patterns. As a result, false positives from periodic spikes are reduced and older data points gradually lose relevance.

When multiple consecutive anomalies occur, the algorithm examines whether they represent a new stable pattern. It compares the following two sets of values (actual and expected) for the affected dimensions:

- **Actual observations and their running mean**: The algorithm compares the actual current observations against their running mean to ensure that they stay within acceptable margins. Because these statistics are updated based on candidate anomalies, the algorithm can quickly adapt to shifts or recurring patterns in the data.

- **Expected observations and their running mean**: The algorithm examines _expected_ observations---calculated values representing the algorithm's understanding of normal behavior—--to ensure they remain stable within their running mean. This continuous refinement helps maintain an accurate baseline as conditions evolve.

If both actual and expected values remain within their updated acceptable ranges after multiple anomalies, the algorithm adjusts its baseline and stops flagging these as anomalies.

### Grouped alerting

If the system is configured to ignore multiple successive anomalies, the algorithm supports grouped alerting. When multiple unusual events occur close together (within one time window, or _shingle_), you'll receive just one alert instead of many. This prevents alert fatigue by avoiding multiple notifications about the same issue.

### Using approximate nearest neighbors for anomaly detection

RCF now uses approximate nearest-neighbor computations to determine if a data point is _normal_ (not anomalous). The algorithm calculates the average distance between a queried point and its neighbors across multiple trees in the forest. For each tree, it starts from the root node and follows the cut dimensions downward until it identifies the node closest to the queried point; this node is then considered a neighbor. If at least 10% of these neighbors fall within the computed average Euclidean distance, the queried point is deemed normal.

### Rescoring using expected value vectors

The algorithm starts by constructing an expected value vector for the candidate anomaly. This serves as a _normal_ counterpart to the anomalous point. To construct this vector, the model identifies the elements in the candidate that deviate most from historical norms and replaces them with values drawn from historical data. These replacements are based on values that are statistically likely to co-occur with the candidate's remaining attributes. The result is a reconstructed version of the candidate that aligns more closely with historical patterns.

After forming the expected value vector, the algorithm recalculates the RCF score. It then compares the original anomaly score with this new expected score. If the absolute difference between these scores is below a scaled threshold—--adjusted for both the prior anomaly's score and the current threshold—--the algorithm determines that the candidate is not sufficiently distinct to warrant attention. This process helps the algorithm avoid repeatedly flagging similar anomalies, reducing redundant alerts and improving efficiency.

## Evaluating RCF using the Numenta Anomaly Benchmark

To test these improvements, the AD team evaluated RCF using labeled AWS CloudWatch metrics from the [Numenta Anomaly Benchmark (NAB)](https://github.com/numenta/NAB). The datasets include AWS server performance metrics, such as CPU utilization, incoming network traffic (measured in bytes), and disk write activity (measured in bytes). These datasets also contain verified anomaly labels provided by Numenta, which serve as a reliable reference for identifying abnormal patterns.

### Test configuration

We used the following RCF configuration for testing:

- 50 trees, each trained on 256 samples  
- A shingle size of 8  
- A warm-up period of 40 data points  
- Anomaly grade threshold of 0.5 to filter out lower-severity anomalies 
- A constraint requiring actual values to deviate by at least 20% from expected values  

These settings match the default RCF parameters in the OpenSearch AD plugin.

### Results 

The following sections provide test results for various metrics.

#### CPU utilization

- **Dataset**: NAB AWS `ec2_cpu_utilization_24ae8d`  
- **Total records**: 4,031  
- **Labeled anomalies**:  
  - 2014-02-26 22:05:00 (Detected)  
  - 2014-02-27 17:15:00 (Detected)  
- **Total RCF anomalies**: 3  

![cpu utilization](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/cpu.png){:class="img-centered"}

#### Incoming network traffic

- **Dataset**: NAB AWS `ec2_network_in_257a54`  
- **Total records**: 4,031  
- **Labeled anomalies**:  
  - 2014-04-15 16:44:00 (Detected)  
- **Total RCF anomalies**: 4  

![network in](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network.png){:class="img-centered"}

#### Disk write activity

- **Dataset**: NAB AWS `ec2_disk_write_bytes_1ef3de`  
- **Total records**: 4,718  
- **Labeled anomalies**:  
  - 2014-03-10 21:09:00 (Detected)  
- **Total RCF anomalies**: 3  

![disk write bytes](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/disk.png){:class="img-centered"}

#### RDS CPU utilization (rds_cpu_utilization_e47b3b)

- **Dataset**: NAB AWS `rds_cpu_utilization_e47b3b`  
- **Total records**: 4,031  
- **Labeled anomalies**:  
  - 2014-04-13 06:52:00 (Detected)  
  - 2014-04-18 23:27:00 (Detected)  
- **Total RCF anomalies**: 2  

![RDS CPU utilization](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/rds.png){:class="img-centered"}

#### RDS CPU utilization (rds_cpu_utilization_cc0c53)

- **Dataset**: NAB AWS `rds_cpu_utilization_cc0c53`  
- **Total records**: 4,031  
- **Labeled anomalies**:  
  - 2014-02-25 07:15:00 (Detected)  
  - 2014-02-27 00:50:00 (Undetected)  
- **Total RCF anomalies**: 1  

![rds_cc0c53](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/rds_cc.png){:class="img-centered"}

## Precision and recall

Before we present precision and recall results, let's define two key concepts in machine learning evaluation:

- **Precision**: The proportion of detected anomalies that are correct: of all the anomalies the algorithm detected, how many were true anomalies? High precision means fewer false positives. For example, if the algorithm detects 10 anomalies and 8 are actually anomalies, then the precision is 8 / 10 = 0.8, or 80%.  
- **Recall**: The proportion of true anomalies that are detected: of all true anomalies, how many did the algorithm detect? High recall means fewer missed anomalies. For example, if there are 10 true anomalies and the algorithm detects 8 of them, then the recall is 8 / 10 = 0.8, or 80%.  

### Results

The following table summarizes RCF's precision and recall performance using the NAB CloudWatch benchmarks.

| Dataset | Precision | Recall |
|-----|-----------|--------|
| AWS `ec2_cpu_utilization_24ae8d`  | 0.67      | 1      |
| AWS `ec2_network_in_257a54`       | 0.25      | 1      |
| AWS `ec2_disk_write_bytes_1ef3de` | 0.33      | 1      |
| AWS `rds_cpu_utilization_e47b3b`  | 1         | 1      |
| AWS `rds_cpu_utilization_cc0c53`  | 1         | 0.5    |

Overall, RCF demonstrated strong recall, correctly detecting 7 out of 8 anomalies across the datasets. Notably, it achieved perfect recall in four of the five datasets. 

RCF also maintains both high precision and computational efficiency. Most false positives occur early in the time series, before the model has accumulated sufficient historical data for accurate predictions. For example, in the following graph, the anomaly detected around April 12 at 3:14 for the `ec2_network_in_257a54` dataset is particularly noteworthy. It deviates from the previously observed pattern of uniform double spikes. Earlier patterns show the second spike declining within approximately five minutes, whereas this anomalous spike exhibits an extended decline lasting around ten minutes. 

![network_zoom_in](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network_zoom_in_1.png){:class="img-centered"}
When excluding the first 20% of data as a probation period, precision improves across datasets. This adjustment highlights how RCF becomes more accurate after observing enough historical data. The results of the last 80% of the dataset are summarized in the following table.

| Data Set | Precision | Recall |
|----------|-----------|--------|
| AWS ec2_cpu_utilization_24ae8d | 1 | 1 |
| AWS ec2_network_in_257a54 | 0.5 | 1 |
| AWS ec2_disk_write_bytes_1ef3de | 1 | 1 |
| AWS rds_cpu_utilization_e47b3b | 1 | 1 |
| AWS rds_cpu_utilization_cc0c53 | 1 | 0.5 |

Another type of false positive occurs when detected anomalies seem valid based on the data but are in fact not labeled as anomalies. For example, in the following graph, the anomaly detected on April 15 at approximately 3:34 for the `ec2_network_in_257a54` dataset deviates from the typical pattern of paired spikes. Instead of the usual two consecutive peaks, this event shows a single spike. While this represents a significant departure from the established pattern, it is not labeled as an anomaly. 

![network_zoom_in_3](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network_zoom_in_3.png){:class="img-centered"}

## OpenSearch 2.17 and 2.9 compared

Let's examine how OpenSearch 2.17 has improved its anomaly detection performance relative to OpenSearch 2.9. Before we present the results, let's define the following key concepts:

- **True positive (correct detection)**: An true anomolous event correctly flagged as anomalous by the algorithm.  
- **False positive (false alarm)**: A non-anomalous event incorrectly flagged as anomalous by the algoritm.  
- **False negative (missed anomaly)**: An anomalous event that the system fails to flag as anomalous.

### Results

The following table compares anomaly detection in OpenSearch versions 2.9 and 2.17.

| Dataset | 2.9 anomalies detected | 2.9 true positives | 2.17 anomalies detected | 2.17 true positives | Actual anomalies |
|--------------------------------------|-------------:|-------------------:|--------------:|--------------------:|-------------:|
| AWS ec2_cpu_utilization_24ae8d       |           17 |                  1 |             3 |                   2 |            2 |
| AWS ec2_network_in_257a54            |           33 |                  1 |             4 |                   1 |            1 |
| AWS ec2_disk_write_bytes_1ef3de      |           16 |                  1 |             3 |                   1 |            1 |
| AWS rds_cpu_utilization_e47b3b       |           23 |                  2 |             2 |                   2 |            2 |
| AWS rds_cpu_utilization_cc0c53       |           23 |                  1 |             1 |                   1 |            2 |
| **Totals**                           |          112 |                  6 |            13 |                   7 |            8 |

### Discussion

Version 2.17 showed an overall reduction in false alerts and an increase in true alerts compared to version 2.9. 

OpenSearch 2.9 flagged 112 anomalies, but only 6 were true anomalies, resulting in a high false positive rate. After algorithmic improvements in OpenSearch 2.17, only 13 anomalies were flagged, with 7 being true anomalies. This reflects a significant increase in precision, from 5.4% (6/112) to 53.8% (7/13) and increase in recall from 75% (6/8) to 87.5% (7/8).

In comparison, OpenSearch 2.9 produced 106 false positives, while OpenSearch 2.17 produced just 6—--representing a **94.3% reduction in false positives**. Moreover, OpenSearch 2.9 missed 2 true anomalies, while OpenSearch 2.17 missed only 1, achieving a **50% reduction in false negatives**. This percent reduction can be calculated using the following formulas:

$$
\text{Percent Reduction in FP} 
= \frac{\text{Old FP} - \text{New FP}}{\text{Old FP}} \times 100\%
= \frac{106 - 6}{106} \times 100\% = 94.3\%
$$

Similarly, OpenSearch 2.9 missed 2 real anomalies, whereas OpenSearch 2.17 missed just 1--—representing a **50% reduction in false negatives**, computed as follows:

$$
\text{Percent Reduction in FN} 
= \frac{\text{Old FN} - \text{New FN}}{\text{Old FN}} \times 100\%
= \frac{2 - 1}{2} \times 100\% = 50\%
$$

Overall, OpenSearch 2.17 significantly decreased both false positives and false negatives compared to version 2.9.






## Conclusions

The enhancements to the RCF algorithm in OpenSearch 2.17 improve anomaly detection by greatly reducing false positives. By tracking the history of candidate anomalies, adapting to changing data patterns, implementing grouped alerting, and refining scores through expected value comparisons, the updated approach addresses real-world challenges like data drift, level shifts, and periodic spikes, while maintaining high recall. Empirical tests using the NAB CloudWatch benchmarks validate its effectiveness, showing a 94.3% reduction in false positives and a 50% reduction in false negatives.