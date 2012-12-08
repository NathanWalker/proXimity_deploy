'use strict';

ProximityApp.controller('SiteCtrl', ['$scope', '$location', 'GlobalService', function(s, $location, global){
  s.global = global;
  s.isHome = $location.path() == '/';
  s.headerLinks = [
    {label: 'Home', link: '/', active:true, useCarousel:true},
    {label: 'Products', link: '/products', active: false, useCarousel: false},
    {label: 'Blog', link: '/blog', active: false, useCarousel: false},
    {label: 'About', link: '/about', active: false, useCarousel: false},
    {label: 'Contact', link: '/contact', active: false, useCarousel: false}
  ];

  s.changeRoute = function(route){
    if(route !== undefined){
      devLog('change route: ' + route);

      $location.path(route);
      s.isHome = route == '/';
      _.forEach(s.headerLinks, function(l){
        l.active = l.link == route;
      });
//      if(angular.element('.nav-collapse').hasClass('in')) {
//        angular.element('.btn-navbar').trigger('click');
//      }
      s.toggleMenu(false);
    }
  };

  s.toggleMenu = function(force){
    if(force !== undefined){
      // force state
      s.global.menuEnabled(force);
    } else {
      // toggle state
      s.global.menuEnabled(!s.global.menuEnabled());
    }

  };

  s.showMsg = function(msg){
    s.global.alertMsg(msg);
  };

  s.carouselActive = function(){
    var activeRoute = _.find(s.headerLinks, function(l){
      return l.link == $location.path();
    });

    return activeRoute ? activeRoute.useCarousel : false;
  };
}]);
