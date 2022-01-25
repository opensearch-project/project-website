---
layout: post
title:  "Feature Deep Dive: OpenSearch SQL - Basic queries"
authors: 
  - penghuo
  - jadhanir
date: 2022-01-23
categories: 
  - feature

---

In this blog, we’ll explore some of the features and capabilities supported by OpenSearch SQL. We also briefly introduce how SQL engine works internally.

## What is OpenSearch SQL?

OpenSearch SQL is similar to the SELECT statement in ANSI SQL, but it is purely designed for analyzing data in OpenSearch. In this document, we refer to it as OSQL (short for OpenSearch Structured Query Language). In order to make it easier for traditional SQL customers to get started, we make the OSQL syntax conform to the subset of the ANSI SQL specification. In addition, we also disclosed the unique features of OpenSearch, for example, we support [full-text search](https://github.com/opensearch-project/sql/blob/main/docs/user/beyond/fulltext.rst).

## How to use OpenSearch SQL?

For OpenSearch user, you could use the familiar REST interface `_plugin/sql` with your query in query body. 
For DBMS user, you could use [JDBC](https://github.com/opensearch-project/sql/tree/main/sql-jdbc)/[ODBC](https://github.com/opensearch-project/sql/tree/main/sql-odbc) driver to connect OpenSearch domain. You could download JDBC/ODBC driver. - add download link
For Dashboards user, you could use [OpenSearch Dashboard Query Workbench](https://opensearch.org/docs/latest/search-plugins/sql/workbench/) to easily run on-demand SQL queries and download results
An additional OpenSearch SQL CLI tool is provided for interactive SQL execution.

## Some Examples

### Basic Queries

*“Find error logs where response code is 404 or 503”.* 
You could run ODQL in Query Workbench. The result is in tabular format. You could download result in JSON, JDBC, CSV and Text format. Find more examples in [here](https://github.com/opensearch-project/sql/blob/main/docs/user/interfaces/protocol.rst).
![basic queries](/assets/media/blog-images/2022-01-30-opensearch-sql-basic-queries/basic_queries.gif){: .img-fluid}
### Functions

*“Find error logs where response code is 404 or 503, How many distinct host”* 
You could run ODQL in Dashboards notebook also. There are 4 distinct hosts for about query,  result is in table format. More [aggregations](https://github.com/opensearch-project/sql/blob/main/docs/user/dql/aggregations.rst) and [functions](https://github.com/opensearch-project/sql/blob/main/docs/user/dql/functions.rst) are supported.
![functions](/assets/media/blog-images/2022-01-30-opensearch-sql-basic-queries/functions.gif){: .img-fluid}
### Explain

*“How does ODQL execute in OpenSearch”*. Let’s explain an example query. OpenSearch SQL explain endpoint returns the query execution plan. For example, the above query two operators.

* ProjectOperator, execute in coordinate node, read output from child operator and project originCountry and count fields.
* FilterOperator, execute in coordinator node, read output from child operator and filter docs which count > 500.
* OpenSearchIndexScan, it is a **DSL query** which will be executed in OpenSearch through search endpoint**.**

![explain](/assets/media/blog-images/2022-01-30-opensearch-sql-basic-queries/explain.gif){: .img-fluid}
## Inside SQL Engines

Internally, query will go through five major components in query engine. (1) **Language Processor** parse the query string by following the grammar and generate the AST (Abstract Syntax Tree). (2) **Core Engine** analyze, optimize the AST and build the Logical Plan. (3) **Storage Engine** is an pluggable component which provide the catalog schema and storage specified optimization and implementation. (4) **Execution Engine** schedule and execute the physical plan. (5) **Protocol** parse the request and control the response format. 
![architecture](/assets/media/blog-images/2022-01-30-opensearch-sql-basic-queries/architecture.png){: .img-fluid}
## How do I contribute?

If you’re interested in contributing please reach out on [GitHub issues](https://github.com/opensearch-project/sql/issues) or the [community forum](https://discuss.opendistrocommunity.dev/). The more formal contribution guidelines are documented in the [contributing guide](https://github.com/opensearch-project/sql/blob/main/CONTRIBUTING.md).
