---
layout: post
title:  "An Overview of Rank Normalization in Hybrid Search"
authors:
 - ljeanniot
date: 2024-08-30
categories:
 - technical-post
meta_keywords: semantic search engine, neural search engine, keyword and natural language search, hybrid search.
meta_description: Learn the role of rank normalization in hybrid search systems. Learn how L2 and Min-Max normalization techniques are used in OpenSearch to standardize scores from multiple search algorithms, ensuring accurate and fair ranking of search results. Ideal for developers and tech enthusiasts looking to optimize search engines.
excerpt: Rank normalization is a crucial process in hybrid search systems, ensuring that scores from different search algorithms are adjusted to a common scale. This allows for fair and accurate comparisons, preventing any single algorithm from disproportionately influencing the final rankings. By implementing techniques like L2 and Min-Max normalization, search engines like OpenSearch can deliver more precise and balanced search results, ultimately enhancing user satisfaction and search performance.
has_math: true
has_science_table: false
---

**Introduction:**

In today's digital era, search engines play a crucial role in delivering relevant information quickly and efficiently. One of the advanced methods employed by search engines to enhance search results is hybrid search, which combines multiple search algorithms to retrieve and rank information. While hybrid search leverages the strengths of different algorithms, it introduces a new challenge: how to fairly compare and combine scores from these diverse sources. This is where rank normalization comes into play.

Rank normalization is essential in hybrid search systems as it ensures that the scores from various sub-queries are adjusted to a common scale, allowing for accurate and meaningful comparison. Without normalization, the final rankings might be skewed, leading to suboptimal search results that could impact user satisfaction.

OpenSearch employs two primary techniques for rank normalization: L2 normalization and Min-Max normalization. These techniques help in standardizing the scores from different sub-queries, ensuring that the most relevant results are ranked appropriately.

In this blog post, we will break down the details of these normalization techniques, explore their implementation in OpenSearch, and provide practical examples to illustrate their application. Whether you're a developer looking to optimize your search engine or simply curious about the inner workings of hybrid search, this guide will provide you with a comprehensive understanding of rank normalization in OpenSearch.

### 1. Understanding Rank Normalization

**Definition and Purpose of Rank Normalization:**

Rank normalization refers to the process of adjusting the scores produced by different search algorithms to a common scale. In hybrid search systems, multiple sub-queries are executed, each potentially using different scoring mechanisms and ranges. Rank normalization ensures that these disparate scores are made comparable, allowing for an accurate and fair aggregation of results. The primary goal is to prevent any single scoring method from disproportionately influencing the final rankings, thus providing a balanced view of relevance.

**How it Integrates with Hybrid Search:**

Hybrid search combines the strengths of various search techniques, such as keyword-based search, vector search, and personalized recommendations. Each of these techniques may generate scores based on different criteria and scales. For example, a keyword-based search might score documents based on term frequency, while a vector search could score them based on semantic similarity. Without normalization, combining these scores directly could lead to misleading results, as one scoring method might overshadow the others. Rank normalization integrates into hybrid search by standardizing these scores, ensuring that each sub-query's contribution is appropriately weighted.

**Benefits of Applying Rank Normalization in Search Systems:**

1. **Improved Accuracy:**
   - By ensuring that scores from different sub-queries are comparable, rank normalization helps in accurately identifying the most relevant results. This leads to a more precise ranking of search results, enhancing the user's ability to find what they are looking for.

2. **Fairness:**
   - Rank normalization prevents any single scoring method from dominating the final search results. This ensures a fair representation of relevance from all sub-queries, leading to a more balanced and comprehensive search outcome.

3. **Enhanced User Experience:**
   - A more accurate and fair ranking of search results directly translates to a better user experience. Users are more likely to find the information they need quickly, which increases satisfaction and engagement with the search system.

4. **Flexibility:**
   - With rank normalization, developers can experiment with and integrate multiple search algorithms without worrying about the incompatibility of their scoring scales. This flexibility allows for continuous improvement and innovation in the search system.

5. **Scalability:**
   - As search systems grow and incorporate more data sources and search methods, rank normalization ensures that the system remains robust and effective. It helps maintain the integrity of search results even as the complexity of the search environment increases.

