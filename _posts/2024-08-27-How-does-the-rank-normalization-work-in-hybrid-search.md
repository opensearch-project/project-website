---
layout: post
title:  "An overview of rank normalization in hybrid search"
authors:
 - ljeanniot
date: 2024-09-19
categories:
 - technical-post
meta_keywords: rank normalization, hybrid search, OpenSearch score normalization, search relevance, user experience
meta_description: Learn about rank normalization in hybrid search and how to OpenSearch can help you standardize scores from diverse algorithms to deliver more accurate and fair search results.
excerpt: Rank normalization is a crucial process in hybrid search systems, ensuring that scores from different search algorithms are adjusted to a common scale. This allows for fair and accurate comparisons, preventing any single algorithm from disproportionately influencing the final rankings. By implementing techniques like L2 and min-max normalization, search engines like OpenSearch can deliver more precise and balanced search results, ultimately enhancing user satisfaction and search performance.
has_math: true
has_science_table: false
---

In today's digital era, search engines play a crucial role in delivering relevant information quickly and efficiently. One of the advanced methods employed by search engines to enhance search results is hybrid search, which combines multiple search algorithms to retrieve and rank information. While hybrid search leverages the strengths of different algorithms, it introduces a new challenge: how to fairly compare and combine scores from these diverse sources. This is where rank normalization comes into play.

Rank normalization is essential in hybrid search systems because it ensures that the scores from various sub-queries are adjusted to a common scale, allowing for accurate and meaningful comparison. Without normalization, the final rankings may be skewed, leading to suboptimal search results that could impact user satisfaction.

OpenSearch employs two primary techniques for rank normalization: L2 normalization and min-max normalization. These techniques help in standardizing the scores from different sub-queries, ensuring that the most relevant results are ranked appropriately.

In this blog post, we will break down the details of these normalization techniques, explore their implementation in OpenSearch, and provide practical examples to illustrate their application. Whether you're a developer looking to optimize your search engine or simply curious about the inner workings of hybrid search, this guide will provide you with a comprehensive understanding of rank normalization in OpenSearch.

## 1. Understanding rank normalization

Rank normalization refers to the process of adjusting the scores produced by different search algorithms to a common scale. In hybrid search systems, multiple sub-queries are executed, each potentially using different scoring mechanisms and ranges. Rank normalization ensures that these disparate scores are made comparable, allowing for an accurate and fair aggregation of results. The primary goal is to prevent any single scoring method from disproportionately influencing the final rankings, thus providing a balanced view of relevance.

**How rank normalization integrates with hybrid search**

Hybrid search combines the strengths of various search techniques, such as keyword-based search, vector search, and personalized recommendations. Each of these techniques may generate scores based on different criteria and scales. For example, a keyword-based search might score documents based on term frequency, while a vector search could score them based on semantic similarity. Without normalization, combining these scores directly could lead to misleading results, because one scoring method might overshadow the others. Rank normalization integrates into hybrid search by standardizing these scores, ensuring that each sub-query's contribution is appropriately weighted.

**Benefits of applying rank normalization in search systems**:

1. **Improved accuracy:** By ensuring that scores from different sub-queries are comparable, rank normalization helps in accurately identifying the most relevant results. This leads to a more precise ranking of search results, enhancing the user's ability to find what they are looking for.

2. **Fairness:** Rank normalization prevents any single scoring method from dominating the final search results. This ensures a fair representation of relevance from all sub-queries, leading to a more balanced and comprehensive search outcome.

3. **Enhanced User Experience:** A more accurate and fair ranking of search results directly translates to a better user experience. Users are more likely to find the information they need quickly, which increases satisfaction and engagement with the search system.

4. **Flexibility:** With rank normalization, developers can experiment with and integrate multiple search algorithms without worrying about the incompatibility of their scoring scales. This flexibility allows for continuous improvement and innovation in the search system.

5. **Scalability:** As search systems grow and incorporate more data sources and search methods, rank normalization ensures that the system remains robust and effective. It helps maintain the integrity of search results even as the complexity of the search environment increases.

In summary, rank normalization is a critical component in hybrid search systems, ensuring that scores from different algorithms are standardized and comparable. This not only improves the accuracy and fairness of search results but also enhances the overall user experience and provides flexibility for future growth and innovation.

## 2. L2 normalization technique

L2 normalization, also known as Euclidean normalization, is a method used to adjust scores by scaling them in relation to the Euclidean distance of the vector of all scores. This technique ensures that the magnitude of the scores is normalized, providing a consistent scale for comparing different scores. It is particularly useful in hybrid search systems, where scores from multiple sub-queries need to be harmonized.

