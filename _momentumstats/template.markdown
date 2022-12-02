---
# stat_type: {image, html}
# stat_url: {destination_url_on_click}
# stat_img: https://imageurlhere/image.jpg
# display: {true, false}
display: false
---
This is the freeform text of a momentum statistic. The presentation template shall:

1. Filter momentum stats with the 'display' attribute of 'true' 

For those stats, 

2. Determine the *type* of the stat. 

* If the stat is of type image, display the image, make it link to "stat_url"
* If the stat is of type html, render the freeform text as is. A link will be added at the end to link to "stat_url"
* If the stat has a display attribute of false, do not display it. 