In summary, rank normalization is a critical component in hybrid search systems, ensuring that scores from different algorithms are standardized and comparable. This not only improves the accuracy and fairness of search results but also enhances the overall user experience and provides flexibility for future growth and innovation.

### 2. L2 Normalization Technique

**Explanation:**

**Introduction to the L2 Normalization Technique:**

L2 normalization, also known as Euclidean normalization, is a method used to adjust scores by scaling them in relation to the Euclidean distance of the vector of all scores. This technique ensures that the magnitude of the scores is normalized, providing a consistent scale for comparing different scores. It is particularly useful in hybrid search systems where scores from multiple sub-queries need to be harmonized.

**Mathematical Formula Used:**

The L2 normalization formula adjusts each score (\( \text{score}_i \)) by dividing it by the square root of the sum of the squares of all scores:

```scss
n_score_i = score_i / sqrt(score_1^2 + score_2^2 + ... + score_n^2)
```

This formula ensures that each score is proportionate to its contribution to the total score magnitude.

**Algorithm Steps:**

1. **Calculate the Sum of Squares of All Scores:**
   - Iterate through each sub-query's results and calculate the sum of the squares of all scores.

2. **Update Each Score Using the L2 Normalization Formula:**
   - For each score, divide it by the square root of the sum of squares calculated in the previous step.

**Code Walkthrough:**

**Explanation of the `normalize` Method:**

The `normalize` method orchestrates the normalization process. It first calculates the L2 norms for each sub-query using the `getL2Norm` method. Then, it iterates over each result and updates the score using the `normalizeSingleScore` method.

```java
@Override
public void normalize(final List<CompoundTopDocs> queryTopDocs) {
    // get l2 norms for each sub-query
    List<Float> normsPerSubquery = getL2Norm(queryTopDocs);

    // do normalization using actual score and l2 norm
    for (CompoundTopDocs compoundQueryTopDocs : queryTopDocs) {
        if (Objects.isNull(compoundQueryTopDocs)) {
            continue;
        }
        List<TopDocs> topDocsPerSubQuery = compoundQueryTopDocs.getTopDocs();
        for (int j = 0; j < topDocsPerSubQuery.size(); j++) {
            TopDocs subQueryTopDoc = topDocsPerSubQuery.get(j);
            for (ScoreDoc scoreDoc : subQueryTopDoc.scoreDocs) {
                scoreDoc.score = normalizeSingleScore(scoreDoc.score, normsPerSubquery.get(j));
            }
        }
    }
}
```

**Step-by-Step Breakdown of the `getL2Norm` Method:**

The `getL2Norm` method calculates the L2 norms for each sub-query. It first identifies the number of sub-queries, then calculates the sum of squares for each sub-query's scores. Finally, it takes the square root of these sums to get the L2 norms.

```java
private List<Float> getL2Norm(final List<CompoundTopDocs> queryTopDocs) {
    int numOfSubqueries = queryTopDocs.stream()
        .filter(Objects::nonNull)
        .filter(topDocs -> topDocs.getTopDocs().size() > 0)
        .findAny()
        .get()
        .getTopDocs()
        .size();
    float[] l2Norms = new float[numOfSubqueries];
    for (CompoundTopDocs compoundQueryTopDocs : queryTopDocs) {
        if (Objects.isNull(compoundQueryTopDocs)) {
            continue;
        }
        List<TopDocs> topDocsPerSubQuery = compoundQueryTopDocs.getTopDocs();
        int bound = topDocsPerSubQuery.size();
        for (int index = 0; index < bound; index++) {
            for (ScoreDoc scoreDocs : topDocsPerSubQuery.get(index).scoreDocs) {
                l2Norms[index] += scoreDocs.score * scoreDocs.score;
            }
        }
    }
    for (int index = 0; index < l2Norms.length; index++) {
        l2Norms[index] = (float) Math.sqrt(l2Norms[index]);
    }
    List<Float> l2NormList = new ArrayList<>();
    for (int index = 0; index < numOfSubqueries; index++) {
        l2NormList.add(l2Norms[index]);
    }
    return l2NormList;
}
```

**Detailed Look at `normalizeSingleScore` Method:**

The `normalizeSingleScore` method applies the L2 normalization formula to a single score. It ensures that if the L2 norm is zero, the normalized score is set to a minimum score to avoid division by zero. 

