---
# Partner name used on the partners collection page (/partners).
name: Addweb Solution

# name_long is used on the extended partner details page.
name_long: Addweb Solution

# The partner logo is used on the partners collection page (/partners).
# upload your logo to the following directory - must be square
logo: '/assets/media/partners/addweb.logo.png'

# URL to the partner's website.
link: 'https://www.addwebsolution.com/'

# logo_large is used on the extended partner details page.
# It is normative to upload all extended partner page images to a subdirectory of /assets/media/partners/ with the name of the partner as the directory name.
# For example given a partner named "SampleCompany" the logo_large image would be uploaded to /assets/media/partners/samplecompany/logo_large.png
logo_large: '/assets/media/partners/placeholder.png'

# Large image displayed in the top right of the extended partner details page.
product_image: '/assets/media/partners/samplecompany/sample-product-image.png'
# Partner company description used on the extended partner details page.
description: Since 2012, AddWeb has been a renowned company delivering Web, Mobile, Cloud, & Marketing Solution to Entrepreneurs, Startups & Businesses. With over 11 years of experience, we are an ISO 9001:2008 certified company catering to startups, SMEs, large-scale enterprises, and Fortune 500 clients worldwide. Our clientele includes prestigious brands such as VODAFONE, DOCOMO, CISCO,SKECHERS,UNITED NATIONS,ORANGE,TRAVEL NATION. 

# Comma delimited list of business types used on the extended partner details page in the side panel.
business_type: "Professional Services Organization"

# Comma delimited list of geographic regions used on the extended partner details page in the side panel.
region: North America, South America, Europe, Middle East, Africa, Asia Pacific, Australia

# Comma delimited list of one or more of email addresses, phone numbers, and web URLs that can be used to contat the partner.
contact: contact@addwebsolution.com, coffee@addwebsolution.com, https://www.addwebsolution.com/contact-us

# Comma delimited list of one or more feature areas of the OpenSearch platform that the partner specializes in.
opensearch_tech: search, analytics, observability, security

# Comma delimited list of one or more industries that the partner specializes in serving.
industries:  business services, consumer services, education, financial services, healthcare, media and entertainment, public sector, non-profit, retail, software and technology

# If the partner only has one office location then use the main_office_location key
# otherwise use the multiple_office_locations key.
# In the template rendering multiple_office_locations takes precedent,
# and if both are used only the multiple_office_locations data will be rendered
# in the template omitting the main_office_location data.
main_office_location:  |
  "Ahmedabad

705, Silicon Tower, Opp. Law Garden, Off C.G. Road, Ahmedabad Gujarat 380009"
multiple_office_locations:
  - name: USA'
    location: |
      "
4502 Bragdon Way, Glen Allen, VA 23059, United States"
  - name: 'Jaipur'
    location: |
    "1st Floor, 69/399,
Madhyam Marg,
Mansarovar,
Jaipur, Rajasthan, 302020"

# Collection of Web resources that the partner wishes to promote on their extended partner details page. Resources like blog posts, tutorials, news announcements, etc.
# Each resource must have a url, title, thumbnail, and type.
# It is normative to upload images into a subdirectory within /assets/media/partners/ with the name of the partner as the directory name. 
# It is advised that the thumbnail images share the same, or very close to the same aspect ratio across all resources. 
resources:
  - url: 'https://www.addwebsolution.com/blogs'
    title: 'Blogs | Addweb Solution'
    thumbnail: '/assets/media/partners/placeholder.png'
    type: 'blog'
  
# Collection of social links that the partner wishes to promote on their extended partner details page. Supported types are 'twitter', 'linkedin', 'facebook', and 'github'.
social_links:
  - url: 'https://twitter.com/AddWebSolution'
    icon: 'twitter'
  - url: 'https://www.linkedin.com/company/addwebsolution/'
    icon: 'linkedin'
  - url: 'https://www.facebook.com/addwebsolution.pvt.ltd'
    icon: 'facebook'
  - url: 'https://www.instagram.com/addwebsolution.pvt.ltd/'
    icon: 'instagram'

# Collection of products that the partner wishes to promote on their extended partner details page. Each product should have a url, name, and description.
# The product listing is rendered below the partner description on the extended partner details page and above the resources.
products:
  - url: 'https://www.addwebsolution.com/web-application-development'
    name: 'Web Application Development'
  - url: 'https://www.addwebsolution.com/ecommerce-development'
    name: 'Ecommerce Development'
     - url: 'https://www.addwebsolution.com/mobile-apps-development'
    name: 'Mobile App Development'
  - url: 'https://www.addwebsolution.com/digital-marketing'
    name: 'Digital Marketing'
---
