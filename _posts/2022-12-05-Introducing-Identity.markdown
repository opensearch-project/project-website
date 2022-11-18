# Introducing Identity for OpenSearch

OpenSearch handles critical data; how that data is permissioned and how a cluster is operated is a Big Deal™.  Consider the question "Who can delete all the indices in the cluster?", in the core of OpenSearch, the answer is whoever can make a request to the cluster.  

Within the OpenSearch Project, the Security plugin allows finer levels of access control providing a more satisfying answer.  Security uses the plugin architecture of OpenSearch that forces concepts around identity to be optional in core, plugins, and extensions components.  Optional security is not enough for critical data, we will do to do better.

Let’s permeate identity in every aspect of OpenSearch – enabling security by default - everywhere.

## Identity is more than a user
In this blog post we use the term  *Subject* that includes users and non-person entities.  Following NIST's defintion Subjects are '[a]n individual, process, or device that causes information to flow among objects or change to the system state.'

Among the OpenSearch-Project's scenario there is monitoring, data management, replication, machine learning, and notificatios.  The identities of thse systems and process need a common description as a Subject.

## What are OpenSearch’s identities?
In OpenSearch systems, interaction with a cluster should be clearly associated with an identity. Sources of interaction include:
- Users make REST API calls in interactive sessions
- Node-to-node communication in a cluster
- Background jobs interactions
- Plugins in-process interactions
- Extensions actions extra-process interactions

![image](https://user-images.githubusercontent.com/2754967/201424268-5687f162-4857-424b-96b8-ca8aff5f649a.png)

## Why introduce identity into the core of OpenSearch?
By knowing who is performing actions we can check if that user is Authorized [3].  Plugins and extensions can only do actions that have been permitted to their identity.  The existing security plugin does not have the ability to control what other plugins can do.
Protections of high-level tasks and low-level actions and resources be enforced OpenSearch-wide.  Plugins and extensions can access and depend on these systems to protect the features and functionality they bring to OpenSearch.

## How does this benefit plugins/extensions?
Actions have an existing protection model – resources of a plugin do not, they must be implemented by each plugin developer separately.  Being able to use shared systems for secure access and standard permissions schemes will make adding security features faster with fewer bugs.

## What is the future of the Security Plugin?
The Security Plugin has user identities and it also offers features such as encryption in transit, audit logging, and compliance features.  All these featuers are critical to the OpenSearch-Project and will continue to be available and supported.

## How to learn more?
Identity features are being built in a feature branch of OpenSearch, [feature/identity](https://github.com/opensearch-project/OpenSearch/tree/feature/identity). Roadmaps, documentation, findings, and functionality are in active development on that feature branch. Beginning in December there will be a monthly check-in during the OpenSearch community meeting.
Feel free to add comments, create pull requests, raise issues and add the tag ‘identity’ to make sure we see it.

- Identity RFC https://github.com/opensearch-project/OpenSearch/issues/4514
- Feature Branch https://github.com/opensearch-project/OpenSearch/tree/feature/identity 
- Pull Requests https://github.com/opensearch-project/OpenSearch/pulls?q=is%3Apr+base%3Afeature%2Fidentity