```java
private float normalizeSingleScore(final float score, final float l2Norm) {
    return l2Norm == 0 ? MIN_SCORE : score / l2Norm;
}
```

**Practical Example:**

**Example of a Hybrid Search Query and the Raw Scores:**

Consider a hybrid search system that combines keyword-based search and vector-based search. Let's say we have the following raw scores from these sub-queries:

- **Keyword-Based Search Scores:** [3.0, 4.0, 2.0]
- **Vector-Based Search Scores:** [1.5, 3.5, 2.5]

**Application of L2 Normalization on These Scores:**

1. **Calculate the Sum of Squares:**
   - Keyword-Based: \(3.0^2 + 4.0^2 + 2.0^2 = 9 + 16 + 4 = 29\)
   - Vector-Based: \(1.5^2 + 3.5^2 + 2.5^2 = 2.25 + 12.25 + 6.25 = 20.75\)

2. **Calculate the L2 Norm:**
   - Keyword-Based: \(\sqrt{29} \approx 5.39\)
   - Vector-Based: \(\sqrt{20.75} \approx 4.55\)

3. **Normalize the Scores:**
   - Keyword-Based: \([3.0/5.39, 4.0/5.39, 2.0/5.39] \approx [0.56, 0.74, 0.37]\)
   - Vector-Based: \([1.5/4.55, 3.5/4.55, 2.5/4.55] \approx [0.33, 0.77, 0.55]\)

**Visualization of the Scores Before and After Normalization:**

**Before Normalization:**
- Keyword-Based: [3.0, 4.0, 2.0]
- Vector-Based: [1.5, 3.5, 2.5]

**After L2 Normalization:**
- Keyword-Based: [0.56, 0.74, 0.37]
- Vector-Based: [0.33, 0.77, 0.55]

By applying L2 normalization, we ensure that the scores from different sub-queries are on a comparable scale, allowing for a fair combination and ranking of search results.

### 3. Min-Max Normalization Technique

**Explanation:**

**Introduction to the Min-Max Normalization Technique:**

Min-Max normalization is a method used to scale scores so that they fit within a specified range, typically between 0 and 1. This technique adjusts the scores based on the minimum and maximum values found in the dataset, ensuring that the lowest score maps to 0 and the highest score maps to 1. This method is particularly useful when scores from multiple sub-queries need to be combined or compared on a common scale.

**Mathematical Formula Used:**

The Min-Max normalization formula adjusts each score (\( \text{score} \)) by subtracting the minimum score and then dividing by the range (maximum score minus minimum score):

```scss
n_score = (score - min_score) / (max_score - min_score)
```

This formula ensures that the scores are scaled proportionately within the 0 to 1 range.

**Algorithm Steps:**

1. **Calculate the Minimum and Maximum Scores for Each Sub-Query:**
   - Iterate through each sub-query's results to find the minimum and maximum scores.

2. **Update Each Score Using the Min-Max Normalization Formula:**
   - For each score, subtract the minimum score and divide by the difference between the maximum and minimum scores.

**Code Walkthrough:**

**Explanation of the `normalize` Method:**

The `normalize` method coordinates the Min-Max normalization process. It first determines the number of sub-queries and then calculates the minimum and maximum scores for each sub-query using the `getMinScores` and `getMaxScores` methods, respectively. Finally, it normalizes each score using the `normalizeSingleScore` method.

```java
@Override
public void normalize(final List<CompoundTopDocs> queryTopDocs) {
    int numOfSubqueries = queryTopDocs.stream()
        .filter(Objects::nonNull)
        .filter(topDocs -> topDocs.getTopDocs().size() > 0)
        .findAny()
        .get()
        .getTopDocs()
        .size();
    // get min scores for each sub query
    float[] minScoresPerSubquery = getMinScores(queryTopDocs, numOfSubqueries);

    // get max scores for each sub query
    float[] maxScoresPerSubquery = getMaxScores(queryTopDocs, numOfSubqueries);

    // do normalization using actual score and min and max scores for corresponding sub query
    for (CompoundTopDocs compoundQueryTopDocs : queryTopDocs) {
        if (Objects.isNull(compoundQueryTopDocs)) {
            continue;
        }
        List<TopDocs> topDocsPerSubQuery = compoundQueryTopDocs.getTopDocs();
        for (int j = 0; j < topDocsPerSubQuery.size(); j++) {
            TopDocs subQueryTopDoc = topDocsPerSubQuery.get(j);
            for (ScoreDoc scoreDoc : subQueryTopDoc.scoreDocs) {
                scoreDoc.score = normalizeSingleScore(scoreDoc.score, minScoresPerSubquery[j], maxScoresPerSubquery[j]);
            }
        }
    }
}
```

