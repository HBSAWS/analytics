function O00O0OO(O000OO, O0O0O, O000OOO, OO0O00O) {
   var O00O0 = "";
   O00O0 = O000OO + "\x3d" + escape(O0O0O) + "\x3b";
   if(OO0O00O)O00O0 += "\x20\x64\x6f\x6d\x61\x69\x6e\x3d" + OO0O00O + "\x3b";
   if(O000OOO > (0xef5 + 5901 - 0x2602)) {
      var OOO0OO = new Date();
      OOO0OO.setTime(OOO0OO.getTime() + (O000OOO * (0xcb3 + 1460 - 0xe7f)));
      O00O0 += "\x20\x65\x78\x70\x69\x72\x65\x73\x3d" + OOO0OO.toGMTString() + "\x3b";
      }
   O00O0 += "\x20\x70\x61\x74\x68\x3d\x2f";
   document.cookie = O00O0;
   };
function O0O000(O000OO) {
   var O0O0O0O = O000OO + "\x3d";
   if(document.cookie.length > (0x1a9f + 2639 - 0x24ee)) {
      var O0OOOO;
      O0OOOO = document.cookie.indexOf(O0O0O0O);
      if(O0OOOO !=- (0x450 + 7697 - 0x2260)) {
         var OOOOO0;
         O0OOOO += O0O0O0O.length;
         OOOOO0 = document.cookie.indexOf("\x3b", O0OOOO);
         if(OOOOO0 ==- (0x13ec + 1467 - 0x19a6))OOOOO0 = document.cookie.length;
         return unescape(document.cookie.substring(O0OOOO, OOOOO0));
         }
      else {
         return null;
         };
      }
   };
function O0OO00O(O0OO0) {
   var O0O00O = "";
   for(OO00O in O0OO0) {
      if(O0OO0[OO00O] && O0OO0[OO00O] != "") {
         if(O0O00O != "")O0O00O += "\x3b";
         O0O00O += OO00O + "\x3d" + O0OO0[OO00O];
         };
      }
   return O0O00O;
   };
var OO000O = ["\x41", "\x42", "\x43", "\x44", "\x45", "\x46", "\x47", "\x48", "\x49", "\x4a", "\x4b", "\x4c", "\x4d", "\x4e", "\x4f", "\x50", "\x51", "\x52", "\x53", "\x54", "\x55", "\x56", "\x57", "\x58", "\x59", "\x5a", "\x61", "\x62", "\x63", "\x64", "\x65", "\x66", "\x67", "\x68", "\x69", "\x6a", "\x6b", "\x6c", "\x6d", "\x6e", "\x6f", "\x70", "\x71", "\x72", "\x73", "\x74", "\x75", "\x76", "\x77", "\x78", "\x79", "\x7a", "\x30", "\x31", "\x32", "\x33", "\x34", "\x35", "\x36", "\x37", "\x38", "\x39"];
function O0OOOO0(OO00OO) {
   if(OO00OO < (0x20d7 + 1452 - 0x2645)) {
      return OO000O[OO00OO];
      }
   else {
      return(O0OOOO0(Math.floor(OO00OO / (0x10fa + 140 - 0x1148))) + OO000O[OO00OO % (0xf49 + 5561 - 0x24c4)]);
      }
   };
function O0O0000() {
   var OO0OOOO = "";
   var O0OO000 = new Date();
   for(O000O00 = (0x1a34 + 131 - 0x1ab7); O000O00 < (0x650 + 6507 - 0x1fb0); O000O00++) {
      OO0OOOO += OO000O[Math.round(Math.random() * (0x861 + 6483 - 0x2177))];
      }
   return(OO0OOOO + "\x2d" + O0OOOO0(O0OO000.getTime()));
   };
function getparam(p, def) {
   return(eval("typeof " + OOO00O0 + "!= undefiend") ? eval(p) : def);
   };
function O00O000(OOO000O, OOO0O0) {
   return(OOO000O + (((OOO000O == '') || ((OOO0O0 == '') || (OOO0O0.substring((0xb96 + 4407 - 0x1ccd), (0x91 + 9424 - 0x2560)) == "\x26"))) ? '':"\x26") + OOO0O0);
   };
function gettime() {
   var OOO00O = new Date();
   return(OOO00O.getTime() + "\x2e" + Math.floor(Math.random() * (0x68b + 2066 - 0xab5)));
   };
function ntptAddPair(O000OO, OO000OO) {
   OOO00[O000OO] = OO000OO.toString();
   };
function O0OOO00(O000OO) {
   OOO00[O000OO] = '';
   };
