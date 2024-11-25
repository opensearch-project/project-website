---
# SolutionsProviders name used on the SolutionsProviders collection page (/SolutionsProviders).
name: SampleCompany

# name_long is used on the extended SolutionsProviders details page.
name_long: 'Sample Company'

# The SolutionsProviders logo is used on the SolutionsProviders collection page (/SolutionsProviders).
# upload your logo to the following directory - must be square
logo: '/assets/media/partners/placeholder.png'

# URL to the SolutionsProviders's website.
link: 'http://example.com'

# logo_large is used on the extended SolutionsProviders details page.
# It is normative to upload all extended SolutionsProviders page images to a subdirectory of /assets/media/partners/ with the name of the SolutionsProvider as the directory name.
# For example given a SolutionsProviders named "SampleCompany" the logo_large image would be uploaded to /assets/media/partners/samplecompany/logo_large.png
logo_large: '/assets/media/partners/placeholder.png'

# Large image displayed in the top right of the extended SolutionsProviders details page.
product_image: '/assets/media/partners/samplecompany/sample-product-image.png'
# SolutionsProviders company description used on the extended SolutionsProviders details page.
description: Brief description of your business and what it does (50 words or less).
# Comma delimited list of one or more of email addresses, phone numbers, and web URLs that can be used to contact the SolutionsProvider.
contact: How can people contact you (email and phone).


# PROVIDER TYPE
#   - Comma delimited list of business types used on the extended SolutionsProvider details page in the side panel.
business_type: Consultancy, Independent Software Vendor (ISV), Managed Service Provider (MSP), Platform Integrator, Professional Services, Support, Systems Integrator, Training


# REGION
#   - Comma delimited list of geographic regions used on the extended SolutionsProvider details page in the side panel.
region: Global, Africa, Asia Pacific, Australia, Central America, Europe, Middle East, North America, South America


# OPENSEARCH SPECIALIZATION
#   - Comma delimited list of one or more feature areas of the OpenSearch platform that the SolutionsProvider specializes in.
#   - What OpenSearch technologies do you specialize in (e.g., search, analytics, observability, security, or other)?
opensearch_tech: Analytics, Logs and Metrics, Migration, Machine Learning and AI, Observability, Other, Search, Security


# INDUSTRIES
#   - Comma delimited list of one or more industries that the SolutionsProvider specializes in serving.
#   - What industries do you specialize in (e.g. business services, consumer services, education, energy and utilities, financial services, healthcare, media and entertainment, public sector, non-profit, retail, software and technology)? Add all that apply.
industries: Software and Technology, Business Services, Consumer Services, Education, Energy and Utilities, Government, Financial Services, Healthcare, Media and Entertainment, Public Sector, NonProfit, Retail, Telecommunications


# If the SolutionsProvider only has one office location then use the main_office_location key
# otherwise use the multiple_office_locations key.
# In the template rendering multiple_office_locations takes precedent,
# and if both are used only the multiple_office_locations data will be rendered
# in the template omitting the main_office_location data.
main_office_location:  |
  123 Main Street
  Suite 123
  City, State Zip Code
  Country
multiple_office_locations:
  - name: 'New York City'
    location: |
      123 Main Street 
      20th Floor
      New York, NY 10001
  - name: 'Portland, OR'
    location: |
      345 Main Street
      Portland, OR 97232

# Collection of Web resources that the SolutionsProvider wishes to promote on their extended SolutionsProviders details page. Resources like blog posts, tutorials, news announcements, etc.
# Each resource must have a url, title, thumbnail, and type.
# It is normative to upload images into a subdirectory within /assets/media/partners/ with the name of the SolutionsProvider as the directory name. 
# It is advised that the thumbnail images share the same, or very close to the same aspect ratio across all resources. 
resources:
  - url: 'https://example.com/blog'
    title: 'Blog Title'
    thumbnail: '/assets/media/partners/placeholder.png'
    type: 'blog'
  - url: 'https://example.com/resource'
    title: 'Resource Title'
    thumbnail: '/assets/media/partners/placeholder.png'
    type: 'resource'

# Collection of social links that the SolutionsProvider wishes to promote on their extended SolutionsProvider details page. Supported types are 'twitter', 'linkedin', 'facebook', and 'github'.
social_links:
  - url: 'https://twitter.com/example'
    icon: 'twitter'
  - url: 'https://www.linkedin.com/company/example'
    icon: 'linkedin'
  - url: 'https://facebook.com/example'
    icon: 'facebook'
  - url: 'https://github.com/example'
    icon: 'github'

# Collection of products that the SolutionsProvider wishes to promote on their extended SolutionsProvider details page. Each product should have a url, name, and description.
# The product listing is rendered below the SolutionsProvider description on the extended SolutionsProvider details page and above the resources.
products:
  - url: 'https://example-product.example'
    name: 'Example Product Name'
    description: 'Example Product Description'
  - url: 'https://another-example-product.example'
    name: 'Another Example Product Name'
    description: 'Another example product description.'
---