**Step-by-Step Breakdown of the `getMinScores` and `getMaxScores` Methods:**

**`getMinScores` Method:**

The `getMinScores` method calculates the minimum score for each sub-query by iterating through the results and identifying the lowest score.

```java
private float[] getMinScores(final List<CompoundTopDocs> queryTopDocs, final int numOfScores) {
    float[] minScores = new float[numOfScores];
    Arrays.fill(minScores, Float.MAX_VALUE);
    for (CompoundTopDocs compoundQueryTopDocs : queryTopDocs) {
        if (Objects.isNull(compoundQueryTopDocs)) {
            continue;
        }
        List<TopDocs> topDocsPerSubQuery = compoundQueryTopDocs.getTopDocs();
        for (int j = 0; j < topDocsPerSubQuery.size(); j++) {
            minScores[j] = Math.min(
                minScores[j],
                Arrays.stream(topDocsPerSubQuery.get(j).scoreDocs)
                    .map(scoreDoc -> scoreDoc.score)
                    .min(Float::compare)
                    .orElse(Float.MAX_VALUE)
            );
        }
    }
    return minScores;
}
```

**`getMaxScores` Method:**

The `getMaxScores` method calculates the maximum score for each sub-query by iterating through the results and identifying the highest score.

```java
private float[] getMaxScores(final List<CompoundTopDocs> queryTopDocs, final int numOfSubqueries) {
    float[] maxScores = new float[numOfSubqueries];
    Arrays.fill(maxScores, Float.MIN_VALUE);
    for (CompoundTopDocs compoundQueryTopDocs : queryTopDocs) {
        if (Objects.isNull(compoundQueryTopDocs)) {
            continue;
        }
        List<TopDocs> topDocsPerSubQuery = compoundQueryTopDocs.getTopDocs();
        for (int j = 0; j < topDocsPerSubQuery.size(); j++) {
            maxScores[j] = Math.max(
                maxScores[j],
                Arrays.stream(topDocsPerSubQuery.get(j).scoreDocs)
                    .map(scoreDoc -> scoreDoc.score)
                    .max(Float::compare)
                    .orElse(Float.MIN_VALUE)
            );
        }
    }
    return maxScores;
}
```

**Detailed Look at `normalizeSingleScore` Method:**

The `normalizeSingleScore` method applies the Min-Max normalization formula to a single score. It ensures that if the minimum and maximum scores are the same, the normalized score is set to a predefined value to avoid division by zero. For documents with a minimal score, we return a predefined constant of MIN_SCORE, which equals 0.001. This avoids matching documents with a score of 0.0, as a score of 0.0 has the special meaning of match_none.

```java
private float normalizeSingleScore(final float score, final float minScore, final float maxScore) {
    // edge case when there is only one score and min and max scores are same
    if (Floats.compare(maxScore, minScore) == 0 && Floats.compare(maxScore, score) == 0) {
        return SINGLE_RESULT_SCORE;
    }
    float normalizedScore = (score - minScore) / (maxScore - minScore);
    return normalizedScore == 0.0f ? MIN_SCORE : normalizedScore;
}
```

**Practical Example:**

**Example of a Hybrid Search Query and the Raw Scores:**

Consider a hybrid search system that combines keyword-based search and vector-based search. Let's say we have the following raw scores from these sub-queries:

- **Keyword-Based Search Scores:** [2.0, 5.0, 3.0]
- **Vector-Based Search Scores:** [1.0, 4.0, 2.0]

**Application of Min-Max Normalization on These Scores:**

1. **Calculate the Minimum and Maximum Scores:**
   - Keyword-Based: Min = 2.0, Max = 5.0
   - Vector-Based: Min = 1.0, Max = 4.0