function addparam(O000O) {
   var OOOO0O = '', OO00O, O0O0O;
   O0000O(getparam("NTPT_GLBLEXTRA", ''));
   if(!LnkLck)O0000O(getparam("NTPT_PGEXTRA", ''));
   O0000O(O000O);
   for(OO00O in OOO00) {
      O0O0O = OOO00[OO00O];
      if(typeof(O0O0O) == "string") {
         if(O0O0O && (O0O0O != ''))OOOO0O = O00O000(OOOO0O, (OO00O + "\x3d" + (self.encodeURIComponent ? encodeURIComponent(O0O0O) : escape(O0O0O))));
         };
      }
   return OOOO0O;
   };
function O000000() {
   var x;
   uobj.arr = new Array();
   for(x in uarr)uobj.arr[x] = uarr[x];
   };
function OOOO00O() {
   var x;
   arr = new Array();
   for(x in uobj.arr)arr[x] = uobj.arr[x];
   };
function timeout(curr, funcstr, sec) {
   if(uarray[curr] != null) {
      var tmp = new Function(funcstr);
      uarray[curr].onload = tmp;
      uarray[curr].onerror = tmp;
      uarray[curr].onabort = tmp;
      }
   setTimeout(funcstr, (sec * 1000));
   };
function loadtag(img, data) {
   if(img == '')return;
   curr = ((curr + 1) % uarray.length);
   if(uarray[curr] == null)uarray[curr] = new Image(1, 1);
   uarray[curr].src = img + "?" + data;
   };
function sendtag(querymod) {
   var img;
   var params;
   if((OO0000O != '') && (document.location.protocol == "https:"))img = OO0000O;
   else img = NTPT_IMGSRC;
   params = addparam(querymod);
   loadtag(img, params);
   OOOO00O();
   };
function O0000O(O000O) {
   var OOO000;
   var O0OO00;
   if(!O000O)return;
   O000O = O000O.toString();
   if(O000O == '')return;
   OOO000 = O000O.split("\x26");
   for(O0OO00 = (0xb21 + 4576 - 0x1d01); O0OO00 < OOO000.length; O0OO00++) {
      var O000O0 = OOO000[O0OO00].split("\x3d");
      if(O000O0.length == (0x1493 + 4481 - 0x2612))ntptAddPair(O000O0[(0xff0 + 4231 - 0x2077)], (self.decodeURIComponent ? decodeURIComponent(O000O0[(0x14a + 3581 - 0xf46)]) : unescape(O000O0[(0x96b + 2934 - 0x14e0)])));
      }
   };
function ntptEventTag(querymod) {
   ntptAddPair("ets", gettime());
   sendtag(querymod);
   return true;
   };
