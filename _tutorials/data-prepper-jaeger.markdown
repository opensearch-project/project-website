---
layout: tutorial
comments: true
title: "Data Prepper + Jaeger Tutorial and Demo"
sitemap: false
---

In this tutorial, you'll use Data Prepper with Jaeger to demonstrate the ability for OpenSearch and OpenSearch Dashboards to capture and visualize trace data.

### 1. Get your demo environment ready

Launch OpenSearch Dashboards with Docker Compose [todo]
{: .gitpod-hidden }

🛑 Please wait while OpenSearch Dashboards is loading. This may take a few moments.
{: .gitpod-visible.gitpod-dashboards-ready-hidden }

✅ OpenSearch Dashboards is ready, you can proceed to the next step.
{: .gitpod-visible.gitpod-dashboards-ready-visible }


---

### 2. Prepare OpenSearch Dashboards and the Jaeger Hot R.O.D. Demo

This tutorial will use three browser windows. One for this tutorial content, another for OpenSearch Dashboards, and a third for the Jaeger Hot R.O.D. demo.

Point the second browser window at the following URL to launch OpenSearch Dashboards:


🛑 OpenSearch Dashboards is still loading, URLs will be visible once it is complete.
{: .gitpod-visible.gitpod-dashboards-ready-hidden }

<code class="gitpod-replace-port gitpod-visible gitpod-dashboards-ready-visible" data-port="5601">http://localhost:5601/</code>

`http://localhost:5601/`
{: .gitpod-hidden }


Now, point the third browser window at the following URL to launch the Jaeger Hot R.O.D. demo:

🛑 OpenSearch Dashboards is still loading, URLs will be visible once it is complete.
{: .gitpod-visible.gitpod-dashboards-ready-hidden }

<code class="gitpod-replace-port gitpod-visible gitpod-dashboards-ready-visible" data-port="8080">http://localhost:8080/</code>

`http://localhost:8080/`
{: .gitpod-hidden }

You should have three windows open like this:

![Window Layout](/assets/media/tutorials/data-prepper-jaeger/window-layout.png){: .img-fluid}

---
### 3. Login to OpenSearch Dashboards for the first time

![Login to OpenSearch Dashboards](/assets/media/tutorials/data-prepper-jaeger/login.jpg){: .img-fluid}

At the login screen, use the following credentials:

Username: `admin`

Password: `admin`

Click “Log In”

![OpenSearch Dashboards Welcome](/assets/media/tutorials/data-prepper-jaeger/welcome.jpg){: .img-fluid}


Next, you’ll be presented with the Welcome page. You should click “Explore on my own” since the demo is only using data from the Hot Rod demo.


![OpenSearch Dashboards Tenant](/assets/media/tutorials/data-prepper-jaeger/tenant.jpg){: .img-fluid}

Now you’ll see the tenant selection window. In this tutorial, tenants will not be used, so just select “Global” then click “Confirm”

![OpenSearch Dashboards Tenant](/assets/media/tutorials/data-prepper-jaeger/home.jpg){: .img-fluid}


On the home screen, click the menu button in the upper left to reveal the menu along the left side. Click “Trace Analytics” under the heading “OpenSearch Plugins.”

---
### 4. Generate sample traces with the Jaeger Hot R.O.D. demo application

Switch to the window that is running the Jaeger Hot R.O.D. demo. 

![Hot R.O.D.](/assets/media/tutorials/data-prepper-jaeger/hotrod.jpg){: .img-fluid}

Click several times on the customer buttons - even click rapidly. This application will simulate a microservice architecture and will generate trace data that is being read by Data Prepper and stored in OpenSearch.

---
### 5. View the trace data in OpenSearch Dashboards

Switch back to OpenSearch Dashboards.

![OpenSearch Dashboards Trace Analytics](/assets/media/tutorials/data-prepper-jaeger/trace.jpg){: .img-fluid}

You’ll see the panels have been populated with some data based on your clicks. On the top, you have a listing of latency by trace groups, then below you have the service map, trace error rate and trace over time charts. Feel free to explore these panels,


Now, view the traces of any trace group by clicking on the number of traces in the right most column of the “Latency by trace group” panel. 

![OpenSearch Dashboards Trace Analytics Page](/assets/media/tutorials/data-prepper-jaeger/trace-page.jpg){: .img-fluid}

This brings you to the traces page where you can click on individual trace IDs. Click on any trace ID from the left most column.

![OpenSearch Dashboards Trace Analytics Single Trace](/assets/media/tutorials/data-prepper-jaeger/single-trace.jpg){: .img-fluid}


This shows the detail for that individual trace. Make sure and look at both the “Time spent by service” bar chart and the “Span” chart to see how this trace moved through the architecture.

![OpenSearch Dashboards Trace Analytics Service](/assets/media/tutorials/data-prepper-jaeger/services.jpg){: .img-fluid}

Go back to the main Trace Analytics panel by selecting “Trace Analytics” in the upper left next to the menu button. Then select “Services” from the left hand menu. Here you can inspect individual services and their performance. Make sure to take a look at the service map and it’s options as well as the span table at the bottom of the page.

---
### What did you learn and what’s next?

In this tutorial, you logged into OpenSearch Dashboards, started an application that generated traces and started Data Prepper to read and store those traces and saw how OpenSearch Dashboards presents the trace data for your analysis. 

From here you can continue to explore the interface of OpenSearch Dashboards, read the documentation for trace analytics (`https://opensearch.org/docs/latest/monitoring-plugins/trace/index/`) or Data Prepper (`https://opensearch.org/docs/latest/monitoring-plugins/trace/data-prepper/`).