2. **Normalize the Scores:**
   - Keyword-Based: \([2.0-2.0]/[5.0-2.0], [5.0-2.0]/[5.0-2.0], [3.0-2.0]/[5.0-2.0] = [0.0, 1.0, 0.33]\)
   - Vector-Based: \([1.0-1.0]/[4.0-1.0], [4.0-1.0]/[4.0-1.0], [2.0-1.0]/[4.0-1.0] = [0.0, 1.0, 0.33]\)

**Visualization of the Scores Before and After Normalization:**

**Before Normalization:**
- Keyword-Based: [2.0, 5.0, 3.0]
- Vector-Based: [1.0, 4.0, 2.0]

**After Min-Max Normalization:**
- Keyword-Based: [0.001, 1.0, 0.33]
- Vector-Based: [0.001, 1.0, 0.33]

By applying Min-Max normalization, we ensure that the scores from different sub-queries are on a comparable scale, allowing for a fair combination and ranking of search results.

### 4. Comparing L2 and Min-Max Normalization

**Advantages and Disadvantages:**

**Benefits of Using L2 Normalization:**
1. **Smooth Adjustment:** L2 normalization provides a smooth adjustment of scores based on the overall distribution, ensuring that no single score disproportionately affects the result.
2. **Magnitude Preservation:** By taking into account the magnitude of all scores, L2 normalization effectively preserves the relative importance of each score in the context of the entire dataset.
3. **Handling Outliers:** L2 normalization can mitigate the effect of outliers, as extreme values have less impact on the final normalized scores compared to Min-Max normalization.

**Benefits of Using Min-Max Normalization:**
1. **Simple Interpretation:** Min-Max normalization scales scores to a fixed range (typically 0 to 1), making it easy to interpret and compare scores directly.
2. **Uniform Scale:** This method ensures that all scores fall within the same scale, which can be useful in applications where a consistent range is required.
3. **Extreme Value Emphasis:** Min-Max normalization highlights the importance of the minimum and maximum values, which can be beneficial in scenarios where the relative ranking between the lowest and highest scores is crucial.

**Potential Drawbacks and When to Use Each Method:**

**L2 Normalization Drawbacks:**
1. **Complex Interpretation:** The resulting scores from L2 normalization can be less intuitive to interpret compared to Min-Max normalized scores.
2. **Computational Overhead:** Calculating the L2 norm requires additional computational effort, which might not be ideal for large datasets or real-time applications.

**Min-Max Normalization Drawbacks:**
1. **Sensitive to Outliers:** Min-Max normalization can be significantly affected by outliers, as extreme values can disproportionately influence the normalized scores.
2. **Loss of Relative Magnitude:** This method does not preserve the relative magnitude of scores as effectively as L2 normalization, potentially leading to a loss of contextual information.

**When to Use Each Method:**
- **L2 Normalization:** This method is preferred when the goal is to maintain the relative importance of each score within the context of the entire dataset and when the presence of outliers needs to be minimized.
- **Min-Max Normalization:** This method is ideal for applications that require a simple, fixed range for scores and where the extreme values need to be emphasized.

**Use Cases:**

**Scenarios Where L2 Normalization is More Effective:**
1. **Document Ranking in Search Engines:** When ranking documents based on multiple relevance factors, L2 normalization ensures that no single factor disproportionately influences the final ranking.
2. **Recommender Systems:** In scenarios where recommendations are based on multiple user preferences, L2 normalization helps balance the different preferences without allowing any single preference to dominate.
3. **Machine Learning Feature Scaling:** When preparing data for machine learning models, L2 normalization can be used to scale features while preserving their relative importance.

**Scenarios Where Min-Max Normalization is Preferred:**
1. **Image Processing:** In image processing tasks, Min-Max normalization is commonly used to scale pixel values to a standard range (e.g., 0 to 1) for consistency and ease of interpretation.
2. **Financial Data Analysis:** When analyzing financial data, such as stock prices or returns, Min-Max normalization can be used to compare different datasets on a common scale.
3. **User Ratings:** In systems where user ratings are combined from different sources, Min-Max normalization ensures that all ratings are scaled to a consistent range, making it easier to compare and aggregate them.

### 5. Implementation in OpenSearch

**Overview of How These Normalization Techniques are Implemented in OpenSearch:**

