ProximityApp.directive('proxMenu', function(){
  var linkFn = function(scope, element, attrs){
    scope.$watch('global.menuEnabled()', function(val){
      if(val){
        element.css('height', '275px');
      } else {
        element.css('height', '0px');
      }
    });
  };

  return { restrict: 'A', link: linkFn };
});