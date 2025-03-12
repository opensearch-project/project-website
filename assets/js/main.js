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