### Mathematical formula used

The L2 normalization formula adjusts each score ($$ \text{score}_i $$) by dividing it by the square root of the sum of the squares of all scores:

$$
\text{n_score}_i = \frac {\text{score}_i} {\sqrt{\text{score}_1^2 + \text{score}_2^2 + \dots + \text{score}_n^2}}
$$

This formula ensures that each score is proportionate to its contribution to the total score magnitude.

### Algorithm steps

The algorithm consists of the following steps:

1. **Calculate the sum of squares of all scores:** Iterate through each sub-query's results and calculate the sum of the squares of all scores.

2. **Update each score using the L2 normalization formula:** For each score, divide it by the square root of the sum of squares calculated in the previous step.

### Code walkthrough

The following sections provide information about the functionality and flow of the `normalize`, `getL2Norm`, and `normalizeSingleScore` method.

### Explanation of the `normalize` method

The `normalize` method orchestrates the normalization process. It first calculates the L2 norms for each sub-query using the `getL2Norm` method. Then it iterates over each result and updates the score using the `normalizeSingleScore` method:

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

### Explanation of the `getL2Norm` method

The `getL2Norm` method calculates the L2 norms for each sub-query. It first identifies the number of sub-queries and then calculates the sum of squares for each sub-query's scores. Finally, it takes the square root of these sums to get the L2 norms:

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

### Explanation of the `normalizeSingleScore` method

The `normalizeSingleScore` method applies the L2 normalization formula to a single score. It ensures that if the L2 norm is zero, then the normalized score is set to a minimum score to avoid division by zero:

```java
private float normalizeSingleScore(final float score, final float l2Norm) {
    return l2Norm == 0 ? MIN_SCORE : score / l2Norm;
}
```

### Example of a hybrid search query and the raw scores

Consider a hybrid search system that combines keyword-based search and vector-based search. Let's say we have the following raw scores from these sub-queries:

- **Keyword-based search scores:** $$[3.0, 4.0, 2.0]$$
- **Vector-based search scores:** $$[1.5, 3.5, 2.5]$$

### Application of L2 normalization on these scores

1. **Calculate the sum of squares:**
   - Keyword-based: $$3.0^2 + 4.0^2 + 2.0^2 = 9 + 16 + 4 = 29$$
   - Vector-based: $$1.5^2 + 3.5^2 + 2.5^2 = 2.25 + 12.25 + 6.25 = 20.75$$

2. **Calculate the L2 norm:**
   - Keyword-based: $$\sqrt{29} \approx 5.39$$
   - Vector-based: $$\sqrt{20.75} \approx 4.55$$

3. **Normalize the scores:**
   - Keyword-based: $$[\frac {3.0}{5.39}, \frac {4.0}{5.39}, \frac {2.0}{5.39}] \approx [0.56, 0.74, 0.37]$$
   - Vector-based: $$[\frac {1.5}{4.55}, \frac {3.5}{4.55}, \frac {2.5}{4.55}] \approx [0.33, 0.77, 0.55]$$

### Visualization of the scores before and after normalization 

* Before normalization:
  * Keyword-based: $$[3.0, 4.0, 2.0]$$
  * Vector-based: $$[1.5, 3.5, 2.5]$$

* After L2 normalization:
  * Keyword-based: $$[0.56, 0.74, 0.37]$$
  * Vector-based: $$[0.33, 0.77, 0.55]$$

By applying L2 normalization, we ensure that the scores from different sub-queries are on a comparable scale, allowing for a fair combination and ranking of search results.

## 3. Min-max normalization technique

Min-max normalization is a method used to scale scores so that they fit within a specified range, typically between 0 and 1. This technique adjusts the scores based on the minimum and maximum values found in the dataset, ensuring that the lowest score maps to 0 and the highest score maps to 1. This method is particularly useful when scores from multiple sub-queries need to be combined or compared on a common scale.

### Mathematical formula used

The min-max normalization formula adjusts each score ($$ \text{score} $$) by subtracting the minimum score and then dividing by the range (maximum score minus minimum score):

$$
\text{n_score} = \frac {\text{score} - \text{min_score}} {\text{max_score} - \text{min_score}}
$$

This formula ensures that the scores are scaled proportionately within the $$0$$ to $$1$$ range.

### Algorithm steps

The algorithm consists of the following steps:

1. **Calculate the minimum and maximum scores for each sub-query:** Iterate through each sub-query's results to find the minimum and maximum scores.

