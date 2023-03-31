---
name: SampleCompany
# name_long is used on the partner details page.
name_long: 'Sample Company'
# upload your logo to the following directory - must be square
logo: '/assets/media/partners/placeholder.png'
link: 'http://example.com'
# logo_large is used on the partner details page.
logo_large: '/assets/media/partners/placeholder.png'
product_image: '/assets/media/partners/calyptia-product.png'
description: Brief description of your business and what it does (50 words or less).
business_type: Type of business (e.g., MSP, CSP, ISV, product/technology, services organization, other). If other, please define.
region: What regions do you serve (e.g.,North America, South America, Europe, Middle East, Africa, Asia Pacific, Australia)?
contact: How can people contact you (email and phone).
opensearch_tech:  What OpenSearch technologies do you specialize in (e.g., search, analytics, observability, security, or other)?
industries:  What industries do you specialize in (e.g. business services, consumer services, education, energy and utilities, financial services, healthcare, media and entertainment, public sector, non-profit, retail, software and technology)? Add all that apply.

# If the partner only has one office location then use the main_office_location key
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
resources:
  - url: 'https://example.com/blog'
    title: 'Blog Title'
    thumbnail: '/assets/media/partners/placeholder.png'
    type: 'blog'
  - url: 'https://example.com/resource'
    title: 'Resource Title'
    thumbnail: '/assets/media/partners/placeholder.png'
    type: 'resource'
social_links:
  - url: 'https://twitter.com/example'
    icon: 'twitter'
  - url: 'https://www.linkedin.com/company/example'
    icon: 'linkedin'
  - url: 'https://facebook.com/example'
    icon: 'facebook'
  - url: 'https://github.com/example'
    icon: 'github'
products:
  - url: 'https://example-product.example'
    name: 'Example Product Name'
    description: 'Example Product Description'
  - url: 'https://another-example-product.example'
    name: 'Another Example Product Name'
    description: 'Another example product description.'
---
