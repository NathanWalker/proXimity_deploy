'use strict';

ProximityApp.controller('MainCtrl', ['$scope', '$resource', function(s, $resource) {
  s.awesomeThings = [
    'HTML5 Boilerplate', 'AngularJS', 'Testacular'
  ];

  s.twitterFeed = [];
  s.twitter = $resource('http://search.twitter.com/:action',
    {action:'search.json', q:'comedy', callback:'JSON_CALLBACK'},
    {get:{method:'JSONP'}});
  s.twitter.get(function(data){
    s.twitterFeed = data.results;
  });

}]);
