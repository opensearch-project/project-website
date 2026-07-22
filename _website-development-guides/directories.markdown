## Directory Structure of `project-website`

```
https://github.com/opensearch-project/project-website
├── _artifacts 
|   (Artifact files for each downloadable, seperated by product)
├── _community_members
|   (Author, and conference speaker bios)
├── _community_projects
|   (Community project tiles)
├── _data
|   (Shared content that is accessible on multiple pages)
├── _events
|   (Events files - community meetings, etc. )
├── _faqs
|   (FAQ entries, one per file)
├── _includes
|   (Resuable HTML Fragments)
├── _layouts
|   (Liquid/HTML Templates)
├── _partners
|   (Partner tiles)
├── _plugins
|   (Custom ruby plugins for Jekyll)
├── _posts
|   (Blog posts)
├── _sass
│   (SASS/CSS style files)
├── _scripts
|   (Build specific shell scripts)
├── _site
|   (Build output when doing a preview)
├── _testimonials
|   (Testimonial files)
├── _tutorials
|   (Tutorial source files, for use with gitpod)
├── _versions
|   (Download page versions)
├── _website-development-guides
│   (Guides to help build and maintain this opensearch.org)
├── artifacts
|   |   (Source for https://opensearch.org/artifacts/)
│   └── by-version
|       (Source for https://opensearch.org/artifacts/by-version)
├── assets
|   |   (All static assets that aren't modified by Jekyll)
│   ├── brand
|   |   (Logos, brand guide, etc.)
│   ├── css
|   |   (where the compiled CSS file generated from _sass is placed)
│   ├── img
|   |   (Misc images, mostly favicons)
│   ├── js
|   |   (Client-side JavaScript)
│   └── media
|       (Images to support blog posts)
├── community/members/
|   (Source for https://opensearch.org/community/members/)
├── blog
|   (Source for blog listing: https://opensearch.org/blog/ )
├── community_projects
|   (Source for https://opensearch.org/community_projects)
├── docker
|   (website Dockerfile and associated files)
├── events
|   (Source for https://opensearch.org/events/)
├── faq
|   (Source for https://opensearch.org/faq/)
├── javadocs
|   (Source for https://opensearch.org/javadocs/, being moved to documentation-website)
├── partners
|   (Source for https://opensearch.org/partners/)
├── samples
│   (Contains the docker-compose file used on the downloads page)
├── testimonials
|   (Source for https://opensearch.org/testimonials/)
├── tutorial
└── (Source for https://opensearch.org/tutorials/)

```