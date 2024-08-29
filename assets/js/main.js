// Require.js Module Loader - http://requirejs.org
define(function() {
    var mods = [];

    //detect Class function
    function hasClass( className ) {
        if (!document.getElementsByClassName) { //class name function in old IE
            document.getElementsByClassName = function(search) {
                var d = document, elements, pattern, i, results = [];
                if (d.querySelectorAll) { // IE8
                    return d.querySelectorAll("." + search);
                }
                if (d.evaluate) { // IE6, IE7
                    pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
                    elements = d.evaluate(pattern, d, null, 0, null);
                    while ((i = elements.iterateNext())) {
                        results.push(i);
                    }
                } else {
                    elements = d.getElementsByTagName("*");
                    pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
                    for (i = 0; i < elements.length; i++) {
                        if ( pattern.test(elements[i].className) ) {
                            results.push(elements[i]);
                        }
                    }
                }
                return results;
            };
        }
        return !!document.getElementsByClassName( className ).length; //return a boolean
    }

    //collapsing list
    if (hasClass('list-collapsing')) {
        mods.push('mod/list-collapsing');
    }

    if (hasClass('version-switcher')) {
        mods.push('mod/version-switcher');
    }

    if (hasClass('tag-picker')) {
        mods.push('mod/tag-picker');
    }

    if (hasClass('doc-floating-warning')) {
        mods.push('mod/floating-warning');
    }

    if (hasClass('dashboard-index')) {
        mods.push('dashboard/index');
    }

    if (hasClass('dashboard-detail')) {
        mods.push('dashboard/detail');
    }

    // search form
    if (hasClass('search')) {
        mods.push('mod/search-key');
    }

    if (hasClass('code-block-caption') || hasClass('snippet')) {
        mods.push('mod/clippify');
    }

    if (hasClass('console-block')) {
        mods.push('mod/console-tabs');
    }
    
    if (hasClass('pr-maker')) {
        mods.push('mod/pr-maker')
    }

    if (hasClass('locale-date') || hasClass('locale-datetime')) {
        mods.push('mod/locale-date');
    }

    mods.push('/assets/js/mod/select_logic.js');

    require(mods);
});



"use strict";
var theme = {
   init: function () {
      theme.menu();
   },

   // Menu
   menu: () => {
      const dropdownLinks = document.querySelectorAll(".dropdown-menu a.dropdown-toggle");

      dropdownLinks.forEach(function (dropdownLink) {
         dropdownLink.addEventListener("click", function (e) {
            if (!this.nextElementSibling.classList.contains("show")) {
               const parentDropdownMenu = this.closest(".dropdown-menu");
               const currentlyOpenSubMenus = parentDropdownMenu.querySelectorAll(".show");
               currentlyOpenSubMenus.forEach(function (openSubMenu) {
                  openSubMenu.classList.remove("show");
               });
            }

            const subMenu = this.nextElementSibling;
            subMenu.classList.toggle("show");

            const parentDropdown = this.closest("li.nav-item.dropdown.show");
            if (parentDropdown) {
               parentDropdown.addEventListener("hidden.bs.dropdown", function (e) {
                  const dropdownSubMenus = document.querySelectorAll(".dropdown-submenu .show");
                  dropdownSubMenus.forEach(function (dropdownSubMenu) {
                     dropdownSubMenu.classList.remove("show");
                  });
               });
            }

            e.stopPropagation();
         });
      });
   },
};

theme.init();

