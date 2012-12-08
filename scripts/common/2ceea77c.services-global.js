ProximityApp.factory('GlobalService', ['$rootScope', '$window', '$timeout', '$http', '$filter', '$location', '$q', function($rootScope, $window, $timeout, $http, $filter, $location, $q){

  // redirect with # for old-ass Android browsers that can't hang
  (function(){
    if (Proximity.prop.platform.IS_LEGACY_ANDROID && !window.location.hash){
      var urlParts = window.location.href.match(/^([^:]+:\/\/\w+:{0,1}\w*@?[\w\.-]*(?::[0-9]+)?)(\/.*)/);
      window.location.href = urlParts[1] + '#' + urlParts[2];
    }
  }());

  var globalService = {};
  /**
   * Ensure $rootScope has reference to global
   * IMPORTANT within the http interceptor to use correct location override (for older browsers)
   */
  $rootScope.global = globalService;

  // list of properties on globalService that will get a generic setter/getter function created
  // format is 'functionName': defaultValue
  var getterSetterVars = {
    siteInitialized: false,
    isAuthenticated: false,
    loading: false,
    refreshing: false,
    menuVisible: false,
    menuEnabled: false
  };

  globalService.CopyrightYear = new Date().getFullYear();
  globalService.EmailRegExp = /^[A-z0-9._%-]+@[A-z0-9._%-]+\.[A-z]{2,4}$/;
  globalService.DateFormat = 'EEEE, MMM d, y @ h:mm a';
  globalService.DateFormatShort = 'MM/dd/yy h:mm a';
  globalService.DateFormatAgo = 'YYYYMMDDThhmmssZ';
  globalService.$filter = $filter;
  globalService.$timeout = $timeout;


  /* Define methods and event handlers for global site */
  globalService.location = (function(){
    if (Proximity.prop.platform.IS_LEGACY_IE){
      devLog('using LEGACY globalService.location....');
      return {
        path: function(path){
          if (angular.isUndefined(path)){
            // getter
            return window.location.pathname;
          } else {
            // setter
            window.location.pathname = path;
          }
        },
        search: function(search, paramValue){
          function encodeUriQuery(val, pctEncodeSpaces){
            return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace((pctEncodeSpaces ? null : /%20/g), '+');
          }

          function parseKeyValue(/**string*/keyValue){
            var obj = {}, key_value, key;
            angular.forEach((keyValue || "").split('&'), function(keyValue){
              if (keyValue){
                key_value = keyValue.split('=');
                key = decodeURIComponent(key_value[0]);
                obj[key] = angular.isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
              }
            });
            return obj;
          }

          function toKeyValue(obj){
            var parts = [];
            angular.forEach(obj, function(value, key){
              parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
            });
            return parts.length ? parts.join('&') : '';
          }

          if (angular.isUndefined(search)){
            // getter, return key/value object of query string params
            return parseKeyValue(window.location.search.slice(1));
          } else {
            // setter
            if (angular.isString(search)){
              /*
               * updating search string will trigger page refresh on legacy browsers so for now, ignore this
               if (paramValue == null){
               window.location.search = '?' + toKeyValue(delete parseKeyValue(window.location.search.slice(1))[search]);
               } else {
               window.location.search = '?' + toKeyValue(parseKeyValue(window.location.search.slice(1))[search] = paramValue);
               }
               */

              window.location.search = (search.indexOf('?') == 0) ? search : '?' + search;
            } else {
              window.location.search = toKeyValue(search);
            }
          }
        },
        url: function(url){
          if (angular.isUndefined(url)){
            // getter
            return window.location.href;
          } else {
            // setter
            window.location.href = url;
          }
        }
      };
    } else {
      return $location;
    }
  }());

  /**
   * force a page refresh with specified route
   */
  globalService.refreshPageWithRoute = function(route){
    devLog('globalService.refreshPageWithRoute: ' + route);
    $window.location.href = route;
  };
  /**
   * Handle anything upon routeChange
   *
   */
  $rootScope.$on('$routeChangeSuccess', function(event, routeInfo){
    globalService.loading(false); // ensure to turn this off on every successful route change
  });

  /**
   * Page Not Found - 404
   */
  globalService.showPageNotFound = function(showOfflineMsg){
    // redirect to 404
    globalService.setCurrentRoute('/pagenotfound');

    if (showOfflineMsg){
      globalService.offlineMsg();
    }
  };

  /**
   * Global View Helpers
   */
  /* phone links */
  globalService.triggerPhoneLink = function(phone){
    globalService.refreshPageWithRoute('tel:' + phone.replace(/-/g, ''));
  };
  globalService.triggerGoogleMapsLink = function(address){
    if (address){
      var googleMaps = 'http://maps.google.com/maps?q=';
      var addressText = (address.street ? address.street + ',' : '') + (address.city ? address.city + ',' : '') + (address.state ? address.state + ',' : '') + (address.zip ? address.zip : '');
      globalService.refreshPageWithRoute(googleMaps + addressText.replace(' ', '+'));
    }
  };
  globalService.contactLink = function(contact){
    if (contact.type.indexOf('Phone') > -1){
      globalService.triggerPhoneLink(contact.value);
    } else if (contact.type.indexOf('Fax') == -1){
      // otherwise, only handle contact types if not fax
      switch (contact.type) {
        case "Email":
          globalService.refreshPageWithRoute('mailto:' + contact.value);
          break;

        case "Website":
          globalService.refreshPageWithRoute(contact.value.indexOf('http') > -1 ? contact.value : 'http://' + contact.value);
          break;
      }
    }
  };

  /**
   * Manually trigger scope.$apply() - *ONLY if not already in progress*
   * There are cases where this is needed especially when working with persistence framework and async callbacks (with varying return times)
   */
  globalService.safelyTriggerScopeApply = function(scope){
    if (!scope.$$phase){
      scope.$apply();
    }
  };

  /**
   * standard javascript alert via angular $window service
   *
   **/
  globalService.alertMsg = function(msg){
    ($window.mockWindow || $window).alert(msg);
  };

  globalService.offlineMsg = function(){
    globalService.alertMsg('You are offline right now. Try again later.');
    globalService.refreshing(false);
    globalService.loading(false);
  };

  // loop through all standard properties and make a setter/getter for each
  _.forEach(getterSetterVars, function(defaultVal, varName){
    globalService[varName] = createFactoryFunction(varName, defaultVal);
  });

  // function for creating generic property getter/setters
  function createFactoryFunction(fnName, defaultValue){
    var varName = '_' + fnName;

    return function(value){
      if (angular.isDefined(value)){
        var oldValue = this[varName];
        this[varName] = value;
        $rootScope.$broadcast('change:' + fnName, this[varName], oldValue); // passes the new property and old property along with the event broadcast
      } else {
        return (angular.isDefined(this[varName])) ? this[varName] : defaultValue;
      }
    };
  }

  return globalService;
}]);
