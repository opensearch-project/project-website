---
layout: post

title:  "A customer impact journey: When no data is still important data"
authors:
 - kaituo
 - patrikblomberg 
date: 2025-11-07
categories:
 - technical-posts
 - community
meta_keywords: OpenSearch anomaly detection, Klarna, anomaly detection plugin, configure imputation, missing data
meta_description: Discover how Amazon OpenSearch Service’s enhanced anomaly detection enabled Klarna to reduce false negatives and strengthen system monitoring through imputation techniques.
has_math: true
has_science_table: false
---

As companies increasingly depend on real-time insights to maintain reliable operations, handling missing data correctly has become essential for accurate anomaly detection. In this post, we explore recent improvements to the Amazon OpenSearch Service Anomaly Detection plugin, inspired by Klarna’s real-world monitoring use case, where even “no data” proved to be important data.

## Introduction

Anomaly detection in Amazon OpenSearch Service enables users to automatically identify unusual patterns and behaviors in their data streams. This powerful capability has become an essential tool for many organizations seeking to monitor system health, detect issues early, and maintain operational excellence.

However, through continuous customer feedback and real-world usage, we have identified areas where the Anomaly Detection plugin could be further improved, particularly in how it handles scenarios with missing or insufficient input data.

This post highlights key enhancements to the Anomaly Detection plugin model, explains how they address these challenges, and illustrates their impact through practical examples from real-world monitoring use cases.

## The Challenge

Klarna is a leading global payments and shopping service provider, operating a large ecosystem of consumer and merchant integrations that demand high reliability and real-time insight. To maintain the highest level of quality and uptime across this ecosystem, Klarna continuously monitors its integrations and transactions using a variety of systems designed to track performance and detect issues in real time. Klarna’s monitoring use cases involve a wide range of business and transactional metrics, analyzed across many dimensions such as markets, regions, product features, and integrations. The combination of these factors results in extremely high-cardinality time series data: a scale where efficient aggregation and anomaly detection become both technically challenging and cost-sensitive.

When migrating one of their real-time monitoring systems, Klarna evaluated several alternatives and found OpenSearch to be a promising candidate. Its flexible query model and scalable architecture made it particularly appealing for handling complex, high-cardinality data dimensions while maintaining granular visibility across merchant and partner integrations.
During testing, they confirmed that OpenSearch performed well in detecting many types of anomalies. 

However, they encountered a limitation in one of their most critical monitoring use cases. Imagine a scenario where we want to monitor the transactional flow across multiple systems in real time. The goal is to receive alerts when traffic becomes anomalous, for example, if the transaction rate drops unexpectedly or stops completely. When Klarna deployed various OpenSearch Anomaly Detectors, they observed that the detectors successfully identified sudden drops as long as the monitored metric stayed above zero. However, when the traffic for a specific high-cardinality entity stopped entirely, while the overall data stream continued to operate normally, no anomaly notifications were triggered for that entity.

## Example scenario

To investigate further, the Klarna team set up a production-like test environment where synthetic events were generated and ingested into an OpenSearch cluster in real time.
In the example below, the graph shows the event count for one of the monitored entities, identified as `merchant_ab12`. During testing, they temporarily deactivated event generation for that entity, resulting in a clear drop that lasted approximately 30 minutes.

![problem](/assets/media/blog-images/2025-11-07-klarna-imputation/problem.png){:class="img-centered"}

Before performing this test, they had deployed an OpenSearch Anomaly Detector configured with a 5-minute detection interval. As mentioned earlier, the detector correctly identified drops as long as the metric did not reach zero. In this test scenario, the complete drop occurred between two detector runs, causing the system to miss the anomaly entirely.
Even while the metric remained at zero for several intervals, the detector continued to execute but failed to report any anomalies. When the input stream resumed about 30 minutes later, the detector finally identified an anomaly; not because it recognized the earlier drop but because the traffic had started again and the metric rose above zero.
The image below illustrates how the detector perceived this scenario, as shown in the OpenSearch Anomaly Detector UI. The black line indicates the metric aggregation for each 5-minute interval. Notice that no data points were recorded while the metric was at zero.
Instead of flagging the anomaly at the onset of the drop around 16:10 (as clearly visible in the data and the graph above), the detector reported it later, at approximately 16:35, corresponding to the start of the recovery phase.

