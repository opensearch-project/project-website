---
# `eventdate` needs to be in YYYY-MM-DD format with a `T` at the end (REQUIRED)
eventdate: 2021-07-05T
# `tz` (timezone) must be represented in UTC (REQUIRED)
tz: UTC -7
# `title` is the primary heading which the event will be linked and displayed on the event page (REQUIRED)
title: This is my test event (x)!
# `online` will trigger the event to be listed as Online (e.g. for virtual participation)
online: true
# `signup.url` is the link to sign up for the event
# `signup.title` is the CTA for the link
signup:
    url: http://www.meetup.com/
    title: Join on Meetup
# the image to be displayed on the event page. It will be scaled to fit
image: https://via.placeholder.com/300
# the cost with currency
cost: $30 USD
---

Here is where you would write the description of your event. You can use _markdown_.

*Note:* The filename will become part of the event url. For example, if you your filename is _foo_ then the resulting event will be _/events/foo/_.

The description will be truncated on the event list pages while the hole thing will be shown on the event page.