function ntptLinkTag(linkobj, querymod, maxwaittime) {
   var wait;
   if(!linkobj ||!linkobj.href)return true;
   if(LnkLck)return false;
   LnkLck = linkobj;
   if(NTPT_FLDS.lc)ntptAddPair("lc", linkobj.href);
   if(NTPT_FLDS.rf) {
      if(!pagereftop ||!top ||!top.document)ntptAddPair("rc", document.location);
      }
   ntptEventTag(querymod);
   if(maxwaittime)wait = maxwaittime;
   else wait = NTPT_MAXTAGWAIT;
   if(wait > 0) {
      var code;
      if(linkobj.click) {
         linkobj.tmpclck = linkobj.onclick;
         linkobj.onclick = null;
         code = "if ( LnkLck ) { LnkLck.click(); LnkLck.onclick = LnkLck.tmpclck; LnkLck = null; }";
         }`
      else code = "if ( LnkLck ) { window.location.href = " + linkobj.href + "; LnkLck = null; }";
      timeout(curr, code, wait);
      return false;
      }
   LnkLck = null;
   return true;
   };
function ntptSubmitTag(formobj, querymod, maxtagwait) {
   var wait;
   if(!formobj ||!formobj.submit)return true;
   if(FrmLck)return false;
   FrmLck = formobj;
   ntptEventTag(querymod);
   if(maxtagwait) wait = maxtagwait;
   else wait = NTPT_MAXTAGWAIT;
   if(wait >0) {
      formobj.tmpsbmt = formobj.onsubmit;
      formobj.onsubmit = null;
      timeout(curr, "if ( FrmLck ) { FrmLck.submit(); FrmLck.onsubmit = FrmLck.tmpsbmt; FrmLck = null; }", wait);
      return false;
      }
   FrmLck = null;
   return true;
   };
var OO0O0OO = NTPT_IMGSRC;
var NTPT_FLDS = NTPT_FLDS;
var O00000 = getparam("NTPT_GLBLCOOKIES", null);
var OO0O0O = getparam("NTPT_PGCOOKIES", null);
var O0OOOOO = getparam("NTPT_SET_IDCOOKIE", false);
var OO00O0 = getparam("NTPT_IDCOOKIE_NAME", "SaneID");
var OO00O0O = getparam("NTPT_IDCOOKIE_DOMAIN", null);
var OO000O0 = getparam("NTPT_IDCOOKIE_EXPIRE", 155520000);
var OO0000O = getparam("NTPT_HTTPSIMGSRC", '');
var OOOOO0O = getparam("NTPT_PGREFTOP", getparam("NTPT_GLBLREFTOP", false));
var OO0O0O0 = getparam("NTPT_NOINITIALTAG", false);
var ntptAddPair = O00OO;
var ntptDropPair = O0OOO00;
var ntptEventTag = O0O0OO;
var ntptLinkTag = OOOOO00;
var ntptSubmitTag = OOO0O0O;
var OOO00 = new Array();
var uobj = new Object();
var uarray = Array(10);
var curr;
for(x = 0; x < uarray.length; x++)uarray[x] = null;
var LnkLck = null;
var FrmLck = null;
ntptAddPair("js", "1");
ntptAddPair("ts", gettime());
if(NTPT_FLDS.lc)ntptAddPair("\x6c\x63", document.location);
if(NTPT_FLDS.rf) {
   var ref;
   if(pagereftop && top && top.document)ref = top.document.referrer;
   else ref = document.referrer;
   ntptAddPair("rf", ref);
   }
if(self.screen) {
   if(NTPT_FLDS.rs)ntptAddPair("\x72\x73", self.screen.width + "\x78" + self.screen.height);
   if(NTPT_FLDS.cd)ntptAddPair("\x63\x64", self.screen.colorDepth);
   }
if(NTPT_FLDS.ln) {
   var OOO0O;
   if(navigator.language)OOO0O = navigator.language;
   else if(navigator.userLanguage)OOO0O = navigator.userLanguage;
   else OOO0O = '';
   if(OOO0O.length > (0x21e2 + 1025 - 0x25e1))OOO0O = OOO0O.substring((0x1d13 + 248 - 0x1e0b), (0x25e7 + 228 - 0x26c9));
   OOO0O = OOO0O.toLowerCase();
   ntptAddPair("\x6c\x6e", OOO0O);
   }
if(NTPT_FLDS.tz) {
   var OO0O0;
   var OOO00O = new Date();
   var O0O00 = OOO00O.getTimezoneOffset();
   var OO0000;
   OO0O0 = "\x47\x4d\x54";
   if(O0O00 != (0xf20 + 3657 - 0x1d69)) {
      if(O0O00 > (0x5f9 + 7600 - 0x23a9))OO0O0 += "\x20\x2d";
      else OO0O0 += "\x20\x2b";
      O0O00 = Math.abs(O0O00);
      OO0000 = Math.floor(O0O00 / (0x1625 + 4099 - 0x25ec));
      O0O00 -= OO0000 * (0x1063 + 4891 - 0x2342);
      if(OO0000 < (0x670 + 2144 - 0xec6))OO0O0 += "\x30";
      OO0O0 += OO0000 + "\x3a";
      if(O0O00 < (0xedf + 3559 - 0x1cbc))OO0O0 += "\x30";
      OO0O0 += O0O00;
      }
   ntptAddPair("\x74\x7a", OO0O0);
   }
if(NTPT_FLDS.jv) {
   var OOOO00;
   if(navigator.javaEnabled())OOOO00 = "\x31";
   else OOOO00 = "\x30";
   ntptAddPair("\x6a\x76", OOOO00);
   }
var O0OO0 = new Array();
var OOOO0O0 = false;
if(NTPT_FLDS.ck) {
   var O00O0O;
   var O00O0, OO0OOO;
   if(O00000) {
      for(O00O0O = (0x11b6 + 1438 - 0x1754); O00O0O < O00000.length; O00O0O++) {
         O0OO0[O00000[O00O0O]] = "";
         };
      }
   if(OO0O0O) {
      for(O00O0O = (0x1c38 + 484 - 0x1e1c); O00O0O < OO0O0O.length; O00O0O++) {
         O0OO0[OO0O0O[O00O0O]] = "";
         };
      }
   for(OO00O in O0OO0) {
      O00O0 = O0O000(OO00O);
      if(O00O0) {
         O0OO0[OO00O] = O00O0;
         };
      }
   if(O0OOOOO) {
      O00O0 = O0O000(OO00O0);
      if(O00O0) {
         O0OO0[OO00O0] = O00O0;
         OOOO0O0 = true;
         };
      }
   OO0OOO = O0OO00O(O0OO0);
   if(OO0OOO != "")ntptAddPair("\x63\x6b", OO0OOO);
   }
O000000();
if(!OO0O0O0)O0OOO0O('');
if(O0OOOOO &&!OOOO0O0) {
   var O00O0 = O0O000(OO00O0);
   if(!O00O0) {
      O00O0 = O0O0000();
      O00O0OO(OO00O0, O00O0, OO000O0, OO00O0O);
      if(NTPT_FLDS.ck && O0O000(OO00O0)) {
         O0OO0[OO00O0] = O00O0;
         var OO0OOO = O0OO00O(O0OO0);
         if(OO0OOO != "") {
            ntptAddPair("\x63\x6b", OO0OOO);
            O000000();
            };
         };
      };
   }