2. **Update each score using the min-max normalization formula:** For each score, subtract the minimum score and divide by the difference between the maximum and minimum scores.

### Code walkthrough

The following sections provide information about the functionality and flow of the `normalize`, `getMinScores`, `getMaxScores`, and `normalizeSingleScore` method.

### Explanation of the `normalize` method

The `normalize` method coordinates the min-max normalization process. It first determines the number of sub-queries and then calculates the minimum and maximum scores for each sub-query using the `getMinScores` and `getMaxScores` methods, respectively. Finally, it normalizes each score using the `normalizeSingleScore` method:

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

### Explanation of the `getMinScores` and `getMaxScores` methods

**`getMinScores` method:**

The `getMinScores` method calculates the minimum score for each sub-query by iterating through the results and identifying the lowest score:

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

**`getMaxScores` method:**

The `getMaxScores` method calculates the maximum score for each sub-query by iterating through the results and identifying the highest score:

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

### Explanation of the `normalizeSingleScore` method

The `normalizeSingleScore` method applies the min-max normalization formula to a single score, as shown in the example. It ensures that if the minimum and maximum scores are the same, the normalized score is set to a predefined value to avoid division by zero. For documents with a minimal score, a predefined constant of MIN_SCORE is returned, which equals 0.001. This avoids matching documents with a score of 0.0, as a score of 0.0 has the special meaning of match_none.

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

### Example of a hybrid search query and the raw scores

Consider a hybrid search system that combines keyword-based search and vector-based search. Let's say we have the following raw scores from these sub-queries:

- **Keyword-based search scores:** $$[2.0, 5.0, 3.0]$$
- **Vector-based search scores:** $$[1.0, 4.0, 2.0]$$

### Application of min-max normalization to these scores

1. **Calculate the minimum and maximum scores:**
   - Keyword-based: Min = $$2.0$$, Max = $$5.0$$
   - Vector-based: Min = $$1.0$$, Max = $$4.0$$

2. **Normalize the scores:**
   - Keyword-based: $$[\frac {2.0-2.0}{5.0-2.0}, \frac{5.0-2.0}{5.0-2.0}, \frac{3.0-2.0}{5.0-2.0}] = [0.0, 1.0, 0.33]$$
   - Vector-based: $$[\frac {1.0-1.0}{4.0-1.0}, \frac {4.0-1.0}{4.0-1.0}, \frac {2.0-1.0}{4.0-1.0}] = [0.0, 1.0, 0.33]$$

### Visualization of the scores before and after normalization

* Before normalization:
  * Keyword-based: $$[2.0, 5.0, 3.0]$$
  * vector-based: $$[1.0, 4.0, 2.0]$$

* After Min-max normalization:
  * Keyword-based: $$[0.001, 1.0, 0.33]$$
  * Vector-based: $$[0.001, 1.0, 0.33]$$

By applying min-max normalization, we ensure that the scores from different sub-queries are on a comparable scale, allowing for a fair combination and ranking of search results.

## 4. Comparing L2 and min-max normalization

### Benefits of using L2 normalization

L2 normalization provides the following benefits:

- **Smooth adjustment:** L2 normalization provides a smooth adjustment of scores based on the overall distribution, ensuring that no single score disproportionately affects the result.
- **Magnitude preservation:** By taking into account the magnitude of all scores, L2 normalization effectively preserves the relative importance of each score in the context of the entire dataset.
- **Handling outliers:** L2 normalization can mitigate the effect of outliers, because extreme values have less impact on the final normalized scores as compared to min-max normalization.

### Benefits of Using min-max normalization

Min-max normalization provides the following benefits:

- **Simple interpretation:** Min-max normalization scales scores to a fixed range (typically 0 to 1), making it easy to interpret and compare scores directly.
- **Uniform scale:** This method ensures that all scores fall within the same scale, which can be useful in applications where a consistent range is required.
- **Extreme value emphasis:** Min-max normalization highlights the importance of the minimum and maximum values, which can be beneficial in scenarios where the relative ranking between the lowest and highest scores is crucial.

### Potential drawbacks and when to use each method

**L2 normalization drawbacks:**

- **Complex interpretation:** The resulting scores from L2 normalization can be less intuitive to interpret than min-max normalized scores.
- **Computational overhead:** Calculating the L2 norm requires additional computational effort, which might not be ideal for large datasets or real-time applications.

**Min-max normalization drawbacks:**

- **Sensitive to outliers:** Min-max normalization can be significantly affected by outliers, because extreme values can disproportionately influence the normalized scores.
- **Loss of relative magnitude:** This method does not preserve the relative magnitude of scores as effectively as L2 normalization, potentially leading to a loss of contextual information.

