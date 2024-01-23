---
# The date of the event, without time, as a string to appear in the calendar view in the format of YYYY-MM-DD.
calendar_date: '2021-01-01'
# put your event date and time (24 hr) here (mind the time-zone and daylight saving time!):
eventdate: 2021-01-01 12:34:00 -0700
# If the event last multiple day, also add the end date:
# enddate: 2021-01-03 20:00:00 -0700

# the title - this is how it will show up in listing and headings on the site:
title: Your Event Title
online: true
# If the event is online, remove the next lines, otherwise uncomment and adjust:
# tz: Pacific/Tahiti
# location:
#     city: Papeete
#     country: French Polynesia

# This is for the sign up button
signup:
    # the link URL
    url: https://....
    # the button text
    title: Join on Meetup

# Define a category for the event. This is used for filtering behaviors and styling on the events pages.
# This is limited to the following values: "community", "development", "user-group", "events".
# Un-comment the line that defines the category for this event.
category: community
# category: development
# category: events

# Array of event host identifiers.
# For hosts who have _authors information defined the short_name value will map to the meta data in that collection item.
# For hosts without a corresponding entry in the _authors collection the github, or the linkedin URL can be used to provide
# a link to more information about the host.
# This value must be an array even if there is only one host. This rule simplifies template logic.
hosts:
  - name: Host name
    short_name: Value that maps to the short_name in the _authors collection, if defined.
    github: URL to the host's GitHub profile if short_name is not defined.
    linkedin: URL to the host's LinkedIn profile if short_name is not defined.
# below this tripple dash, describe your event. It should be 1-3 sentences
---

Join us for our our meeting...

John Doe and Jane Somebody will be speaking on OpenSearch...
