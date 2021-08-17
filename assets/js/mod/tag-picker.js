define([
  'jquery' //requires jquery
], function( $ ) {
  var
      $allRepos = $('.repos'),
      $tagPick = $('.tag-pick'),
      tagAttr = 'data-show-tag',
      offClassAttr = 'data-toggled-off';
  $tagPick.click(function() {
    var
      $this = $(this),
      tagClass = $this.attr(offClassAttr),
      clikedTagAttr = '.'+$this.attr(tagAttr);
    $this.siblings().removeClass(tagClass);
    $this.toggleClass(tagClass);
    if ($tagPick.filter('.'+tagClass).length === 0) {
      $allRepos.children().show();
    } else {
      $allRepos.children().show().not(clikedTagAttr).hide();
    }
  });
});
