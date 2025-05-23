# [DRAFT] **OpenSearch 3.0 PPL Released: Enhanced Log Analytics with Lookup, Join, and Subsearch**

OpenSearch 3.0 introduces powerful new capabilities to Piped Processing Language (PPL) with the addition of `lookup`, `join`, and `subsearch` commands. These features enable users—especially those in observability and security domains—to enrich, correlate, and filter logs more efficiently across large datasets. For example, security engineers can now join authentication and application logs to investigate incidents or use lookup to enrich logs with geo-context in real time.
Backed by Apache Calcite, these enhancements also bring improved query planning and execution, laying the groundwork for more advanced analytics capabilities in future releases. This release marks a significant step forward in making PPL a more expressive and performant language for interactive data exploration.
To learn more, see [PPL Command Reference](https://docs.opensearch.org/docs/latest/search-plugins/sql/ppl/functions/).

## **New Features in OpenSearch 3.0 PPL: Lookup, Join, and Subsearch**

Security analysts are often faced with the daunting task of sifting through vast amounts of log data to identify and respond to potential threats. The introduction of OpenSearch 3.0 PPL's `lookup`, `join`, and `subsearch` commands has revolutionized this process, enabling analysts to perform complex queries with ease and efficiency.

### Understanding the Dataset

Before diving into the queries, it's essential to understand the structure of the datasets involved. Here are two sample datasets:

* Authentication Logs (**auth_logs**), **** This dataset records user login attempts, capturing details such as:

|timestamp	|user_id	|status	|ip_address	|
|---	|---	|---	|---	|
|2024-04-29T10:00:00Z	|jdoe	|success	|192.168.1.1	|
|---	|---	|---	|---	|
|2024-04-29T10:05:00Z	|asmith	|failed	|192.168.1.2	|
|2024-04-29T10:10:00Z	|jdoe	|success	|192.168.1.1	|

* Application Logs (**`app_logs`**)**,** This dataset captures user interactions with applications, including:

|timestamp	|user_id	|action	|session_id	|
|---	|---	|---	|---	|
|2024-04-29T10:00:05Z	|jdoe	|login	|abc123	|
|---	|---	|---	|---	|
|2024-04-29T10:05:10Z	|asmith	|login	|def456	|
|2024-04-29T10:10:15Z	|jdoe	|logout	|abc123	|

* **User Information (`user_info`),** This reference dataset provides additional context about users:

|user_id	|department	|role	|
|---	|---	|---	|
|jdoe	|HR	|Manager	|
|---	|---	|---	|
|asmith	|IT	|Analyst	|

### Querying the Data

The `lookup`, `join`, and `subsearch` commands are experimental features. To use them, enable Calcite in your OpenSearch instance by running the following command:

```
curl -H 'Content-Type: application/json' -X PUT localhost:9200/_plugins/_query/settings -d '{
  "transient" : {
    "plugins.calcite.enabled" : true
  }
}'
```

Now that we understand the datasets, let's explore how to use OpenSearch PPL to analyze this data.

#### **Enriching Authentication Logs with User Information**

To gain more context about the users in the authentication logs, we can use the `lookup` command to join the `auth_logs` with the `user_info` dataset. This query enhances the authentication logs by appending the `department` and `role` fields, providing a clearer picture of the users involved in the failed login attempts.
Query:

```
source=auth_logs | lookup user_info user_id | where status='failed'
```

Result:

|timestamp	|user_id	|status	|ip_address	|department	|
|---	|---	|---	|---	|---	|
|2024-04-29T10:05:00Z	|asmith	|failed	|192.168.1.2	|IT	|
|---	|---	|---	|---	|---	|

#### Correlating Authentication and Application Logs

To understand user behavior, we can join the `auth_logs` with the `app_logs` based on `user_id` and timestamp. This correlation helps in tracking user actions and understanding their interactions with applications.
Query:

```
source=auth_logs 
| join left=l right=r ON l.user_id = r.user_id AND TIME_TO_SEC(TIMEDIFF(r.timestamp, l.timestamp)) <= 60 app_logs 
| fields timestamp, user_id, action

```

Result

|timestamp	|user_id	|action	|status	|
|---	|---	|---	|---	|
|2024-04-29T10:00:00Z	|jdoe	|login	|success	|
|---	|---	|---	|---	|
|2024-04-29T10:05:00Z	|asmith	|login	|failed	|
|2024-04-29T10:10:00Z	|jdoe	|logout	|success	|

#### Investigating Suspicious Activities

To detect potential security incidents, we can identify users who have failed login attempts and then performed sensitive actions. This query highlights users who may have attempted unauthorized actions, enabling timely intervention.
**Query:**

```
source=auth_logs 
| where status='failed' AND exists [source=app_logs | where user_id=auth_logs.user_id AND action='login'
```

**Result:**

|timestamp	|user_id	|status	|
|---	|---	|---	|
|2024-04-29T10:05:00Z	|asmith	|failed	|
|---	|---	|---	|

### **When to Use Which Command?**

* **Lookup**: Best for enriching logs with external reference data.
* **Join**: Ideal for correlating and combining logs from distinct indices.
* **Subsearch**: Excellent for dynamic query conditions based on results from another query.

## **Under the Hood: Calcite Integration**

OpenSearch PPL 3.0 integrates Apache Calcite, a robust SQL parsing and optimization framework. We selected Calcite for its powerful optimization capabilities, extensibility, and strong community support. Calcite integrates with OpenSearch PPL by providing parsing and query optimization layers. It converts PPL queries into optimized execution plans, significantly enhancing query efficiency and scalability.

### Query lifecycle in Calcite

The current PPL grammar and existing query AST have widely used (both in OpenSearch PPL and PPL-on-Spark). The ANTLR4 grammar is used in polyglot validators in fronted and backend (Java validator, J/S validator, Python validator). To keep the ANTLR4 grammar and reuse existing AST, the architecture of integration looks

![Query Lifecycle](/assets/media/blog-images/2025-05-30-Enhanced-Log-Analytics-with-Lookup,-Join-and-Subsearch/query_lifecycle.png){:class="img-centered"}

The query processing consists of several transformation stages, converting the original query text through different intermediate representations before final execution. Here are the key stages:

1. Query Parsing

The SQL query text is first parsed by ANTLR4, which converts the raw query statement into a parse tree. This parse tree is then transformed into an Abstract Syntax Tree (AST), representing the hierarchical syntactic structure of the query in a more abstract form.

1. Plan Conversion

The AST is transformed into Calcite's RelNode tree through RelBuilder and a series of visitors.. RelNode is Calcite's internal representation of relational operations, forming a logical plan tree where each node represents a relational algebra operation (e.g., filter, project, join). 

1. Optimization and Transformation

The RelNode tree undergoes optimization through Calcite's optimizer, applying various transformation rules. The optimized RelNode tree is then converted to OpenSearchEnumerableRel nodes, which are OpenSearch-specific implementations of Calcite's relational operators that can be mapped to Linq4j expressions.

1. Code Generation and Execution

Linq4j serves as a bridge framework, providing templates and expressions to transform relational operators into executable Java code. This code processes data in a row-by-row manner in memory. For performance optimization, when possible, operators or sub-trees of the plan (such as filters and aggregations) are pushed down and converted into native OpenSearch QueryBuilder API calls, which are then executed directly by the OpenSearch engine.

### How Calcite optimizer works

When you execute a query, Apache Calcite serves as the query optimizer, transforming your SQL into an efficient execution plan. One of its key optimization techniques is **filter pushdown**, which involves moving filter conditions as close to the data retrieval operations as possible. This reduces the amount of data processed and transferred, leading to significant performance improvements.

#### Explain Query

To view the query plan and understand how Calcite has optimized the execution, you can use the `EXPLAIN` command:

```
explain source=auth_logs | lookup user_info user_id | where status='failed'
```

#### **Logical Plan**

The logical plan represents a high-level, abstract strategy for executing the query. It outlines the operations to be performed without specifying how they should be executed. In our example, the logical plan might look like this:

```
LogicalProject(ip_address=[$0], user_id=[$1], status=[$2], timestamp=[$3], department=[$4])
  LogicalFilter(condition=[=($2, 'failed')])
    LogicalProject(ip_address=[$0], user_id=[$1], status=[$2], timestamp=[$3], department=[$10], _id=[$12], _index=[$13], _score=[$14], _maxscore=[$15], _sort=[$16], _routing=[$17])
      LogicalJoin(condition=[=($1, $11)], joinType=[left])
        CalciteLogicalIndexScan(table=[[OpenSearch, auth_logs]])
        CalciteLogicalIndexScan(table=[[OpenSearch, user_info]])
```

In this plan, Calcite identifies the need to filter records where the `status` is 'failed' and to join the `auth_logs` with the `user_info` table on the `user_id` field.

#### Physical Plan

The physical plan describes how the operations in the logical plan will be executed, detailing the specific steps and strategies used. After optimization, the physical plan might appear as follows:

```
bash
Copy
EnumerableCalc(expr#0..5=[{inputs}], proj#0..4=[{exprs}])
  EnumerableMergeJoin(condition=[=($1, $5)], joinType=[left])
    EnumerableSort(sort0=[$1], dir0=[ASC])
      EnumerableCalc(expr#0..9=[{inputs}], proj#0..3=[{exprs}])
        CalciteEnumerableIndexScan(table=[[OpenSearch, auth_logs]], PushDownContext=[[FILTER->=($2, 'failed')], OpenSearchRequestBuilder(sourceBuilder={"from":0,"timeout":"1m","query":{"term":{"status.keyword":{"value":"failed","boost":1.0}}},"sort":[{"_doc":{"order":"asc"}}]}, requestedTotalSize=10000, pageSize=null, startFrom=0)])
    EnumerableSort(sort0=[$1], dir0=[ASC])
      EnumerableCalc(expr#0..7=[{inputs}], proj#0..1=[{exprs}])
        CalciteEnumerableIndexScan(table=[[OpenSearch, user_info]])
```

Here, Calcite has pushed the filter condition `status='failed'` down to the `CalciteEnumerableIndexScan` operator for the `auth_logs` table, and eventually translate to OpenSearch DSL. This means that the filtering occurs directly at the data retrieval stage, minimizing the amount of data loaded into memory and processed by subsequent operations.

## **What's Next?**

Looking forward, the OpenSearch community plans to:

* **Migrate SQL to the Calcite Framework**: Fully embracing Calcite will unify and streamline query processing.
* **Expand PPL Commands**: Introducing commands like ``eventsstats`` and ``streamstats`` to further enhance analytical capabilities.

We invite the community to explore these new features, provide feedback, and contribute to shaping future releases. Dive into OpenSearch PPL 3.0 and leverage powerful analytics like never before!
