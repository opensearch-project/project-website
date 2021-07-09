define([
    'jquery' //requires jquery
], function( $ ) {
  console.log('here')
  function selectExtras($extras,id) {
    $extras.children().show();
    $extras.children(':not(.extra_'+id+')').hide(); //$artifactSelect.val()
  }
  function selectPlatform($root) {
    var 
      $platformSelect = $root,
      $artifactSelect = $platformSelect.parent().children('.dl-artifact-select'),
      $extraLinks = $platformSelect.parent().children('.extra-links-group'),
      firstItemVal;
  
    $artifactSelect.children().show();
    $artifactSelect.children(':not(.platform_'+$platformSelect.val()+')').hide();
    firstItemVal = $artifactSelect.children('.platform_'+$platformSelect.val()).first().val();
    $artifactSelect.val(firstItemVal);

    $extraLinks.children().show();
    $extraLinks.children(':not(.extra_'+$platformSelect.val()+')').hide();
    selectExtras($extraLinks,firstItemVal);
  }

  $(".dl-platform-select").change(function() {
    selectPlatform($(this));
  });
  $(".dl-artifact-select").change(function() {
    var
      $artifactSelect = $(this),
      $extraLinks = $artifactSelect.parent().children('.extra-links');
    selectExtras($extraLinks,$artifactSelect.val());
  });

  $(".dl-platform-select").each(function(){
    selectPlatform($(this));
  })
});


