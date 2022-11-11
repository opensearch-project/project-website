# Introducing Identity for OpenSearch

OpenSearch handles critical data; how that data is permissioned and how a cluster is operated is a Big Deal™.  Consider the question "Who can delete all the indices in the cluster?", in the core of OpenSearch, the answer is whoever can make a request to the cluster.  

Within the OpenSearch Project, there is a plugin Security that allows finer levels of access control providing a more satisfying answer.  Security uses the plugin architecture of OpenSearch that forces concepts around identity to be optional in core, plugins, and extensions components.

Let’s permeate identity in every aspect of OpenSearch – enabling security by default - everywhere.

## What are OpenSearch’s identities?
In the literature, an identity is an Authenticated [1] Subject [2].  In the systems of OpenSearch, an identity embodies sources of interaction.
- Users make REST API calls in interactive sessions
- Node-to-node communication in a cluster
- Background jobs interactions
- Plugins in-process interactions
- Extensions actions extra-process interactions
  
## Why have identity in all OpenSearch systems?
By knowing who is performing actions we can check if that user is Authorized [3].  Plugins and extensions can only do actions that have been permitted to their identity.  The existing security plugin does not have the ability to control what other plugins can do.
Protections of high-level tasks and low-level actions and resources be enforced OpenSearch-wide.  Plugins and extensions can access and depend on these systems to protect the features and functionality they bring to OpenSearch.

## How does this benefit plugins/extensions?
Actions have an existing protection model – resources of a plugin do not, they must be implemented by each plugin developer separately.  Being able to use shared systems for secure access and standard permissions schemes will make adding security features faster with fewer bugs.

## How to learn more?
Identity features are being built in a feature branch of OpenSearch, features/identity [4].  Roadmaps, documentation, findings, and functionality are in active development of that feature branch.  Beginning in December there will be a monthly check-in during the OpenSearch community meeting.
Feel free to add comments, create pull requests, raise issues and add the tag ‘identity’ to make sure we see it.

Find me @peternied on github in the OpenSearch-Project.

- [1] https://csrc.nist.gov/glossary/term/authentication
- [2] https://csrc.nist.gov/glossary/term/subject
- [3] https://csrc.nist.gov/glossary/term/authorization
- [4] TDB – RFC Issue / High level issue https://github.com/opensearch-project/OpenSearch/issues/4514   / Branch https://github.com/opensearch-project/OpenSearch/tree/feature/identity 
