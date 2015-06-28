

function setCookie(key,val) {
   var path = "; domain=.hbs.edu; path=/";
   document.cookie = key+"="+val+path;
}

function assertTrue(msg,result) {
  if (!result) { error(msg); }
}

function assertEquals(msg,result1,result2) {
  if (result1 != result2) { error(msg + " | '" + result1 + "' and '" + result2 + "' are not equal"); }
}


function assertNumUnicaTags(num) {
   pagetag = OOOO0;
   var c = 0;
   for(x=0;x<pagetag.length;x++) {
      if (pagetag[x]) { c++ }
   }
   if(num != c) {
     error("Wrong number of pagetags sent, got "+c+" expected "+num);
   }
}

function assertUnicaTag(msg,num,values) {
   var pagetag = OOOO0[num];
   if (pagetag == null) { error("unable to find pagetag "+num); return; }
   console.info(num,pagetag);
   var src = unescape(pagetag.src);
   for (key in values) {
      if (src.indexOf(key+"="+values[key]) == -1) {
          error(msg+" : Unable to find "+key+"="+values[key]+" in unica pagetag ("+src+")");
      }
   }
}

var ERRORS = new Array();
function error(msg) {
  ERRORS.push(msg);
}

function appendError(msg) {

}

function ok() {
   if (ERRORS.length == 0) { 
      document.body.innerHTML = '<font color="green">OK</font>'; 
   } else {
      for (x=0;x<ERRORS.length;x++) {
         msg = ERRORS[x];
         document.body.innerHTML = document.body.innerHTML + '<font color="red">'+msg+' failed</font><br>'
      }
   }
   if (window.parent && window.parent.nexttest) {
     window.parent.nexttest();
   }

}


if(!("console" in window) || !("firebug" in console)) {
   var names = ["log", "debug", "info", "warn", "error", "assert","dir", "dirxml", "group"
                , "groupEnd", "time", "timeEnd", "count", "trace","profile", "profileEnd"];
   window.console = {};
   for (var i = 0; i <names.length; ++i) window.console[names[i]] = function() {};
}
