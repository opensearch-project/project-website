---
layout: post
title: "Enhancing OpenSearch Anomaly Detection: Reducing False Positives Through Algorithmic Improvements"
+author:
- kaituo
+date: 2024-12-26
+categories:
  - technical-posts
+meta_keywords: anomaly detection, false positives, algorithmic improvements, OpenSearch, nab benchmark
+meta_description: Explore how recent algorithmic improvements in RCF reduces false positives in OpenSearch Anomaly Detection. Illustrate the improvements with NAB benchmark.
---

# Enhancing OpenSearch Anomaly Detection: Reducing False Positives Through Algorithmic Improvements

The machine learning algorithm underpinning the Anomaly detection (AD) plugin is [Random Cut Forest (RCF)](https://github.com/aws/random-cut-forest-by-aws/). AD team have implemented four major changes in RCF to reduce false positives significantly and integrated with newest RCF in OpenSearch 2.17.

## Algorithmic Improvements in RCF

### Adaptive Learning for Data Drift, Level Shifts, and Recurring Periodic Spikes

The model employs statistical tracking and adaptive thresholds to handle gradual changes in data distributions (data drifts), abrupt baseline shifts (level shifts), and recurring periodic spikes. Instead of updating global statistics for all data points, it focuses on a small set of instances that appear unusual—candidate anomalies identified by high RCF scores. By incrementally updating their running mean and variance using exponential decay, the model can quickly recalibrate its notion of normality. This targeted approach gives recent observations greater influence, enabling rapid adaptation to new patterns, reducing false positives from periodic spikes, and letting older data points gradually lose relevance.

When the model encounters multiple anomalies in succession, it suspects that these previously unusual observations may signify a stable new pattern. To confirm this, it compares two sets of values—actual and expected—across relevant dimensions:

**Actual vs. Actual Mean:**  
The model checks whether actual observations stay close to their running mean within acceptable margins. Because these statistics are updated based on candidate anomalies, the model can quickly adapt to shifts or recurring patterns in the data.

**Expected vs. Expected Mean:**  
It also examines "expected" observations—imputed values representing the model's notion of normal—to ensure they remain stable around their own running mean. This continuous refinement helps maintain an accurate baseline as conditions evolve.

If, after several consecutive anomalies, both actual and expected values remain within their updated variation ranges, the model concludes that what once seemed anomalous is now the new normal. It then stops flagging these points as anomalies.

### Alert-Once Suppression

In addition to adapting to evolving baselines, the model supports "alert once" suppression. If the system is configured to ignore multiple anomalies occur back-to-back within a single shingle (time window), the model will issue one alert and then suppress further anomaly notifications. By doing so, it prevents a cascade of alerts for essentially the same situation, ensuring that users aren't inundated with redundant warnings.

### Utilizing Approximate Nearest Neighbors

RCF now leverages native approximate nearest-neighbor computations to determine the average distance between a queried point and its nearest neighbors across multiple trees. For each tree, we start from the root node and follow the cut dimensions downward until we identify the node closest to the queried point; this node is then considered a neighbor. If at least 10% of these neighbors lie within the computed average Euclidean distance, the queried point is deemed normal.

### Rescoring Using Expected Value Vectors

The model begins by constructing an expected value vector for the candidate anomaly, essentially creating a "normal" counterpart to the anomalous point. It does this by identifying the most problematic elements in the candidate and replacing them with values drawn from previously observed data. In other words, the model searches its historical information to find values that are statistically likely to co-occur with the candidate's remaining attributes. These substituted values produce a reconstructed version of the candidate that aligns more closely with historical norms.

Once the expected value vector is formed, the model re-calculates its RCF score. If the absolute difference between the candidate anomaly's original score and this new "expected" score remains below a certain scaled threshold—one adjusted based on both the previous anomaly's score and the current threshold—the model concludes that the candidate is not sufficiently distinct. This prevents the model from repeatedly flagging essentially the same anomalies, thereby reducing redundant alerts and improving overall efficiency.

In the following section, we include an empirical study of RCF AD performance on labeled CloudWatch metrics from the [Numenta Anomaly Benchmark (NAB)](https://github.com/numenta/NAB).

## Case Study: Numenta Anomaly Benchmark (NAB)

To empirically evaluate RCF's performance improvements, we conducted a case study using labeled CloudWatch metrics from the Numenta Anomaly Benchmark (NAB). This dataset includes AWS server metrics such as CPU utilization, network bytes in, and disk read bytes, along with ground truth anomaly labels provided by Numenta.

The RCF models were configured with 50 trees, each trained on 256 samples, and used a shingle size of 8. They required a warm-up period of 40 data points before producing detection results. Additionally, the models enforced a constraint that actual values must deviate from expected values by at least 20%, either exceeding or falling below them. These settings align with the default RCF parameters employed by the OpenSearch AD plugin. Furthermore, an anomaly grade threshold of 0.5 was applied to filter out lower-severity anomalies.

The results of applying RCF to each dataset are as follows.

### CPU utilization

**Stats**

* Dataset: NAB AWS ec2_cpu_utilization_24ae8d
* Total records: 4031
* Actual anomalies label:
    * 2014-02-26 22:05:00 - Detected
    * 2014-02-27 17:15:00 - Detected
* Total RCF anomalies: 3

![cpu](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/cpu.png){:class="img-centered"}

### Network in

**Stats**

* Dataset: NAB AWS ec2_network_in_257a54
* Total Records: 4031
* Actual Anomalies Label
    * 2014-04-15 16:44:00 - Detected
* Total RCF anomalies: 4

![network](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network.png){:class="img-centered"}

### Disk write bytes

**Stats**

* Dataset: NAB AWS ec2_disk_write_bytes_1ef3de
* Total Records: 4718
* Actual Anomalies Label
    * 2014-03-10 21:09:00 - Detected
* Total RCF anomalies: 3

![disk](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/disk.png){:class="img-centered"}

### RDS CPU

**Stats**

* Dataset: NAB AWS rds_cpu_utilization_e47b3b
* Total Records: 4031
* Actual Anomalies Label
    * 2014-04-13 06:52:00 - Detected
    * 2014-04-18 23:27:00 - Detected
* Total RCF anomalies: 2

![rds](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/rds.png){:class="img-centered"}

### RDS CPU cc0c53

**Stats**

* Dataset: NAB AWS rds_cpu_utilization_cc0c53
* Total Records: 4031
* Actual Anomalies Label
    * 2014-02-25 07:15:00 - Detected
    * 2014-02-27 00:50:00 - Undetected
* Total RCF anomalies: 1

![rds_cc0c53](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/rds_cc.png){:class="img-centered"}

## Precision/Recall Summary

Before we begin, let's define two key concepts in machine learning evaluation:

* **Precision**: Of all the items (anomalies) the system said were "positive," how many truly were? In other words, if the model detects 10 anomalies and 8 are actually correct, then the precision is 80% (8 divided by 10). A high precision means few "false alarms."
* **Recall**: Of all the items (anomalies) that truly existed, how many did the system manage to detect? For example, if there are 10 real anomalies and the model detects 8 of them, then the recall is 80% (8 divided by 10). A high recall means the model rarely misses real anomalies.

The following table summarizes RCF's performance on the NAB CloudWatch benchmarks:

| Data Set | Precision | Recall |
|----------|-----------|--------|
| AWS ec2_cpu_utilization_24ae8d | 0.67 | 1 |
| AWS ec2_network_in_257a54 | 0.25 | 1 |
| AWS ec2_disk_write_bytes_1ef3de | 0.33 | 1 |
| AWS rds_cpu_utilization_e47b3b | 1 | 1 |
| AWS rds_cpu_utilization_cc0c53 | 1 | 0.5 |

Overall, RCF demonstrated high recall, correctly detecting 7 out of 8 anomalies across the datasets. In fact, it achieved perfect recall in four out of the five datasets. 

RCF achieves both tractable and high precision. Most false positives occur early in the time series before the model has observed enough historical data. For example, in the dataset ec2_network_in_257a54, the anomaly detected around April 12, 3:14 stands out because it breaks the previously observed pattern of uniform double spikes. Earlier patterns showed the second spike declining within about five minutes, whereas this anomalous spike exhibits an extended decline period of roughly ten minutes.

![network_zoom_in](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network_zoom_in_1.png){:class="img-centered"}

If we designate the first 20% of the dataset as a probation period and exclude it from the precision and recall calculations, the remaining 80% of the data produces the following results:

| Data Set | Precision | Recall |
|----------|-----------|--------|
| AWS ec2_cpu_utilization_24ae8d | 1 | 1 |
| AWS ec2_network_in_257a54 | 0.5 | 1 |
| AWS ec2_disk_write_bytes_1ef3de | 1 | 1 |
| AWS rds_cpu_utilization_e47b3b | 1 | 1 |
| AWS rds_cpu_utilization_cc0c53 | 1 | 0.5 |

Another type of 'false positive' occurs when detected anomalies appear legitimate, but the labels do not classify them as such. A misclassification appears in the ec2_network_in_257a54 dataset, where the anomaly detected on April 15, around 3:34 deviates from the previously observed pattern of paired spikes. Instead of the usual two consecutive peaks, this event presents only a single spike. Even though it indicates a meaningful departure from the established pattern, it remains unlabeled.

![network_zoom_in_3](/assets/media/blog-images/2024-12-26-Reducing-false-positives-through-algorithmic-improvements/network_zoom_in_3.png){:class="img-centered"}

## Comparison with OpenSearch 2.9

### Definition

* **True Positive**: The system flags an event as anomalous, and it is actually anomalous (i.e., confirmed by ground truth).
* **False Positive (Spurious Alert)**: The system flags an event as anomalous when it is actually normal.
* **False Negative**: The system fails to flag an event as anomalous when it is indeed anomalous.

With these definitions in mind, let's examine how OpenSearch 2.17 has improved its anomaly detection performance relative to OpenSearch 2.9. The table below shows a decrease in spurious alerts and an increase in real alerts. Initially, 112 anomalies were flagged, of which only 6 were true—indicative of a high false-positive rate. In OpenSearch 2.17, after algorithmic enhancements, only 13 anomalies were flagged, and 7 of them were true. This outcome reflects an increase in precision from 6/112 (5.4%) to 7/13 (53.8%) and an increase in recall from 6/8 (75%) to 7/8 (87.5%).

In other words, OpenSearch 2.9 yielded 106 false positives, whereas OpenSearch 2.17 produced just 6—a 92.6% reduction in false positives. At the same time, OpenSearch 2.9 missed 2 real anomalies, whereas OpenSearch 2.17 missed only 1—representing a 50% reduction in false negatives.

In other words, OpenSearch 2.9 yielded **106 false positives**, whereas OpenSearch 2.17 produced just **6**—a **94.3%** reduction in false positives. This percent reduction can be calculated using:

$$
\text{Percent Reduction in FP} 
= \frac{\text{Old FP} - \text{New FP}}{\text{Old FP}} \times 100\%
= \frac{106 - 6}{106} \times 100\% = 94.3\%
$$

Similarly, OpenSearch 2.9 **missed 2 real anomalies**, whereas OpenSearch 2.17 missed just **1**—representing a **50%** reduction in false negatives, computed as follows:

$$
\text{Percent Reduction in FN} 
= \frac{\text{Old FN} - \text{New FN}}{\text{Old FN}} \times 100\%
= \frac{2 - 1}{2} \times 100\% = 50\%
$$

Hence, OpenSearch 2.17 significantly decreased both false positives and false negatives compared to version 2.9.


| Data Set                             | 2.9 Reported | 2.9 True Positives | 2.17 Reported | 2.17 True Positives | Ground Truth |
|--------------------------------------|-------------:|-------------------:|--------------:|--------------------:|-------------:|
| AWS ec2_cpu_utilization_24ae8d       |           17 |                  1 |             3 |                   2 |            2 |
| AWS ec2_network_in_257a54            |           33 |                  1 |             4 |                   1 |            1 |
| AWS ec2_disk_write_bytes_1ef3de      |           16 |                  1 |             3 |                   1 |            1 |
| AWS rds_cpu_utilization_e47b3b       |           23 |                  2 |             2 |                   2 |            2 |
| AWS rds_cpu_utilization_cc0c53       |           23 |                  1 |             1 |                   1 |            2 |
| **Totals**                           |          112 |                  6 |            13 |                   7 |            8 |



## Conclusions

The enhancements to the RCF algorithm, now integrated into OpenSearch 2.17, significantly reduce false positives. By tracking a history of candidate anomalies, adapting to evolving data patterns, implementing alert-once suppression, and refining scores through expected value comparisons, the updated approach effectively addresses complex real-world challenges—such as data drift, level shifts, and periodic spikes—while maintaining high recall. Empirical tests on the NAB CloudWatch benchmarks further confirm its effectiveness, with 94.3% reduction in false positives and 50% reduction in false negatives.