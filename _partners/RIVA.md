---
# Partner name used on the partners collection page (/partners).
name: RIVASolutionsInc

# name_long is used on the extended partner details page.
name_long: 'RIVA Solutiuons Inc.'

# The partner logo is used on the partners collection page (/partners).
# upload your logo to the following directory - must be square
logo: '/assets/media/RIVA/logo.png'

# URL to the partner's website.
link: 'http://rivasolutionsinc.com'

# logo_large is used on the extended partner details page.
# It is normative to upload all extended partner page images to a subdirectory of /assets/media/partners/ with the name of the partner as the directory name.
# For example given a partner named "SampleCompany" the logo_large image would be uploaded to /assets/media/partners/samplecompany/logo_large.png
logo_large: '/assets/media/RIVA/logo_large.png'

# Large image displayed in the top right of the extended partner details page.
product_image: '/assets/media/partners/samplecompany/sample-product-image.png'
# Partner company description used on the extended partner details page.
description: Brief description of your business and what it does (50 words or less).

# Comma delimited list of business types used on the extended partner details page in the side panel.
business_type: Type of business (e.g., MSP, CSP, ISV, product/technology, services organization, other). If other, please define.

# Comma delimited list of geographic regions used on the extended partner details page in the side panel.
region: What regions do you serve (e.g.,North America, South America, Europe, Middle East, Africa, Asia Pacific, Australia)?

# Comma delimited list of one or more of email addresses, phone numbers, and web URLs that can be used to contat the partner.
contact: How can people contact you (email and phone).

# Comma delimited list of one or more feature areas of the OpenSearch platform that the partner specializes in.
opensearch_tech:  What OpenSearch technologies do you specialize in (e.g., search, analytics, observability, security, or other)?

# Comma delimited list of one or more industries that the partner specializes in serving.
industries:  What industries do you specialize in (e.g. business services, consumer services, education, energy and utilities, financial services, healthcare, media and entertainment, public sector, non-profit, retail, software and technology)? Add all that apply.

# If the partner only has one office location then use the main_office_location key
# otherwise use the multiple_office_locations key.
# In the template rendering multiple_office_locations takes precedent,
# and if both are used only the multiple_office_locations data will be rendered
# in the template omitting the main_office_location data.
main_office_location:  |
  1676 International Dr.
  Suite #520
  Mclean VA 22102
  United States of America
multiple_office_locations:
#  - name: 'New York City'
#    location: |
#      123 Main Street 
#      20th Floor
#      New York, NY 10001
#  - name: 'Portland, OR'
#    location: |
#      345 Main Street
#      Portland, OR 97232

# Collection of Web resources that the partner wishes to promote on their extended partner details page. Resources like blog posts, tutorials, news announcements, etc.
# Each resource must have a url, title, thumbnail, and type.
# It is normative to upload images into a subdirectory within /assets/media/partners/ with the name of the partner as the directory name. 
# It is advised that the thumbnail images share the same, or very close to the same aspect ratio across all resources. 
resources:
#  - url: 'https://example.com/blog'
#    title: 'Blog Title'
#    thumbnail: '/assets/media/partners/placeholder.png'
#    type: 'blog'
#  - url: 'https://example.com/resource'
#    title: 'Resource Title'
#    thumbnail: '/assets/media/partners/placeholder.png'
#    type: 'resource'

# Collection of social links that the partner wishes to promote on their extended partner details page. Supported types are 'twitter', 'linkedin', 'facebook', and 'github'.
social_links:
  - url: 'https://x.com/riva_solutions'
    icon: 'twitter'
  - url: 'https://www.linkedin.com/company/example](https://www.linkedin.com/company/riva-solutions-inc-/'
    icon: 'linkedin'
  - url: 'https://www.facebook.com/RIVASolutionsInc/'
    icon: 'facebook'
  - url: 'https://github.com/orgs/rivasolutionsinc-corp/'
    icon: 'github'

# Collection of products that the partner wishes to promote on their extended partner details page. Each product should have a url, name, and description.
# The product listing is rendered below the partner description on the extended partner details page and above the resources.
products:
#  - url: 'https://example-product.example'
#    name: 'Example Product Name'
#    description: 'Example Product Description'
#  - url: 'https://another-example-product.example'
#    name: 'Another Example Product Name'
#    description: 'Another example product description.'
---
