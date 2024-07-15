---
# Partner name used on the partners collection page (/partners).
name: Hyperspace

# name_long is used on the extended partner details page.
name_long: Hyperspace

# The partner logo is used on the partners collection page (/partners).
# upload your logo to the following directory - must be square
logo: '/assets/media/partners/hyperspace_logo.png'

# URL to the partner's website.
link: 'https://www.hyper-space.io/'

# logo_large is used on the extended partner details page.
# It is normative to upload all extended partner page images to a subdirectory of /assets/media/partners/ with the name of the partner as the directory name.
# For example given a partner named "SampleCompany" the logo_large image would be uploaded to /assets/media/partners/samplecompany/logo_large.png
logo_large: '/assets/media/partners/hyperspace_logo.png'

# Large image displayed in the top right of the extended partner details page.
#product_image: '/assets/media/partners/hyperspace_logo.png'
# Partner company description used on the extended partner details page.
description: Hyperspace is an elastic compatible cloud-native search database that leverages custom computing power so you can run any type of search at any time and scale with uncompromised performance, consistency, and confidence.

# Comma delimited list of business types used on the extended partner details page in the side panel.
business_type: 'MSP'

# Comma delimited list of geographic regions used on the extended partner details page in the side panel.
region: 'Global'

# Comma delimited list of one or more of email addresses, phone numbers, and web URLs that can be used to contat the partner.
contact: amits@hyper-space.io.

# Comma delimited list of one or more feature areas of the OpenSearch platform that the partner specializes in.
opensearch_tech: search

# Comma delimited list of one or more industries that the partner specializes in serving.
industries: 'Education, financial services, healthcare, media and entertainment, non-profit, retail, software and technology'
# If the partner only has one office location then use the main_office_location key
# otherwise use the multiple_office_locations key.
# In the template rendering multiple_office_locations takes precedent,
# and if both are used only the multiple_office_locations data will be rendered
# in the template omitting the main_office_location data.
main_office_location:  |
  Toha building
  Tozert Haaretz 6
  Floor 14
  Tel Aviv, 6789205
  Israel

# Collection of Web resources that the partner wishes to promote on their extended partner details page. Resources like blog posts, tutorials, news announcements, etc.
# Each resource must have a url, title, thumbnail, and type.
# It is normative to upload images into a subdirectory within /assets/media/partners/ with the name of the partner as the directory name. 
# It is advised that the thumbnail images share the same, or very close to the same aspect ratio across all resources. 
Documentation:
  - url: 'https://docs.hyper-space.io/hyperspace-docs'
    title: 'Hyperspace Documentation'
    thumbnail:  '/assets/media/partners/hyperspace_logo.png'
    type: 'resource'

# Collection of social links that the partner wishes to promote on their extended partner details page. Supported types are 'twitter', 'linkedin', 'facebook', and 'github'.
social_links:
  - url: 'https://www.linkedin.com/company/hyperspace-db'
    icon: 'linkedin'
---