OpenSearch implements normalization techniques via search pipelines, processing search results to standardize scores from different sub-queries. This ensures accurate aggregation and ranking of results, supporting various normalization methods like L2 and Min-Max.

**Configuration and Usage in an OpenSearch Environment:**

1. **Define the Search Pipeline:**
   - Create a search pipeline with a normalization processor and specify the normalization technique.

```json
PUT /_search/pipeline/nlp-search-pipeline
{
  "description": "Post processor for hybrid search",
  "phase_results_processors": [
    {
      "normalization-processor": {
        "normalization": {
          "technique": "min_max"
        },
        "combination": {
          "technique": "arithmetic_mean",
          "parameters": {
            "weights": [
              0.3,
              0.7
            ]
          }
        }
      }
    }
  ]
}
```

2. **Utilize the Search Pipeline:**
   - Use the search pipeline in search requests to apply normalization and combination techniques to search results.

```json
GET /my-nlp-index/_search?search_pipeline=nlp-search-pipeline
{
  "_source": {
    "exclude": [
      "passage_embedding"
    ]
  },
  "query": {
    "hybrid": {
      "queries": [
        {
          "match": {
            "text": {
              "query": "horse"
            }
          }
        },
        {
          "neural": {
            "passage_embedding": {
              "query_text": "wild west",
              "model_id": "aVeif4oB5Vm0Tdw8zYO2",
              "k": 5
            }
          }
        }
      ]
    }
  }
}
```

**Practical Tips for Developers to Optimize Search Results Using Normalization Techniques:**

1. **Choose the Right Technique:**
   - Assess your data and query nature to select the most suitable normalization technique, such as L2 for varying magnitudes and Min-Max for fixed range scaling.

2. **Test and Tune:**
   - Continuously test normalized search results to ensure they meet relevance and ranking criteria. Adjust the pipeline configuration as necessary.

3. **Monitor Performance:**
   - Track the performance impact of normalization, especially in high-traffic environments. Optimize configurations to balance accuracy and performance.

4. **Handle Edge Cases:**
   - Prepare for edge cases like identical scores by ensuring normalization logic handles these scenarios without skewing results. Some possible edge cases include:
     - **Identical Scores:** Implement logic to handle cases where all scores are identical to avoid division by zero or uniform scores.
     - **Zero Scores:** Introduce a small epsilon value to avoid issues with zero scores in calculations.
     - **Sparse Data:** Address imbalanced data distributions to prevent skewed normalization results.
     - **Outliers:** Apply techniques to minimize the impact of extreme values on the normalized scores.
     - **Empty Sub-Queries:** Ensure empty sub-queries are handled gracefully without affecting the overall normalization process.

5. **Leverage Documentation:**
   - Utilize OpenSearch documentation and community resources for additional guidance on implementing and optimizing normalization techniques.

By following these steps, developers can effectively leverage normalization techniques in OpenSearch to deliver accurate and fair search results, enhancing the overall search experience for users. For more detailed information, refer to the [OpenSearch documentation on normalization processors](https://opensearch.org/docs/latest/search-plugins/search-pipelines/normalization-processor/).

### Conclusion

Rank normalization is crucial in hybrid search systems, ensuring scores from different algorithms are comparable for accurate and fair search results. By using techniques like L2 and Min-Max normalization, OpenSearch provides tools to standardize scores effectively. Experimenting with these methods helps identify the best fit for specific search needs, optimizing relevance and user satisfaction.

We encourage you to explore both normalization techniques and share your experiences. Your feedback and discussions on rank normalization strategies are invaluable in refining and advancing search technologies.

### References and Further Reading

For more information on hybrid search, normalization processors, and implementation details, check out the following resources:

1. [Hybrid Search in OpenSearch](https://opensearch.org/docs/latest/search-plugins/hybrid-search/)
2. [Normalization Processor in OpenSearch](https://opensearch.org/docs/latest/search-plugins/search-pipelines/normalization-processor/)
3. [OpenSearch Neural Search GitHub Repository](https://github.com/opensearch-project/neural-search/tree/main/src/main/java/org/opensearch/neuralsearch/processor/normalization)

These links provide detailed documentation and code examples to help you understand and implement rank normalization in your OpenSearch environment.