### When to use each method

- **L2 normalization:** This method is preferred when the goal is to maintain the relative importance of each score within the context of the entire dataset and when the presence of outliers needs to be minimized.
- **Min-max normalization:** This method is ideal for applications that require a simple, fixed range for scores and when the extreme values need to be emphasized.

### Use cases

**Scenarios in which L2 normalization is more effective:**
- **Document ranking in search engines:** When ranking documents based on multiple relevance factors, L2 normalization ensures that no single factor disproportionately influences the final ranking.
- **Recommender systems:** In scenarios where recommendations are based on multiple user preferences, L2 normalization helps balance the different preferences without allowing any single preference to dominate.
- **Machine learning (ML) feature scaling:** When preparing data for ML models, L2 normalization can be used to scale features while preserving their relative importance.

**Scenarios in which min-max normalization is more effective:**
- **Image processing:** In image processing tasks, min-max normalization is commonly used to scale pixel values to a standard range (for example, 0 to 1) for consistency and ease of interpretation.
- **Financial data analysis:** When analyzing financial data, such as stock prices or returns, min-max normalization can be used to compare different datasets on a common scale.
- **User ratings:** In systems where user ratings are combined from different sources, Min-Max normalization ensures that all ratings are scaled to a consistent range, making it easier to compare and aggregate them.

## 5. Implementation in OpenSearch

OpenSearch implements normalization techniques through search pipelines, processing search results to standardize scores from different sub-queries. This ensures accurate aggregation and ranking of results, supporting various normalization methods like L2 and min-max.

### Configuration and usage in an OpenSearch environment

1. **Define the search pipeline:** Create a search pipeline with a normalization processor and specify the normalization technique:
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
2. **Utilize the search pipeline:** Use the search pipeline in search requests to apply normalization and combination techniques to search results:
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

### Practical tips for developers to optimize search results using normalization techniques

1. **Choose the right technique:** Assess your data and query nature to select the most suitable normalization technique, such as L2 for varying magnitudes and min-max for fixed range scaling.

2. **Test and tune:** Continuously test normalized search results to ensure they meet relevance and ranking criteria. Adjust the pipeline configuration as necessary.

3. **Monitor performance:** Track the performance impact of normalization, especially in high-traffic environments. Optimize configurations to balance accuracy and performance.

4. **Handle edge cases:** Prepare for edge cases like identical scores by ensuring normalization logic handles these scenarios without skewing results. Some possible edge cases include:
- **Identical scores:** Implement logic to handle cases in which all scores are identical to avoid division by zero or uniform scores.
- **Zero scores:** Introduce a small epsilon value to avoid issues with zero scores in calculations.
- **Sparse data:** Address imbalanced data distributions to prevent skewed normalization results.
- **Outliers:** Apply techniques to minimize the impact of extreme values on the normalized scores.
- **Empty sub-queries:** Ensure empty sub-queries are handled gracefully without affecting the overall normalization process.

5. **Leverage documentation:** Utilize OpenSearch documentation and community resources for additional guidance on implementing and optimizing normalization techniques.

By following these steps, developers can effectively leverage normalization techniques in OpenSearch to deliver accurate and fair search results, enhancing the overall search experience for users. For more detailed information, refer to the [OpenSearch documentation on normalization processors](https://opensearch.org/docs/latest/search-plugins/search-pipelines/normalization-processor/).

## Conclusion

Rank normalization is crucial in hybrid search systems, ensuring that scores from different algorithms are comparable and therefore yield accurate and fair search results. By using techniques like L2 and min-max normalization, OpenSearch provides tools to standardize scores effectively. Experimenting with these methods can help you to identify the best fit for specific search needs, optimizing relevance and user satisfaction.

We encourage you to explore both normalization techniques and share your experiences. Your feedback and discussions on rank normalization strategies are invaluable in refining and advancing search technologies.

## References and further reading

For more information about hybrid search, normalization processors, and implementation details, check out the following resources:

- [Hybrid search](https://opensearch.org/docs/latest/search-plugins/hybrid-search/)
- [Normalization processor](https://opensearch.org/docs/latest/search-plugins/search-pipelines/normalization-processor/)
- [OpenSearch neural-search GitHub repository](https://github.com/opensearch-project/neural-search/tree/main/src/main/java/org/opensearch/neuralsearch/processor/normalization)

At these links, detailed documentation and code examples are provided to help you understand and implement rank normalization in your OpenSearch environment.