![mistake](/assets/media/blog-images/2025-11-07-klarna-imputation/ad_mistake.png){:class="img-centered"}

Upon further investigation, the team found that this behavior was rooted in how the underlying `value_count` aggregation was being used within the detector’s implementation. Instead of representing a missing event as a metric value of zero, the detector treated the absence of data as a signal to pause detection entirely. This led to an outcome that felt unintuitive to users, as a count of zero should still be a valid and meaningful value to evaluate. In practice, this limitation made it impossible to detect anomalies precisely when the monitored metric dropped to zero, arguably the moment when detection was most critical.

## Solution

Klarna's experience highlighted a crucial question in anomaly detection: how should one handle missing data? The first and simplest strategy to consider is often to widen the detector interval. In many monitoring setups, a slightly longer interval is the cleanest way to reduce the number of empty data buckets. However, too long an interval makes detection too laggy for real-time use cases. When widening the interval is not an option, imputation is the preferred solution, but it must be handled with care—imputing over long gaps can introduce stale, unrepresentative information.

With this caveat in mind, OpenSearch 2.17 introduced a configurable imputation feature. [Studies](https://arxiv.org/html/2511.01196v1#:~:text=data%20where%20missing%20values%20are,in%20the%20presence%20of%20missing) have shown that anomaly detection methods perform significantly better on incomplete data when augmented with imputation techniques versus leaving gaps unfilled, since the imputed data restores the context needed to recognize unusual activity.

### The “Impute-then-Detect” Pipeline

This new capability is powered by our **“impute-then-detect” pipeline**. At each detection interval, the system first completes the current feature vector using a policy-controlled imputer and only then scores the completed vector. The effectiveness of this pipeline hinges on the chosen imputation policy. Our solution offers three strategies:
- **`PREVIOUS` (last known value):** This is the best option if you want to effectively ignore missing data by carrying the last observation forward. It is particularly valuable for continuous event streams—such as application logs, clickstreams, or transaction logs aggregated by time—which often suffer from dropped events or blank intervals due to network issues, logging failures, or irregular sampling. These gaps can break time-series anomaly detection models or trigger false alarms. Imputing these gaps yields a continuous, regular sequence with no holes, allowing detectors to correctly identify true anomalies (like unexpected spikes or dips) without being thrown off by missing values. Furthermore, this method is especially useful for multi-feature detectors where a single missing feature would otherwise cause the entire tuple to be discarded. By imputing the missing feature, the system can proceed with anomaly detection on a complete feature vector.
- **`ZERO` or `FIXED_VALUES`:** These methods are similar and should be used when you want missing data to be treated as a potential anomaly. By filling in a value that is rare in the historical distribution (for example, appearing in less than about 0.5% of past observations, such as zero or a specific sentinel constant), you make the imputed point stand out to the detector. This approach contrasts with `PREVIOUS`, which aims to make missing data blend in. This is critical for scenarios like missing data due to outages, where the primary benefit is reliable missing data alerting.

For Klarna, who needed timely alerts, the solution was to use this feature to treat missing `value_count` metrics as zero, as shown in the detector configuration below:

![mistake](/assets/media/blog-images/2025-11-07-klarna-imputation/setting.png){:class="img-centered"}

This change had a telling effect. As the next image shows, instead of the data gap being ignored, the system now imputes zeros, correctly identifying anomalies as the metric drops:

![mistake](/assets/media/blog-images/2025-11-07-klarna-imputation/sol.png){:class="img-centered"}

### Algorithm sketch

Input: current tuple $x_t$ with missing index set $M_t$, last known complete tuple $x_{t-n}$ (for some $n \ge 1$), method $m \in \{\texttt{ZERO}, \texttt{FIXED\_VALUES}, \texttt{PREVIOUS}\}$ 

1. Select fill vector $f$: 
  - if $m = \texttt{ZERO}$ set $f := 0$;
  - if $m = \texttt{FIXED\_VALUES}$ set $f :=$ user constants;
  - else set $f := x_{t-n}$, where $n$ is the smallest integer $\ge 1$ such that $x_{t-n}$ is available (i.e., the most recent real value prior to $t$; default $n=1$).

2. For each $j \in M_t$ set $x_t[j] := f[j]$; retain originals elsewhere 

3. If there is a timestamp gap of $g > 1$:
  - For $k = 1, \dots, g-1$, construct intermediate tuples $x_t^{(k)}$:
    - $x_t^{(k)} := f$ for `ZERO`/`FIXED_VALUES`
    - $x_t^{(k)} := x_{t-n}$ for `PREVIOUS`
  - Inject each $x_t^{(k)}$ into the shingle before updating deviations

4. Normalize or difference the completed tuple to put features on a comparable scale and emphasize changes (e.g., per‑feature z‑score or simple $x_t - x_{t-1}$); then update the forest if the imputed fraction is acceptable.

5. Update data-quality metrics so prolonged imputation lowers confidence. We formalize this process in the next section.

Output: shingled, scaled point ready for scoring with deterministic imputed coordinates.

## Data-quality formalization

We quantify how missingness affects learning and decisions via a bounded, monotone data-quality signal, and expose it so users can judge how much confidence to place in the detector’s outputs—especially when imputation is active and model quality may be degraded—and decide when the data quality is high enough that an alert threshold has truly been met.

Let the shingle (window) length be $L$. A *shingle* is a sliding window of the last $L$ observations; at time $t$ we form the vector $s_t = [x_{t-L+1}, \dots, x_t]$ by concatenating the last $L$ tuples (if each $x_t \in \mathbb{R}^p$, then $s_t \in \mathbb{R}^{pL}$). Each step drops the oldest tuple and appends the newest, letting the detector capture short-term temporal patterns without an explicit state model.

To distinguish imputing one attribute vs. many, let the tuple have $D$ attributes, let $M_t \subseteq \{1,\dots,D\}$ be the set of missing attributes at time $t$, and let $\alpha_j>0$ be optional per-attribute importance weights with $\sum_{j=1}^D \alpha_j = 1$ (default $\alpha_j = 1/D$). Define the per-tuple imputation mass
$$
w_t \;=\; \sum_{j \in M_t} \alpha_j \;\in\; [0,1],
$$
so fully missing yields $w_t=1$ and fully observed yields $w_t=0$. We maintain a length-$L$ ring buffer of recent masses and define the total imputation mass in the shingle as
$$
S_t \;=\; \sum_{i=0}^{L-1} w_{t-i} \;\in\; [0,\,L].
$$
From this, we define the imputation fraction and its complementary quality signal as
$$
f_t \;=\; \frac{S_t}{L} \;\in\; [0,1],
\qquad
q_t \;=\; 1 - f_t \;\in\; [0,1].
$$
Operationally, updating the total mass is an $O(1)$ operation per time step:
$$
S_t \;=\; S_{t-1} \;+\; w_t \;-\; w_{t-L},
$$
which implements the aging effect by subtracting the oldest mass $w_{t-L}$ as it slides out of the shingle.


For simplicity, we can analyze the dynamics by treating any partially missing tuple as if it were fully observed. This reduces the imputation mass to a binary value: $w_t=1$ if the tuple is fully missing, and $w_t=0$ otherwise.

In this case, the total mass $S_t$ is simply the number of imputed tuples in the shingle, which we denote $n^{\mathrm{imp}}_t$. The evolution of this count follows the capped update rule:
$$
n^{\mathrm{imp}}_t \;=\;
\begin{cases}
\min\!\bigl(n^{\mathrm{imp}}_{t-1}+1,\; L\bigr), & \text{if fully missing at }\, t,\\[4pt]
\max\!\bigl(n^{\mathrm{imp}}_{t-1}-1,\; 0\bigr), & \text{if at least one real value is observed at }\, t,
\end{cases}
$$
with an additional aging decrement applied when timestamps advance and imputed tuples slide out of the shingle. The cap $n^{\mathrm{imp}}_t \le L$ ensures $f_t = n^{\mathrm{imp}}_t/L \le 1$ at all times.


### Quality update and gating
The system maintains a scalar data-quality statistic, $\mathrm{DQ}_t$, by applying **exponential smoothing** to the instantaneous quality signal $q_t$. This approach avoids sharp fluctuations and produces a more stable signal by computing a weighted average of the current quality value and its historical smoothed value. The update rule is:
$$
\mathrm{DQ}_t = \lambda \cdot q_t + (1-\lambda) \cdot \mathrm{DQ}_{t-1}
$$
where $\lambda \in (0,1)$ is a smoothing factor. Here, the new data quality score $\mathrm{DQ}_t$ is a blend of the new information from $q_t$ and the historical context stored in $\mathrm{DQ}_{t-1}$. A small $\lambda$ (e.g., 0.1) prioritizes history, creating a stable, slowly-changing signal. A larger $\lambda$ makes the score more responsive to recent changes.

The system then permits model updates only when the imputation burden is small:
$$
\text{update allowed at time } t \iff f_t \;<\; \tau,
$$
for a user-selectable threshold $\tau$ (commonly $\tau \approx 0.5$). This gating mechanism is crucial for preventing model degradation. By restricting updates during periods of high imputation, we avoid reinforcement on fabricated inputs. This preserves the model's integrity by ensuring it learns primarily from authentic data patterns. 

### Proposition (monotone drop and recovery).

Data quality in both models can be summarized compactly:

- **Full‑missingness (binary).** Track the count $n^{\mathrm{imp}}_t \in \{0,\dots,L\}$ of fully imputed tuples in the shingle. Then $f_t = n^{\mathrm{imp}}_t/L$ and $q_t = 1 - f_t$, with the capped update
    $$
    n^{\mathrm{imp}}_t =
    \begin{cases}
    \min\!\bigl(n^{\mathrm{imp}}_{t-1}+1,\; L\bigr), & \text{if fully missing at } t,\\[4pt]
    \max\!\bigl(n^{\mathrm{imp}}_{t-1}-1,\; 0\bigr), & \text{otherwise.}
    \end{cases}
    $$
  Aging is handled by the sliding window (shingle).

- **Partial‑missingness (fractional).** Let the per‑tuple mass $w_t \in [0,1]$ be the weight of missing attributes. Maintain the window sum and fraction
    $$
    S_t \;=\; S_{t-1} + w_t - w_{t-L}, \qquad f_t \;=\; \frac{S_t}{L}, \qquad q_t \;=\; 1 - f_t.
    $$
  The binary model is the special case $w_t \in \{0,1\}$.

### Bounds

For all $t$, we have $0 \le f_t \le 1$ and $0 \le q_t \le 1$.

*Proof.* In the binary model, $0 \le n^{\mathrm{imp}}_t \le L$ by construction, hence $0\le f_t\le 1$ and $q_t=1-f_t\in[0,1]$. In the fractional model, the window sum $S_t$ is the sum of the last $L$ mass terms, each of which lies in $[0,1]$. Therefore, $0 \le S_t \le L$, which implies $f_t \in [0,1]$ and $q_t \in [0,1]$.

### Monotone drop
- *Binary model.* Suppose there exists $t_0$ and $K\ge 1$ such that inputs are fully missing at each $t_0,\dots,t_0+K-1$. Then
    $$
    n^{\mathrm{imp}}_{t_0+m} \;=\; \min\!\bigl(n^{\mathrm{imp}}_{t_0-1}+m+1,\; L\bigr)\quad \text{for } m=0,\dots,K-1,
    $$

  hence $n^{\mathrm{imp}}_t$ is nondecreasing—strictly increasing while below $L$, then constant once it reaches $L$ (and it reaches $L$ in at most $L$ steps if the fully-missing run persists). Consequently $f_t = n^{\mathrm{imp}}_t/L$ is nondecreasing—strictly increasing while below $1$ (until the window is fully imputed), then constant—and $q_t=1-f_t$ is nonincreasing, bounded below by $0$.
- *Fractional model.*

  The dynamics of the fractional model are governed by the one-step change in the imputation fraction:
  $$
  S_t \;=\; \sum_{i=0}^{L-1} w_{t-i}, 
  \qquad 
  f_t \;=\; \frac{S_t}{L}, 
  \qquad 
  q_t \;=\; 1 - f_t.
  $$
  The window updates in $O(1)$ time via
  $$
  S_t \;=\; S_{t-1} + w_t - w_{t-L}
  \quad\Longrightarrow\quad
  f_t - f_{t-1} \;=\; \frac{w_t - w_{t-L}}{L}.
  $$
  From this relationship, we can deduce the behavior:
  - **Bounds:** $$\min_{0\le i<L} w_{t-i} \;\le\; f_t \;\le\; \max_{0\le i<L} w_{t-i}.$$
  - **One-step monotonicity:**  At any step,
  $$
  f_t \text{ increases } \iff w_t \;>\; w_{t-L}, 
  $$
  $$
  f_t \text{ decreases } \iff w_t \;<\; w_{t-L},
  $$
  $$
  f_t \text{ unchanged } \iff w_t \;=\; w_{t-L}.
  $$
  Thus the direction of change in $f_t$ is determined solely by comparing the entering mass $w_t$ with the
  leaving mass $w_{t-L}$.
  - **Monotonicity over an interval.**  
  If for every step in an index set $\mathcal{T}$ we have $w_t \ge w_{t-L}$, then $\{f_t\}_{t\in\mathcal{T}}$ is
  nondecreasing; if $w_t \le w_{t-L}$ for all $t\in\mathcal{T}$, it is nonincreasing. In particular, if the sequence
  $(w_t)$ is (globally) nondecreasing in $t$, then for all $t \ge L$ we have $w_t \ge w_{t-L}$ and hence
  $f_t$ is nondecreasing for all $t \ge L$ (the symmetric statement holds for a nonincreasing run).


### Monotone recovery
- *Binary model.* Suppose that from some $t_1$ onward, each new tuple is *not fully missing*. Then the update gives
    $$
    n^{\mathrm{imp}}_{t} \;=\; \max\!\bigl(n^{\mathrm{imp}}_{t-1}-1,\; 0\bigr)\quad\text{for all } t\ge t_1,
    $$
    hence $n^{\mathrm{imp}}_t$ is nonincreasing and reaches $0$ in at most $L$ steps; therefore $f_t \downarrow 0$ and $q_t \uparrow 1$ monotonically.
- *Fractional model.*

  As mentioned above, the exact one-step change is
  $$
  f_t - f_{t-1} \;=\; \frac{w_t - w_{t-L}}{L}.
  $$
  Hence a sufficient and necessary single-step condition for recovery (downward move in $f_t$) is
  $$
  f_t \text{ decreases } \iff w_t \;<\; w_{t-L}.
  $$
  A simple sufficient condition for monotone recovery over an interval $\{t_1,\dots,t_2\}$ is
  $$
  w_t \;\le\; w_{t-L} \quad \text{for every } t \in \{t_1,\dots,t_2\}.
  $$
  Under this condition, $\{f_t\}$ is nonincreasing on that interval. Intuitively, each step replaces the leaving mass $w_{t-L}$ with an equal or smaller entering mass $w_t$, so the sliding average cannot go up.

### Impact on Smoothed Data Quality

The established monotonicity of the imputation fraction $f_t$ directly impacts the smoothed data quality statistic, $\mathrm{DQ}_t$. 

Generally, any linear filter with nonnegative coefficients preserves the monotonicity of its input sequence (e.g., [EUSIPCO 2000](https://www.eurasip.org/Proceedings/Eusipco/Eusipco2000/SESSIONS/FRIAM/OR1/CR1358.PDF#:~:text=lter%20is%20that%20its%20root,k%20for%20an%20increasing%20sequence)). An exponential moving average is one such filter—it has impulse‑response weights $\{\lambda(1-\lambda)^k : k=0,1,2,\dots\}$, all positive when $0 \lt \lambda \lt 1$. Since $\mathrm{DQ}_t$ is an exponential average of the instantaneous quality $q_t = 1-f_t$, it inherits these monotonic trends. 

Also, because $q_t$ is always in the range $[0, 1]$, the smoothed statistic $\mathrm{DQ}_t$ is also guaranteed to remain within $[0, 1]$. This follows directly from the standard exponential‑smoothing recurrence, where the new value is a convex combination—i.e., a weighted average with nonnegative weights that sum to 1, so it lies between its inputs—of the previous smoothed value $\mathrm{DQ}_{t-1}$ and the current observation $q_t$ (specifically $(1-\lambda)\mathrm{DQ}_{t-1}+\lambda q_t$ with $0 \lt \lambda \lt 1$), ensuring it never leaves the bounds defined by the input signal (see Wikipedia's article on ["Convex combination"](https://en.wikipedia.org/wiki/Convex_combination#:~:text=As%20a%20particular%20example%2C%20every,1)). During a sustained period of missing data, as $f_t$ trends up, $q_t$ trends down, and $\mathrm{DQ}_t$ follows suit, decreasing smoothly. Conversely, when real data returns and $f_t$ trends down, $q_t$ trends up, and $\mathrm{DQ}_t$ reliably recovers towards 1. This ensures the gating mechanism, which relies on these signals, is stable and responds to persistent changes in data quality rather than short-term noise.

## System architecture

Despite a large literature on time-series anomaly detection, much of it targets univariate, regularly sampled, offline settings; support for multivariate, streaming, irregular timestamps, heterogeneous series, and missing data—especially in combination—is thinner in mainstream tools and many academic baselines. Our system is designed for the challenging real-world regime of streaming, multivariate series with irregular timestamps and missing values.

With that context, we now turn to the architecture that makes these guarantees concrete at scale. Our system is a distributed pipeline that processes each incoming data point within minutes. At a high level, it consists of three main components:

-   **Coordinator Node:** This node orchestrates the data flow. It retrieves time-stamped records from the source, aggregates them into metric streams, and assigns each stream to a specific Model Node. By using the model ID as the partition key, it ensures that every time series has a **deterministic and stable owner**.

-   **Model Nodes:** Each model node hosts tens of thousands of independent model instances. Every instance is dedicated to a single time series and maintains its own state, allowing for embarrassingly parallel execution. This design allows the system to scale both horizontally (by adding more nodes) and vertically (by adding more CPU and memory per node).

-   **Inference Queues:** To protect the system from data bursts and processing delays, each Model Node has its own inference queue. The Coordinator pushes data into these queues, and the Model instances pull from them. This decouples data ingestion from scoring, provides backpressure, and, crucially, **preserves the chronological order of data for each time series**.

### Handling Missing Data with Exactly-Once Semantics

The core challenge with streaming imputation is knowing when a data point is truly missing versus just being delayed. Our system solves this with a two-phase, "ACK-then-impute" barrier:

1.  **Real-time Scoring:** For any given time interval *t*, the Coordinator paginates through the source to fetch and sends real records to the appropriate Model Nodes for scoring.

2.  **Synchronization and Imputation:** The Coordinator waits for an acknowledgment (ACK) from all Model Nodes, confirming they have processed the real data for interval *t*. This ACK barrier ensures that no imputation happens prematurely. Once synchronized, the Coordinator sends a control message to trigger the imputation phase for any series that were silent.

Upon receiving this message, each model instance responsible for a silent series checks against a lateness threshold (e.g., one detector interval). If no real data has arrived within this window, the instance **locks the `(series, t)` time slot** and generates an imputed value. This lock is the key to our **exactly-once guarantee**: if the real data point arrives late, the system sees the lock and discards the late record, preventing duplicates and preserving the integrity of the timeline.

The sequence diagram below illustrates this flow:


![arch](/assets/media/blog-images/2025-11-07-klarna-imputation/arch.png){:class="img-centered"}

## Conclusion

Klarna’s experience underscored a simple but easily overlooked truth: in real-world monitoring, **“no data” is sometimes the anomaly**. By treating silent intervals as a first-class signal rather than a gap to ignore, we were able to close a blind spot where critical outages could otherwise slip by undetected.

The enhancements introduced in OpenSearch 2.17—configurable imputation, the impute‑then‑detect pipeline, and explicit data‑quality gating—give customers fine‑grained control over how missingness is handled. In many cases, simply widening the detector interval is enough to reduce empty buckets. When that is not acceptable for real‑time use cases, carefully chosen imputation policies (such as treating missing `value_count` as zero) can surface anomalies exactly when traffic disappears, without polluting the model with fabricated data.

Combined with a distributed architecture that maintains deterministic model ownership, per‑node queues, and exactly‑once semantics across real and imputed values, these capabilities help OpenSearch users operate at Klarna’s scale with greater confidence. Whether you are monitoring payments, logs, IoT signals, or application metrics, the same principle applies: define how you want the system to behave when data goes quiet, and make that behavior explicit in your anomaly detector configuration. When you do, “no data” becomes a powerful part of your observability story—not a dangerous blind spot.