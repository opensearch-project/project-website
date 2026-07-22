---
layout: post
title:  "OpenSearch Security: A Testament to Our Commitment"
authors: 
  - davidlago
date: 2023-09-18 00:00:01 -0700
categories: 
    - technical-post
twittercard:
  description: "Read about the findings of a recent in-depth independent security audit of our software, shedding light on our ongoing efforts to ensure OpenSearch remains a trusted product for our community."
meta_keywords: security, security audit, independent security audit
meta_description: Read about the results of a recent security audit on the OpenSearch platform.

---

In OpenSearch, there's an understanding that security isn't just a feature, but a foundational part of our software. Today, we're excited to discuss the findings of a recent in-depth independent security audit of our software, shedding light on our ongoing efforts to ensure OpenSearch remains a trusted product for our community.

### **Audit Overview**

Between June 27 and August 10, 2023, an independent team of seasoned security experts rigorously examined OpenSearch's source code, finding only two low severity issues. The key insights from [this audit](https://ostif.org/opensearch-audit/) reiterate our team's commitment and diligence. The security researcher team was notably impressed with the state of OpenSearch’s source code, especially given the complexity of the project:


>As we conclude the code audit for OpenSearch, it is important to highlight the good condition that the code is in compared to projects of similar complexity. Following the examination of the code by multiple testers, it is remarkable that very few areas of concern were identified. — X41 D-Sec


That said, the audit identified improvement areas that were compelling enough for us to file issues on our GitHub repositories to ensure each was properly addressed. Issues in the OpenSearch GitHub ecosystem are always public; this allows the community to track mitigation and progress in real-time. 

### **Commitment Beyond Reports**

A lot of our work in security, like an iceberg, remains below the surface. While they might not always make headlines, countless hours go into ensuring that every line of code adheres to high security standards. We may not always shout about these continuous efforts ([security reviews, penetration testing](https://github.com/opensearch-project/.github/blob/main/RELEASING.md#security-reviews), continuous update of dependencies, automatic security scanning, security advisories and [coordinated vulnerability disclosures](https://github.com/opensearch-project/.github/blob/main/SECURITY.md), but they are a testament to how deeply we care about the security of our product.

Although this audit showcases the good security posture of OpenSearch, we recognize that security is a continuous endeavor. The report summary itself suggests ongoing vigilance, regular application of coding best practices, and the need for recurrent security reviews. OpenSearch will continue to invest heavily in its security. We're not just addressing concerns raised in audits, but preemptively working to fortify our software against future challenges. For all our users, contributors, and the broader open-source community, your safety and trust are paramount to us. As we move forward, know that behind every feature and every line of code, our commitment to security remains steadfast.

Thank you for being with us on this journey. Together, we're working hand-in-hand to make OpenSearch better and safer for everyone.
