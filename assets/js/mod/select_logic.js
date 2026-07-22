define([
    'jquery' //requires jquery
], function( $ ) {
  function selectExtras($root) {
    var
        $artifactSelect = $root,
        $artifactSelectVal = $artifactSelect.val(),
        $extraLinks = $artifactSelect.parent().find('.extra-links-group'),
        $extraInstructions = $artifactSelect.parent().parent().children('.extra-instructions-group');

    $extraLinks.children().show();
    $extraLinks.children(':not(.extra_'+$artifactSelectVal+')').hide();

    $extraInstructions.children('.extra_' + $artifactSelectVal).show();
    $extraInstructions.children(':not(.extra_' + $artifactSelectVal + ')').hide();
  }
  function selectPlatform($root) {
    var
      $platformSelect = $root,
      $artifactSelect = $platformSelect.parent().children('.dl-artifact-select'),
      firstItemVal;
  
    $artifactSelect.children().show();
    $artifactSelect.children(':not(.platform_'+$platformSelect.val()+')').hide();
    firstItemVal = $artifactSelect.children('.platform_'+$platformSelect.val()).first().val();
    $artifactSelect.val(firstItemVal);

    selectExtras($artifactSelect);
  }

  $(".dl-platform-select").change(function() {
    selectPlatform($(this));
  });
  $(".dl-artifact-select").change(function() {
    selectExtras($(this));
  });

  $(".dl-platform-select").each(function(){
    selectPlatform($(this));
  })
});


