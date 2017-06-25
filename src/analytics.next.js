//
// Sitewide HBS analytics package
// 
// $Author: jgriffith $
//
 
(function(){
  
if (window.analytics) return;

var Analytics = {

    options: {
   
        // the parameter that triggers a search event
        searchParams: ['qt','q','query'],

        // parameters that uniquely identify new pages 
        pageParams: [],

        // if we want a domain to rollup into a different site variable
        siteOverrides: {
                      'my.hbs.edu':'intranet.hbs.edu',
                      'member.exed.hbs.edu':'www.exed.hbs.edu',
                      'apps.alumni.hbs.edu':'www.alumni.hbs.edu'
                     },

        // list of production webservers
        prod: ['www.hbs.edu','www.library.hbs.edu','www.exed.hbs.edu','www.alumni.hbs.edu','search.hbs.edu',
               'hbswk.hbs.edu','member.exed.hbs.edu','secure.hbs.edu','m.exed.hbs.edu','cn.exed.hbs.edu',
               'beech.hbs.edu','m.hbs.edu','ln.hbs.edu','asklib.library.hbs.edu','poplar.hbs.edu',
               'exed-hbs-form.secure.force.com','exed-hbs.force.com',
               'intranet.hbs.edu','inside.hbs.edu','mysite.hbs.edu','www.isc.hbs.edu','lnx.hbs.edu'],

        // List of strings to send a 500 error
        errorStrings: ['an error occurred while processing this directive'],

        // This page's title
        title: null,

        // the root of the website
        baseUrl: '/',

        // Automatically setup click events
        autoEvents: true,

        language: 'en',

        // a reportsuite override for adobe
        rsid: null,

        // a hash of user paraters to mark the page as being an admin pageview
        //                 analytics.settings({
        //                   'siteAdmins':{'role':['Staff','Faculty'] }
        //                 });      
        siteAdmins: null,

        // google analytics trackers
        gaTrackers: [],

        // needs to be set if the site parameter isn't specific enough
        // eg, mba
        profile: null,

        // a way to give a different profile code to Adobe Analytics
        futureProfile: null,

        // track a personID for each user, eg 18342
        personID: null,
        eePersonID: null, // iRM ID

        // a way to tag events to external systems
        eventID: null,

        // a way to override the url of this pageview
        url: null,

        level0: null,
        level1: null,
        level2: null,

        // a way to increase the engagement number
        engagement: 0,

        debug: false,

        // AB Test
        testSegment: null,



        // do we try to use the users previous profile?  This allows profiles to be sticky on shared pages (login,search,404)
        lastprofile: false,

        // valid entries for controlled lists
        validator: { role:["External","MBA","Alumni","Staff","Faculty","Exed","Doctoral"]},

        // should be set to the domain, eg www.library.hbs.edu 
        site: null

    },

    version: 1,
    _hasFeatures:false,
    startTime: (new Date()).getTime(),

    _preinit: function(){
        // Runs before the page is done loading

        Analytics._runAsyncQueue();
        Analytics.options.debug = Analytics.options.debug || Util.getCookie("AnalyticsDebug") ? true : false;

        Analytics._corrections();
        User.init();
    },
   
    _corrections: function(){
        // fix any bad cookies we might have given to users
        if (Util.getCookie("AnalyticsForceRole") == ';') {
            Util.delCookie("AnalyticsForceRole");
        }
        Util.delCookie("UnicaData");
    },
   
    _init: function() {
        // Initializes variables before tag is sent

        Analytics._runAsyncQueue();

        if (!Analytics.options.site) { Analytics.options.site = document.location.hostname; }
      
        Analytics.options.site = Analytics.options.siteOverrides[Analytics.options.site] || Analytics.options.site;

        if (Analytics.options.site && !Analytics.options.lastprofile && (User.lastsite != Analytics.options.site)) {
            User.lastsite = Analytics.options.site;
            User.store();
        }

        if (Analytics.options.personID) {
            User.personID = Analytics.options.personID;
            User.store();
        }

        if (Analytics.options.profile  && !Analytics.options.lastprofile && (User.lastprofile != Analytics.options.profile) ) {
            User.lastprofile = Analytics.options.profile;
            User.store();
        }
      
        Adobe.init(Analytics.options,User);
        Adobe.set("eVar28","D=g");  // save page URL 
        Adobe.set("prop25","D=g");  // enable pathing
        Adobe.set("eVar16","D=mid");  // save marketing cloud ID 

        if (User.role) {
            Adobe.set('prop9',User.role);
            Adobe.set('eVar11','D=c9');
            Adobe.set('eVar8','D=c9'); // duplicate to fix bugginess, might remove later
            Adobe.set('eVar15',User.role);
            Adobe.set('eVar9','logged in');
        }
        if (User.roleDetail) {
            Adobe.set('prop9',User.role + " : " + User.roleDetail);  // get as specific as possible in the prop9
            Adobe.set('eVar11','D=c9');
            Adobe.set('eVar8','D=c9');
        } 
        if (User.role) {
            if (User.personID) {
                Adobe.set('visitorID',User.personID);
                Adobe.set("eVar16","D=vid"); 
                Adobe.set('prop8',User.personID);
            }
        } else {
            Adobe.set('prop8','guest');
            Adobe.set('eVar9','anonymous');
        } 

        if (User.eePersonID) {
            Adobe.set('eVar36',User.eePersonID);
        }

        if (Analytics.options.siteRole) {
            Adobe.set('eVar62',Analytics.options.siteRole);   
        }

        if (Analytics.options.lastprofile && User.lastsite) {
            Adobe.set('server',User.lastsite);
        } else {
            Adobe.set('server',Analytics.options.site);
        }

        if (Analytics.options.lastprofile && User.lastprofile ) {
            Adobe.set('prop1',User.lastprofile);
        } else if (Analytics.options.profile) {
            Adobe.set('prop1',Analytics.options.futureProfile || Analytics.options.profile);
        }
        Adobe.set('eVar13',"D=c1");

        Adobe.set('eVar18',Util.getOS());
        Adobe.set('eVar20',Util.getBrowser());
        Adobe.set('eVar23',Util.getReferringDomain());
        Adobe.set('eVar24',Util.getReferringSearchEngine());
        Adobe.set('eVar32',Analytics.options.eventID,true);
        Adobe.set("eVar17",Analytics.options.engagement);
        Adobe.set("eVar26",Analytics.options.testSegment);
        Adobe.set('eVar36',Analytics.options.eePersonID);
        Adobe.set('eVar39',Analytics.options.bypassFormCookie);

        // only run if our baseUrl matches the document.location
        if (document.location.pathname.toLowerCase().indexOf(Analytics.options.baseUrl.toLowerCase()) === 0) {
           Adobe.set("eVar4",Util.getNewRepeat(365,"s_nr"+Analytics.options.profile,Analytics.options.baseUrl));
           Adobe.set("eVar14",Util.getVisitNum(Analytics.options.profile,Analytics.options.baseUrl));
        }
 
        Adobe.set("eVar6",s.getTimeParting('d','-5') + " " + s.getTimeParting('h','-5'));
        Adobe.set("eVar7",Util.timestamp()); 
        Adobe.set("eVar31",Util.timestamp(1));
        Adobe.set("eVar21",s.getDaysSinceLastVisit());

        //Mobile Tracking
        Adobe.set('eVar51',Util.touchScreen());
        Adobe.set('eVar52',Util.screenOrientation());
        Adobe.set('eVar53',window.devicePixelRatio>1?'retina':'standard');
        //Adobe.set('eVar44',Util.searchEngineRank());
        Adobe.set('eVar54',Analytics.options.language);

        //Determine bounce rate for all visits
        var visitStart = s.getVisitStart("s_visit");
        //s.clickPast(visitStart,'event3','event4');

        // pull search values
        var searchParams = Analytics.options.searchParams;
        for (var i=0;i<searchParams.length;i++) {
            var value = Util.getParam(searchParams[i]);
            if (value) {Analytics.search(value);}
        }

        // look for rendering errors and send a 500 if found
        var errorStrings = Analytics.options.errorStrings;
        var innerHTML = document.body.innerHTML;
        for (var j=0;j<errorStrings.length;j++) {
            if (innerHTML.indexOf(errorStrings[j]) > -1) { Analytics.error(500,"500 : " + errorStrings[j] +" : "+document.location.href);}
        }

        // automatically setup click events
        if (Analytics.options.autoEvents) {
            Analytics.rebind();
        }

        // add onunload event
        Util.addEvent(window,'beforeunload',User.startTimer);
    },

    _initPageVars: function(url,pageName,ignoreOptions){
        Adobe.set('pageURL',url);
        Adobe.set('eVar28',"D=pageURL");
        Adobe.appendEvent("event6");
        Adobe.set('pageName',pageName);
        Adobe.set('eVar1',"D=pageName");

        Adobe.set('prop26',pageName.split('?')[0]) //root page
        Adobe.set('eVar42','D=c26') 

        Analytics.path = new PathParser(analytics.options,url);
        var level0 = (!ignoreOptions && Analytics.options.level0) || Analytics.path.folder(0);
        if (level0) { Adobe.set('channel',level0); }
        else { Adobe.set('channel',null); }
        Adobe.set('prop17',"D=ch");
        Adobe.set('eVar56',"D=ch");

        var level1 = (!ignoreOptions && Analytics.options.level1) || Analytics.path.folder(0,1);
        if (level1) { Adobe.set('prop2',level1);  }
        else { Adobe.set('prop2',null); }
        Adobe.set('eVar38',"D=c2");

        var level2 = (!ignoreOptions && Analytics.options.level2) || Analytics.path.folder(0,2);
        if (level2) { Adobe.set('prop3',level2); }
        else { Adobe.set('prop3',null); }

        Adobe.set('hier1',Util.hier(Analytics.options.profile));

        var prevPage = s.getPreviousValue(s.pageName,"s_pv") || '[No Previous Value]';
        if (prevPage) Adobe.set('eVar12',"D=c6");
        if (prevPage) Adobe.set("prop6",prevPage);
        if (prevPage) Adobe.set("prop27",s.getPercentPageViewed());

        var prevURL = s.getPreviousValue(url,"s_pvu") || '[No Previous Value]';
        if (prevURL) Adobe.set('eVar30',prevURL);

        var prevch = s.getPreviousValue(s.channel,"s_pl1") || '[No Previous Value]';
        if (prevch) Adobe.set("prop18",prevch);

        var prevL1 = s.getPreviousValue(s.prop2,"s_pl2") || '[No Previous Value]';
        if (prevL1) Adobe.set("prop19",prevL1);

        var prevL2 = s.getPreviousValue(s.prop3,"s_pl3") || '[No Previous Value]';
        if (prevL2) Adobe.set("prop20",prevL2);
    },

    rebind: function() {
        Analytics._setupFeatureEvents();
        Analytics._setupLinkEvents();
    },

    settings: function(opt) {
        for (var v in opt) {
            Analytics.options[v] = opt[v];
        }
    },

    metadata: function(data) {

        var keys = [];
        for (var k in data) {
          if (data.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
        keys.sort();

        function cleanstr(name) {
            return name.toString().toLowerCase().replace(/ +/g,'-')
        }

        var metastr = [];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          metastr.push(cleanstr(k) + ':' + cleanstr(data[k]))
        }
        metastr = '|' + metastr.join('|') + '|'
 
        Adobe.set("eVar60",metastr);
    },

    save: function(opts) {
        // When page has finished loading, send the data
        // quit if this function has already been called
        var opts = opts || {};
        if (arguments.callee.done && !opts.force) return;
        arguments.callee.done = true;

        // reset the global s variable if someone overwrote it
        window.s = window.adobe_s;

        Analytics._init();

        var endTime = (new Date()).getTime();
        var startTime = User.getStartTime();

        if (startTime > 0) {
            var ltime = endTime-startTime;
            // only count it if it looks legit, else throw an error
            if (User.lasturl == document.referrer) {
               if (ltime > 90000) {
                    Analytics.error("wait90s","wait90s : "+document.location.href);
               } else if (ltime > 60000) {
                    Analytics.error("wait60s","wait60s : "+document.location.href);
               } else if (ltime > 30000) {
                    Analytics.error("wait30s","wait30s : "+document.location.href);
               } else {
                    Adobe.set('prop11',ltime);
               }
            }
            User.clearTimer();
            User.setNewLastURL();
        }

        var u = Analytics.options.url || document.location.href;
        var canonical = null;
        var linkElements = document.getElementsByTagName('link');
        for (var i = 0;i<linkElements.length;i++) {
            if (linkElements[i].getAttribute('rel') == 'canonical' && linkElements[i].getAttribute('href')) {
                canonical = linkElements[i].getAttribute('href');
            }
        }


        //var title = Analytics.options.title || document.title.replace(/^\s+|\s+$/g, '').replace(/[-]?\s*Harvard Business School/gi, '');
        var pageName = Analytics.options.pageName || Util.getPageName(canonical) || Util.getPageName(document.location.href,1);
        Analytics._initPageVars(u,pageName,false);

        var prevProfile = s.getPreviousValue(Analytics.options.profile,"s_pv29") || '[No Previous Value]';
        if (prevProfile) Adobe.set("eVar29",prevProfile);

        // throw a login event if the personID changes
        if (typeof Analytics.options.personID !== 'undefined') {
           var prevUser = s.getPreviousValue(Analytics.options.personID,"s_pu") || '';
           if (Analytics.options.personID && Analytics.options.personID != prevUser) {
               Adobe.appendEvent("event19");
           }
        }

        Util.runQueue(Analytics._preSaveQueue);
        Analytics._presaveQueueEmptied = true;

        if (Analytics._warnings.length == 1) {
            Adobe.appendEvent("event20"); 
            Adobe.set("prop7",Analytics._warnings.join(', '));
        } else if (Analytics._warnings.length > 1) {
            Adobe.appendEvent("event20="+Analytics._warnings.length); 
            Adobe.set("prop7",Analytics._warnings.join(', '));
        }

        var cid = Util.getParam('cid');
        if (cid) { 
            Analytics.campaignStart(cid);
        } else if (Util.getParam('utm_campaign') && Analytics.options.profile != 'exed') {
            var cid = "|";
            var utm_campaign = Util.getParam('utm_campaign');
            if (utm_campaign) cid += "campaign:" + utm_campaign + "|";
            var utm_content = Util.getParam('utm_content');
            if (utm_content) cid += "content:" + utm_content + "|";
            var utm_medium = Util.getParam('utm_medium');
            if (utm_medium) cid += "medium:" + utm_medium + "|";
            var utm_source = Util.getParam('utm_source');
            if (utm_source) cid += "source:" + utm_source + "|";
            var utm_term = Util.getParam('utm_term');
            if (utm_term) cid += "term:" + utm_term;
            cid += "|";
            Analytics.campaignStart(cid);
        }


        if (Analytics._newCampaign) {
            Adobe.set('prop23',Analytics._newCampaign + ':' + pageName);
        } else {
           Adobe.set('prop23',"D=pageName"); // Page Name
        }

        // if we see an event cookie, send it
        var e = Util.getCookie('AnalyticsEvent');
        if (e) {
            if (e.indexOf('event') == 0) {
                Adobe.appendEvent(e); 
            } else {
                Adobe.event(e);
            }
            Util.delCookie("AnalyticsEvent");
        }

        if (User.referrerId) {
            Adobe.set('eVar48',User.referrerId);
            Adobe.appendEvent("event41");
            User.clearReferrerId();
        }
        if (User.linkType) {
            Adobe.set('eVar37',User.linkType);
            User.clearLinkType();
        }

        Adobe.set('eVar41','D=r');  // store referrer in an eVar

        Adobe.trackPage();
      
        // send a noresults event for the search engine
        if (document.getElementById('nodocumentsfound')) {Analytics.event('noresults');}

        // if we see a redirect param, send a redirect event
        var r = Util.getCookie('AnalyticsReferrer');
        if (r) {
            Adobe.set('pageUrl',Util.urlnormalize(r));
            Adobe.set('referrer',Util.urlnormalize(document.referrer));
            Adobe.trackLink();
            Google.each(function(ga){ga._trackPageview(Util.gaPath(r,'redirect'))});
            Util.delCookie("AnalyticsReferrer");
        }

        // run everything in the post save queue
        // 1 second later, if the events arrive at the same time as the first page load
        // then a bug in unica drops them
        analytics._queueTimer = window.setTimeout(function(){Util.runQueue(Analytics._postSaveQueue);Analytics._saveQueueEmptied = true},1500);
    },

    pageView: function(path) {
        var abspath = Util.urlnormalize(Util.absPath(path));
        Adobe.set('referrer',Util.urlnormalize(document.location.href));
        var pageName = Util.getPageName(abspath,1);
        Analytics._initPageVars(abspath,pageName,true);
        Adobe.trackLink(abspath);
    },

    view: function(path,opt) {
        if (!opt) {
            var a = document.createElement('a');
            a.href = path;
            opt={isDownload:Util.isDownload(a),isOffSite:Util.isOffsite(a)};
        }
        if (Analytics._view_seen[path]) {return;} // don't send two views for the same page
        var abspath = Util.urlnormalize(Util.absPath(path));
        if (path) {
            // a view event to another page, with this one as the referral
            Adobe.set('pageURL',abspath);
            Adobe.set('referrer',Util.urlnormalize(document.location.href));
            Google.each(function(ga){ga._trackPageview(Util.gaPath(path,'offsite'))});
        }

        // for offsite links
        if (User.referrerId) {
            Adobe.set('eVar48',User.referrerId);
            Adobe.appendEvent("event41");
            User.clearReferrerId();
        }
        if (User.linkType) {
            Adobe.set('eVar37',User.linkType);
            User.clearLinkType();
        }

        if (opt.isDownload) {
            Adobe.appendEvent('event5');
            var name = Util.getPageName(abspath);
            Adobe.set('eVar5',name);
            Adobe.trackLink('d',name);
        } else if (opt.isOffsite) {
            Adobe.appendEvent('event39');
            Adobe.trackLink('e',abspath);
        } else {
            Adobe.trackLink('o',abspath);
        }
        Analytics._view_seen[path] = true;
        if (opt.sleep) {
            Util.sleep(500);
        }
    },

    warn: function(fn) {
        Analytics._preSave(function(){
            var w = fn();
            if (w) Analytics._warnings.push(w);
        })
    },

    _newCampaign: false,
    _userClicked: false,
    _view_seen: {},
    _warnings: [],
    _stopWatches: {},

    error: function(status,details) {
        if (Analytics._view_seen[status]) return;
        Analytics._view_seen[status] = true;
        if (status === 404) {
            Adobe.set('pageType','errorPage');
            Adobe.set('pageName','');
            Adobe.set('prop10',status);
            Adobe.set('eVar27','D=c10');
            if (document.referrer) {
                details = "404 : " + document.location.href + " from "+document.referrer;
                Adobe.set('eVar58',details);
            }
        } else {
            Analytics._postSave(function(){
                // Tag as error page
                Adobe.set('prop10',status);
                Adobe.set('eVar27','D=c10');
                Adobe.set('eVar58',details);
                Adobe.appendEvent('event12');
                if (Analytics.save.done) {
                    Adobe.trackLink("error");
                }
                window.setTimeout(function(){
                    // clear any error flags
                    Adobe.set('prop10','');
                    Adobe.set('eVar58','');
                    Adobe.set('pageType','');
                    Adobe.set('pageName','');
                },1000);
            })
        }
    },

    // tracking on page errors form the user (eg. form validation)
    userError: function(name) {
        if (name) {
            Adobe.set("prop14",name);
            Adobe.appendEvent("event15");
            if (Analytics.save.done) Adobe.trackLink(name);
        }
    },

    loginFailure: function() {
        Adobe.appendEvent("event31");
        if (Analytics.save.done) Adobe.trackLink();
    },

    addEngagement: function(num) {
        if (typeof num == 'number') {
            Analytics.options.engagement += num;
            Adobe.set("eVar17",Analytics.options.engagement);
        }
    },

    // is passed an array {'header-no-nav':1,'header-dropdown-all':1,'header-dropdown-academic':1} of weighted options
    // and sets a random one
    startTestSegment: function(tests) {
        var test = Util.getCookie("AnalyticsTestSegment");
        if (!tests[test]) test = '';
        if (!test) {
            var testArray = [];
            for (k in tests) {
                for (i = 0;i<tests[k];i++) {
                    testArray.push(k);
                }
            }
            var test = testArray[Math.floor(Math.random()*testArray.length)];
            if (/hbsstg.org/.test(document.location.hostname)) {
                document.cookie = "AnalyticsTestSegment="+test+"; domain=.hbsstg.org; path=/";
            } else {
                document.cookie = "AnalyticsTestSegment="+test+"; domain=.hbs.edu; path=/";
            }
        }
        Analytics.options.testSegment = test;
        return test;
    },

    clearTestSegment: function() {
        var cookie_date = new Date();
        cookie_date.setTime ( cookie_date.getTime() -1 );
        document.cookie = "AnalyticsTestSegment=; expires=" + cookie_date.toGMTString() + "; domain=.hbs.edu; path=/";
        document.cookie = "AnalyticsTestSegment=; expires=" + cookie_date.toGMTString() + "; domain=.hbsstg.org; path=/";
    },

    getTestSegment: function(){
       return Util.getCookie("AnalyticsTestSegment");
    },

    event: function(name) {
        Analytics._postSave(function(){
            if (name) {
                Adobe.set("prop12",name);

                if (name.indexOf('apply-') > -1) Adobe.appendEvent("event21");
                if (name.indexOf('apply2-') > -1) Adobe.appendEvent("event40");
                if (name.indexOf('applypdf-') > -1) Adobe.appendEvent("event22");
                if (name.indexOf('brochurepdf-') > -1) Adobe.appendEvent("event23");
                if (name.indexOf('brochure-request-') > -1) Adobe.appendEvent("event24");
                if (name == 'brochurepdf') Adobe.appendEvent("event33");
                if (name == 'brochure-request') Adobe.appendEvent("event35"); 
                if (name.indexOf('leadgen') > -1) Adobe.appendEvent("event25");                
                if (name == 'newsletter-subscribe') Adobe.appendEvent("event32"); 
                if (name == 'wksignup') Adobe.appendEvent("event32");  // legacy 

                // for mailto link events
                if (User.referrerId) {
                    Adobe.set('eVar48',User.referrerId);
                    Adobe.appendEvent("event41");
                    //User.clearReferrerId(); disable for myhbs stacked events
                }
                if (User.linkType) {
                    Adobe.set('eVar37',User.linkType);
                    //User.clearLinkType(); disable for myhbs stacked events
                }

                Adobe.set('eVar36',Analytics.options.eePersonID);
                Adobe.set('eVar32',Analytics.options.eventID, true);
                Adobe.set('eVar39',Analytics.options.bypassFormCookie);

                Adobe.set("eVar25","D=c12");
                Adobe.appendEvent("event13");
                Adobe.trackLink(name);

                Google.each(function(ga){ ga._trackEvent('event',name) });

            }
        })
    },

    // starts the stopwatch
    mediaPlay: function(mediaName) {
        var sw = Analytics._stopWatches[mediaName];
        if (sw) return; // already played the video
        sw = new StopWatch();
        Analytics._stopWatches[mediaName] = sw;
        sw.start();
    },

    // pauses the startwatch
    mediaPause: function(mediaName) {
        var sw = Analytics._stopWatches[mediaName];
        if (sw) sw.stop();
    },

    // tracks media progress
    mediaMilestone: function(mediaName,milestone) {

        var key = mediaName + milestone
        if (Analytics._view_seen[key]) {return;}
        Analytics._view_seen[key] = 1 

        var sw = Analytics._stopWatches[mediaName] || new StopWatch();
        Adobe.set("eVar19",mediaName);
        Adobe.set("prop24","D=v19");
        Adobe.appendEvent("event18="+sw.duration());
        Adobe.set("eVar49",sw.duration());
        Adobe.set("eVar50","page");
        if (milestone >= 100) Adobe.appendEvent("event8");
        else if (milestone >= 75) Adobe.appendEvent("event11");
        else if (milestone >= 50) Adobe.appendEvent("event10");
        else if (milestone >= 25) Adobe.appendEvent("event9");
        else Adobe.appendEvent("event7");
        Adobe.trackLink("media-milestone");
    },

    // tracks search
    search: function(query,numresults,refiners) {
        Analytics._preSave(function(){
            refiners = refiners || [];
            var refinerstr = refiners.join(' > ');
            var refinerNames = [];
            for (var i = 0;i<refiners.length;i++){
                var n = refiners[i].split(/\s*:\s*/)[0];
                if (n) refinerNames.push(n)
            }  
            var term = query + refinerstr;
            if (s.getValOnce(term,"s_qt")) {
                Adobe.set('prop4',query);
                Adobe.set('eVar57',refiners.length);
                Adobe.set('eVar2','D=c4');
                if (refiners.length > 0) {
                    Adobe.set('list1',unescape(refiners.join('|').replace(/,/g,'').replace(/\|/g,','))); // individual queries
                    Adobe.set('prop21',unescape(refinerstr));  // pathing
                    Adobe.set('list3',unescape(refinerNames.join(','))); // individual queries
                }  
                if (numresults == 0) {
                    Adobe.set('eVar3','no search results');
                    Adobe.appendEvent('event2');
                } else if (numresults > 0) {
                    Adobe.set('eVar3',numresults);
                }
                Adobe.appendEvent('event1');
                if (query) {
                    // search
                    Adobe.appendEvent('event37');
                } else {
                    // browse
                    Adobe.appendEvent('event38');
                }
            } 
            if (Analytics._presaveQueueEmptied) Adobe.trackLink();
        })
    },
   
    onerror: function(errorMsg, url, lineNumber){
        var msg = ''
        if (typeof url === 'string') {
            if (url) msg = ' : '+Util.filename(url);
            if (lineNumber > 0) msg = msg + ':' + lineNumber
            Analytics._postSave(function() {
                msg = 'jserror'+ msg;
                Analytics.error(msg,msg + ' : ' + document.location.href  + " : " + errorMsg + " on " + Util.getBrowser());
            });
        }
    },

    itg: function(v) {
        // deprecated
    },

    campaignStart: function(cid,mktchannel) {
        var s = window.s;
        cid = Util.trim(cid.toLowerCase());
        User.setCampaign(cid);
        Analytics._newCampaign = cid;
        cid = s.getValOnce(cid,"s_co");
        //if (mktchannel) Adobe.set("prop16",mktchannel);
        if (cid) s.campaign = cid.toLowerCase();
        /*
        - the s.campaign value is the value that is being stacked
        - the s_v value is the cookie that the value will be stored in
        - the 30,60,90,etc. number listed how long the cookie's expiration is
        - the 9 is the number of campaign values it will store in the list
        - the > is the delimiter value
        - the 1 is to show whether consecutive duplicate values will be stored (we are saying yes as it is a true reflection of the user's intent)
        */
        if (s.campaign) {
            s.eVar33=s.crossVisitParticipation(s.campaign, "s_v33", "365", "9", ">", "", 1); // campaign stack
            s.eVar34=s.campaign; // first touch
            s.eVar35=s.campaign; // last touch
        }
        if (mktchannel) {
            s.eVar40=s.crossVisitParticipation(mktchannel.toLowerCase(), "s_v40", "365", "9", ">", "", 1); // campaign stack
        }
    },

    campaignEnd: function() {
        User.clearCampaign();
        Util.delCookie('s_v33');
        Util.delCookie('s_v40');
    },

    surveyCompleted: function(name,val) {
        Analytics._postSave(function() {
            if (name && val) {
                Adobe.appendEvent("event34"); 
                Adobe.set("eVar46",name);
                Adobe.set("eVar47",name + ' = ' + val)
                Adobe.trackLink(name);
            }
        });
    },

    conversion: function(name) {
        Analytics._postSave(function() {
            Analytics.event(name);
        });
    },

    autoCompleteClick: function(link,query){
         var a;
         if (typeof link.href == "string") {
            a = link;
         } else {
            var a = document.createElement('a');
            a.href = link;
         }
         a.rel = 'search-result'
         analytics._linkClick.apply(a);
         if (query) analytics.search(query);
    },

    _postSaveQueue: [],
    _saveQueueEmptied: false,
    _postSave: function(action) {
        if (Analytics._saveQueueEmptied) {
            action();
        } else {
            Analytics._postSaveQueue.push(action);
        }
    },

    _preSaveQueue: [],
    _presaveQueueEmptied: false,
    _preSave: function(action) {
        if (Analytics._presaveQueueEmptied) {
            action();
        } else {
            Analytics._preSaveQueue.push(action);
        }
    },

    _runAsyncQueue: function(){
        // clear the async queue
        window._analytics = window._analytics || [];
        for (var x = 0;x<window._analytics.length;x++) window._analytics[x]();
        window._analytics = [];
    },

    _setupLinkEvents: function() {
        var alllinks = document.getElementsByTagName("a");
        for (var i=0,il=alllinks.length;i<il;i++) {
            var el = alllinks[i];
            if (typeof el.analyticsClickBind == 'undefined') {
                Util.addEvent(el,'mousedown',Analytics._featureClick);
                Util.addEvent(el,'mousedown',Analytics._linkClick);
                el.analyticsClickBind = true;
            }
        }
    },

    _storageEnabled: function(){
        try {
            if (typeof sessionStorage == "undefined") return false;
            sessionStorage.setItem('test-key','test-value');
            if (sessionStorage.getItem('test-key') == 'test-value'){
                return true;
            }
        } catch (e) {};
        return false;
    },

    _setupFeatureEvents: function(){
        if (Analytics._storageEnabled() && document.querySelectorAll) {
            var allfeatures = document.querySelectorAll("[data-feature]");
            for (var i=0,il=allfeatures.length;i<il;i++) {
                var el = allfeatures[i];
                if (typeof el.analyticsFeatureBind == 'undefined') {
                    Util.addEvent(el,'mousedown',Analytics._featureClick);
                    el.analyticsFeatureBind = true;
                }
                Analytics._hasFeatures = true;
            }
            Analytics._sendFeatureTree();
        }
    },

    _featureClick: function(){
        if (typeof this.href != "string") return;
        if (!Analytics._featuresCollected && Analytics._hasFeatures) {
            var tree = Analytics._featureTree(this);
            for (var i = 0; i<tree.length;i++) {
                var treekey = "feature-analytics :: "+Analytics.options.site+ ',' +Analytics.options.profile+' :: ' + tree[i];
                sessionStorage.setItem(treekey,0);
            }
            Analytics._featuresCollected = 1;
            window.setTimeout(function(){Analytics._featuresCollected = 0;},100);
        }
    },

    _featureTree: function(el) {
        var tree = [];
        var parents = [];
        var a = el;
        while (a && a.getAttribute) {
            parents.push(a);
            a = a.parentNode;
        }
        for (var i = 0; i< parents.length; i++) {
           var feature = parents[i].getAttribute('data-feature');
           if (feature) tree.push(feature);
        }
        tree.reverse();
        var results = [];
        for (var j = 0; j < tree.length; j++) {
            results.push(tree.slice(0,j+1).join('>').toLowerCase());
        }
        return results;
    },

    _sendFeatureTree: function(){
        var results = [];
        for(var i = 0;i<sessionStorage.length;i++){
            var k = sessionStorage.key(i);
            var v = sessionStorage.getItem(k);
            if (v === "0" && k.indexOf('feature-analytics :: '+ Analytics.options.site + ',' + Analytics.options.profile + ' :: ') > -1) {
                var fk = k.substring(('feature-analytics :: '+ Analytics.options.site + ',' + Analytics.options.profile + ' :: ').length);
                results.push(fk.replace(';',','));
                sessionStorage.setItem(k,1);
            }
        }
        if (results.length > 0) {
           Adobe.set("list2",results.join(","));
        }
    },

    _checkImages: function(){
        if (Analytics._userClicked) return;
        var allimages = document.getElementsByTagName("img");
        for (var i=0,il=allimages.length;i<il;i++) {
            var img = allimages[i];
            if (!Util.imageOk(img)) {
                var msg = "img404 : "+ Util.filename(img.src);
                Analytics.error(msg,msg + ' : ' + document.location.href);
            }
        }
    },

    // checks if the onload event takes more than 30 sec
    _checkLoadTime: function(){
       var loadTime = (new Date()).getTime();
       var ltime = loadTime - Analytics.startTime;
       if (ltime > 90000) {
           Analytics.error("onload90s","onload90s : "+document.location.href);
       } else if (ltime > 60000) {
           Analytics.error("onload60s","onload60s : "+document.location.href);
       } else if (ltime > 30000) {
           Analytics.error("onload30s","onload30s : "+document.location.href);
       }
    },

    _linkClick: function() {
        if (typeof this.href != "string") return;

        var a = this;
        var options = {};
        options.sleep = true;
        options.isDownload = Util.isDownload(a);
        options.isOffsite = Util.isOffsite(a);
        Analytics._userClicked = true; // prevent the checking of images 404
        if (a.getAttribute('data-link-id') || a.id) {
            // remember the link name for reporting
            User.setReferrerId(a.getAttribute('data-link-id') || a.id);
        }
        if (a.getAttribute('data-rel') || a.getAttribute('rel')) {
            // remember the link type for reporting
            var t = a.getAttribute('data-rel') || a.getAttribute('rel');
            t = t.replace(/^\s+|\s+$/gm,'');  // trim
            if (t) {
                User.setLinkType(t);
            }
        }
        if (a && a.href && a.href.indexOf('mailto:') == 0) {
            Analytics.event('mailto');
        }
        // queue event on next page
        if (a.rel && a.rel.indexOf('search-result') > -1) {
            var cookie_date = new Date ();
            cookie_date.setTime ( cookie_date.getTime() + (1000 * 20) );  // 20 sec
            document.cookie = "AnalyticsEvent=event14 ; expires=" + cookie_date.toGMTString() + "; domain=.hbs.edu; path=/";
        }
        if (a.rel && a.rel.indexOf('bestbet') > -1) {
            var cookie_date = new Date ();
            cookie_date.setTime ( cookie_date.getTime() + (1000 * 20) );  // 20 sec
            document.cookie = "AnalyticsEvent=event36 ; expires=" + cookie_date.toGMTString() + "; domain=.hbs.edu; path=/";
        }
        if (options.isDownload || options.isOffsite) {
            if (Util.isLink(a)) {
                Analytics._sendFeatureTree();
                Analytics.view(a.href,options);
            }
        }
    },

    set: function(k,v) {
        //  old function, not needed
    },

    reset: function() {
        Adobe.reset();
        Util.delCookie("s_qt"); //search cookie
        Analytics.save.done = false;
        Analytics._saveQueueEmptied = false;
        Analytics._postSaveQueue = [];
        window.clearTimeout(analytics._queueTimer);
    },

    _isSecurePageTag: function() {
        return ("https:" == document.location.protocol);
    }

};


var Adobe = {
    // these 3 variables are kept around for unit testing
    _pairs:{},
    _tagsent: 0,
    s: null,
    queue: {},

    init: function(options,user){
        Adobe.s = window.s;
        Adobe.s.account = Adobe.getAccount(options,user);
        Adobe.s.un = Adobe.s.account;
        for (var key in Adobe.queue) {
            Adobe.set(key,Adobe.queue[key]);
            delete Adobe.queue[key];
        }
    },

    set: function(name,val,caseSensitive) {
        if (typeof val === 'string' && val.indexOf('D=') != 0) {
            if (caseSensitive) {
                val = Util.trim(val);
            } else {
                val = Util.trim(val.toLowerCase());
            }
        }
        Adobe._pairs[name] = val;
        if (Adobe.s) {
            Adobe.s[name] = val;
        } else {
            Adobe.queue[name] = val;
        }
    },
   
    getAccount: function(options,user) {
        // a dev site
        var account = 'qadev';
       
        var profile = options.profile;
        if (Analytics.options.lastprofile && user.lastprofile) {
            profile = user.lastprofile;
        }

        // a live site
        if (Util.arrayContains(Util.toArray(options.prod),options.site) && !user.isAdmin()) {
            if (profile && profile.indexOf('intranet') > -1) {
                account = 'intranet';
            } else {
                account = 'public';
            }
        }

        if (options.rsid) return 'HBS' + options.rsid;
        return 'HBS' + account;
    },
   
    // normal page view
    trackPage: function(){
        Adobe.s.t();
        Adobe.clearEvents();
        Adobe._tagsent++;
    },
   
    // intrapage view
    trackLink: function(type,name,callback) {
        type = type || 'o';
        name = name || 'None';
        name = name.toLowerCase();
        if (callback) {
            Adobe.s.tl(true,type,name,null,callback);
        } else {
            Adobe.s.tl(true,type,name,null);
        }
        Adobe.clearEvents();
        Adobe._tagsent++;
    },

    appendEvent: function(ev) {
        var events = Adobe.s.events ? Adobe.s.events.split(',') : []
        if (!Util.arrayContains(events,ev)) {
            events.push(ev);
            Adobe.set('events',events.join(','));
        }
    },

    clearEvents: function(){
        // clear things we don't want sent multiple times
        Adobe.set('events',null);
        Adobe.set('list1',null);
        Adobe.set('list2',null);
        Adobe.set('eVar3',null);
        Adobe.set('prop4',null);
        Adobe.set('prop12',null);
        Adobe.set('prop21',null);
        Adobe.set('eVar25',null);
        Adobe.set('evar37',null);
        Adobe.set('evar48',null);
        Adobe.set('eVar57',null);
    },

    reset: function() {
        Adobe._tagsent = 0;
        Adobe._pairs = {};
    }

}


var Google = {   
    each: function(fn) {
        Util.arrayEach(Analytics.options.gaTrackers,function(ga){
            fn(ga)
        });
    }
}

var User = {
   role: null,
   roleDetail: null,
   startTime: 0,
   campaign: "None",
   referrerId: null,
   lastPageName: null,

   cached: ['role','roleDetail','campaign','lastprofile','lastsite','lasturl','startTime','referrerId','linkType'],   

   init: function() {
     arguments.callee.done = true

     User.load()
     User._getOverrides(); 

     // run everything in the post init queue
     Util.runQueue(User._postInitQueue)
   },

   setCampaign: function(cid) {
     User._postInit(function() {
        User.campaign = cid;
        User.store();
     });
   },

   clearCampaign: function() {
     User.campaign = "None";
     User.store();
   },

   setReferrerId: function(id) {
     User.referrerId = id;
     User.store();
   },

   clearReferrerId: function() {
     User.referrerId = null;
     User.store();
   },

   setLinkType: function(id) {
     User.linkType = id;
     User.store();
   },

   clearLinkType: function() {
     User.linkType = null;
     User.store();
   }, 
   
   startTimer: function() {
     var start = (new Date()).getTime();
     User.startTime = start;
     User.store();
   },

   setNewLastURL: function(){
     if (User.lasturl != document.location.href) {
         User.lasturl = document.location.href;
         User.store();
     }
   },

   clearTimer: function() {
     User.startTime = 0;
     User.store();
   },

   getStartTime: function() {
      return parseInt(User.startTime,10);
   },

   isAdmin: function() {
      if (Analytics.options.siteAdmins) {
        var params = Analytics.options.siteAdmins;
        for (var v in params) {
           if (User[v] && Util.arrayContains(Util.toArray(params[v]),User[v]) ) {
              return true;
           }
        }
      }
      return false;
   },

   _postInitQueue: [],
   _postInit: function(action) {
       if (User.init.done) {
         action();
     } else {
         User._postInitQueue.push(action);
     }
   },

   userdataCallback: function(vars) {
        console.info("deprecated userdataCallback")
   },

   isValid: function(key,val) {
      if (key == "role") {
         if (  Util.arrayContains(Analytics.options.validator.role,val)   ) {
            return true;
         }
         return false;
      }
      return true;
   },

   _getOverrides: function() {
     var forcedRole = Util.getCookie("AnalyticsForceRole");
     var forcedRoleDetail = Util.getCookie("AnalyticsForceRoleDetail");
     if (forcedRole && User.isValid("role",forcedRole)) {
         User.role = forcedRole;
         if (forcedRoleDetail && User.isValid("roleDetail",forcedRoleDetail)) {
            User.roleDetail = forcedRoleDetail;
         } else {
            User.roleDetail = forcedRole;
         }
     }
   },

   _getIdFromCookie: function() {
     var hbscookie = Util.getCookie("HBSCOOKIE");
     if (/:/.test(hbscookie)) {
        return hbscookie.split(":")[0];
     } else {
        return null;
     }
   },

   _getRolesFromCookie: function() {
   
     var hbscookie = Util.getCookie("HBSAnalytics");
     var klass = User._getClassFromCookie(hbscookie);
     var decade = User._getDecadeFromClass(klass);
     
     if (/AL/.test(hbscookie) && decade) {
        return ["Alumni",decade];
     } else if (/AL/.test(hbscookie)) {
        return ["Alumni","Exed Alum"];
     } else if (/^hbs.edu/.test(hbscookie) && /DS/.test(hbscookie)) {
        return ["Doctoral","Doctoral"];
     } else if (/^hbs.edu/.test(hbscookie) && /FA/.test(hbscookie)) {
        return ["Faculty","Faculty"];
     } else if (/^hbs.edu/.test(hbscookie) && /FE/.test(hbscookie)) {
        return ["Faculty","Faculty"];
     } else if (/^hbs.edu/.test(hbscookie)) {
        return ["Staff","Staff"];
     } else if (/mba/.test(hbscookie) && klass) {
        return ["MBA","MBA "+klass];
     } else if (/exed.hbs.edu/.test(hbscookie)) {
        return ["Exed","Exed"];
     } else if (/public/.test(hbscookie)) {
        return ["External","Public"];
     } else if (/crossreg/.test(hbscookie)) {
        return ["External","Crossreg"];
     } else if (/partners/.test(hbscookie)) {
        return ["External","Partners"];
     } else if (/guest/.test(hbscookie)) {
        return ["External","Guest"];
     } else {
        return false;
     }
   },
   
   _getClassFromCookie: function(cookie) {
     var rx = new RegExp('mba(\\d+)');
     var m = cookie.match(rx);
     if (m && m[1]) {
        return m[1];
     } else {
        return '';
     }
   },

   _getDecadeFromClass: function(klass) {
     var rx = new RegExp('(\\d\\d\\d)\\d');
     var m = klass.match(rx);
     if (m && m[1]) {
        return "MBA "+m[1]+"0s";
     } else {
        return '';
     }
   },

   load: function() {
     // load user parameters from a cookie cache
     // if the user isn't logged in, this still works

     var datastr = Util.getCookie("AnalyticsData");

     // flush cookie if it's an old version
     if (Util.getParam('v',datastr) != Analytics.version) {return false;}

     var hasData = false;
     for (var i=0;i<User.cached.length;i++) {
        var key = User.cached[i];
        var val = Util.getParam(key,datastr);
        if (val) {
           User[key] = val;
           hasData = true;
        }
     }

     var roles = User._getRolesFromCookie();
     if (roles) {
         // if it is in the cookie, then use that
         if (User.role != roles[0] || User.roleDetail != roles[1]) {
             // if it is different, then store it
             User.role = roles[0];
             User.roleDetail = roles[1];
             User.store();
         }
     } else if (User.role) {
         // use what is in the cache
     } else {
         User.role = "External"
         User.roleDetail = "Non HBS";
     }

     return hasData;
   },

   store: function() {
     // save user parameters into a cookie
     var s=[];
     for (var i=0;i<User.cached.length;i++) {
        var key = User.cached[i];
        var val = User[key];
        if (val !== null) {
           val = val + ""; // convert to string
           val = val.replace(' ','%20');
           val = val.replace(';','%3B');
           val = val.replace(',','%2C');
           val = val.replace('&','%26');
           s.push(key+"="+val);
        }
     }
     s.push("v="+Analytics.version);
     var v = s.join("&");
     var cookie_date = new Date();
     cookie_date.setTime ( cookie_date.getTime() + (1000*60*60*24*30*6) ); // 6 months
     document.cookie = "AnalyticsData="+escape(v)+"; domain=.hbs.edu; path=/; expires="+cookie_date.toGMTString();
   }
   
};

function StopWatch(){
  this.startTime = null;
  this.stopTime = null;
  this.running = false;
}

StopWatch.prototype.getTime = function(){
  var day = new Date();
  return day.getTime();
};

StopWatch.prototype.start = function(){
    if (!this.running) {
       this.startTime = this.getTime();
    }
    this.running = true;
};

StopWatch.prototype.stop = function(){
    if (this.running) {
        this.stopTime = this.getTime();
    } else {
        this.stopTime = null;
    }
    this.running = false;
};

StopWatch.prototype.reset = function(){
    this.startTime = this.getTime();
};

StopWatch.prototype.duration = function(){
     if (!this.startTime) return 0;
     var t = this.stopTime || this.getTime();
     return Math.floor((t - this.startTime)/1000);
};

function PathParser(options,url){
   this.baseUrl = options.baseUrl || '/';
   this.url = url.replace(/[\?#].*/g,'');
}

PathParser.prototype.split = function(){
   var a = document.createElement('a');
   a.href = this.url.toLowerCase();
   var results = {};
   results.path = a.href.split(document.location.hostname+this.baseUrl.toLowerCase())[1];

   if (!results.path) {
      results.folders = [];
      return results;
   }

   if (results.path.indexOf('/') !== 0) results.path = '/'+results.path;
   results.dirname = results.path.replace(/\/(Pages|Documents|Lists|SitePages|_layouts)/i,'').replace(/[^/]*$/,'');
   var dirstr = results.dirname.replace(/^\//,'').replace(/\/$/,'').toLowerCase();
   results.folders = [];
   if (dirstr !== '') {
      results.folders = dirstr.split('/');
   }
   results.filename = results.path.replace(results.dirname,'');
   return results;
};

PathParser.prototype.folder = function(start,end) {
   var a = this.split();
   if (end === undefined) end = start;
   var results = [];
   for (var i = start; i<=end;i++) {
      if (a.folders[i] !== undefined) results.push(a.folders[i]);
   }
   return unescape(results.join(' : '));
};


var Util = {
    getCookie: function(cookiename) {
        var cookiestring=""+document.cookie;
        var index1=cookiestring.indexOf(cookiename);
        if (index1==-1 || cookiename==="") return "";
        var index2=cookiestring.indexOf(';',index1);
        if (index2==-1) index2=cookiestring.length;
        return unescape(cookiestring.substring(index1+cookiename.length+1,index2));
    },
    
    delCookie: function(cookiename) {
        var cookie_date = new Date ();  // current date & time
        cookie_date.setTime ( cookie_date.getTime() - 1 );
        document.cookie = cookiename+"=; expires=" + cookie_date.toGMTString() + "; domain=.hbs.edu; path=/";
        document.cookie = cookiename+"=; expires=" + cookie_date.toGMTString() + "; path=/";
    },

    setCookie: function(name, val, date, path) {
        var cookie = name+"="+escape(val);
        if (date) {
            cookie += "; expires=" + date.toGMTString();
        }
        if (path) {
           cookie += "; path="+path;
        } else {
           cookie += "; path=/";
        }
        document.cookie = cookie;
    },
   
    urlnormalize: function(u) {
        u = u.replace(/\/index\.(shtml|html|htm|jsp)$/,'/');
        u = u.replace(/\/index\.(shtml|html|htm|jsp)\?/,'/?');
        return u;
    },

    getBrowser: function(){
        var ua = navigator.userAgent.toLowerCase();
        if (/ipad/.test(ua)) return 'mobile safari';
        if (/iphone/.test(ua)) return 'mobile safari';
        if (/android/.test(ua)) return 'android browser';
        if (/chrome/.test(ua)) return 'google chrome';
        if (/msie (\d+)/.test(ua)) return 'microsoft internet explorer '+RegExp.$1;
        if (/trident.+rv:(\d\d)/.test(ua)) return 'microsoft internet explorer '+RegExp.$1;
        if (/firefox/.test(ua)) return 'mozilla firefox';
        if (/safari/.test(ua)) return 'safari';
        if (/mobile/.test(ua)) return 'other mobile';
        return 'other';
    },

    getOS: function(){
        var ua = navigator.userAgent.toLowerCase();
        if (/ipad/.test(ua)) return 'ios';
        if (/ipod/.test(ua)) return 'ios';
        if (/iphone/.test(ua)) return 'ios';
        if (/windows phone/.test(ua)) return 'windows phone';
        if (/windows nt 6\.3/.test(ua)) return 'windows 8';
        if (/windows nt 6\.2/.test(ua)) return 'windows 8';
        if (/windows nt 6\.1/.test(ua)) return 'windows 7';
        if (/windows nt 5\.1/.test(ua)) return 'windows xp';
        if (/windows/.test(ua)) return 'windows other';
        if (/macintosh/.test(ua)) return 'osx';
        if (/bb\d\d/.test(ua)) return 'blackberry';
        if (/blackberry/.test(ua)) return 'blackberry';
        if (/rim/.test(ua)) return 'blackberry';
        if (/android/.test(ua)) return 'android';
        return 'other';
    },

    getReferringDomain: function(){
       if (!document.referrer) return '';
       var r = document.referrer.toLowerCase();
       r = r.replace('https://','');
       r = r.replace('http://','');
       r = r.split('/')[0];
       r = r.replace('www.','');
       r = r.replace(/:\d+/,'');
       if (r == document.location.hostname) return '';
       return r;
    },

    getReferringSearchEngine: function(){
       if (!document.referrer) return '';
       var r = document.referrer.toLowerCase();
       if (/google/.test(r)) return 'google';
       if (/bing/.test(r)) return 'bing';
       if (/search\.yahoo/.test(r)) return 'yahoo';
       if (/search\.aol/.test(r)) return 'aol';
       return '';
    },

    getParam: function(param,paramStr) {
        // gets a parameter value from the query string
        var query = paramStr || window.location.search.substring(1);
        var parms = query.split('&');
        for (var i=0; i<parms.length; i++) {
           var pos = parms[i].indexOf('=');
           if (pos > 0) {
              var key = parms[i].substring(0,pos);
              var val = parms[i].substring(pos+1);
              val = val.replace(/\+/g,' ');
              if (key == param) {
                return unescape(val);
              }
           }
        }
        return null;
    },

    // a query param function for URLs
    getQueryParam: function (param,paramStr,defaultVal) {
       if (paramStr.indexOf('?') > -1) paramStr = paramStr.substring(paramStr.indexOf('?') + 1);
       return Util.getParam(param,paramStr) || defaultVal || null;
    },

    addQueryParam: function(param,val,url) {
        if (url.indexOf('?') > -1) {
            return url + '&' + param + '=' + escape(val);
        } else {
            return url + '?' + param + '=' + escape(val);
        }
    },

    absPath: function(path) {
       // converts a relative path into an absolute one
       if (/^http/.test(path)) {
          return path
       } else if (/^\//.test(path)) {
          var p = document.location.protocol;
          var h = document.location.host;
          return p+"//"+h+path
       } else {
          var tmp = document.createElement('a');
          tmp.href = path;
          return tmp.href;
       }
    },

    runQueue: function(q) {
        for(var x=0;x<q.length;x++) {
            var f = q[x]; 
            f();
        }
    },
    
    imageOk: function(img){
        if (!img.src) {return true;}
        if (img.src.indexOf('data:') > -1) return true;
        if (!img.complete) {return false;}
        if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {return false;}
        return true;
    },

    hier: function(i){
        var indexOf = function(obj,array) {
             for (var i = 0, j = array.length; i < j; i++) {
                 if (array[i] === obj) { return i; }
             }
             return -1;
        };

        var path = document.location.pathname;
        path = path.toLowerCase();
        var hier = path.split('/');
        var index = indexOf('pages',hier); 
        if (index > -1) hier.splice(index, 1);
        index = indexOf('pages',hier); 
        if (index > -1) hier.splice(index, 1);
        hier.shift(); hier.pop(); // remove first and last elements
        hier.unshift(document.location.hostname.replace('.hbs.edu','').replace('www.',''));
        return hier.join(',')
    },

    obfuscate: function(s) {
       function cipher(x) {
           return x.replace(/[a-zA-Z]/g, function(c){
                  return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
           });
           
       }
    
       if (s.indexOf("@") > -1) {
          var parts = s.split("@",2)
          return cipher(parts[0]) + "@" + parts[1];
       } else {
          return cipher(s);
       }
    },

    gaPath: function(url,prefix) {
        // tries to remove this hostname, if its not removable, put in a prefix
        var r = "^https?://"+document.location.host+"[:0-9]*/";
        if (/^\//.test(url)) {
            return url
        } else if (RegExp(r).test(url)) {
            return url.replace(RegExp(r),'/')  
        } else {
            return "/"+prefix+"/"+url
        }
    },

    addEvent: function( obj, type, fn ) {
        // javascript events (not page events)
        if ( obj.addEventListener ) {
            obj.addEventListener( type, fn, false );
        } else if ( obj.attachEvent ) {
            obj.attachEvent('on'+type, function() {
               //call funct with 'this' == 'element'
               return fn.apply(obj);
            });
        } 
    },

    sleep: function (sleeptime){
        var sleeping = true;
        var now = new Date();
        var alarm;
        var startingMSeconds = now.getTime();
        while(sleeping){
           alarm = new Date();
           alarmMSeconds = alarm.getTime();
           if(alarmMSeconds - startingMSeconds > sleeptime){ sleeping = false; }
        }
    },

    getPageName: function(url,removeQuery) {

        if (!url) return url;
        var pageName = url.replace(/^https?:\/\//,'');  // remove http

        if (removeQuery) {
            pageName = pageName.replace(/\?.*?$/,'');  // remove queries
            for (var i = 0; i<analytics.options.pageParams.length;i++){
                var name = analytics.options.pageParams[i];
                var val = Util.getQueryParam(name,url);
                if (val) {
                    pageName = Util.addQueryParam(name,val,pageName);
                }
            }
        }
        pageName = pageName.replace(/#.*?$/,'');  // remove anchors
        pageName = pageName.toLowerCase();   // remove case
        pageName = pageName.replace(/\/pages\/default\.aspx$/,"/");
        pageName = pageName.replace(/\/index\.html?$/,"/");
        pageName = pageName.replace(/\/index\.jsp$/,"/");
        pageName = pageName.replace('//','/');   // remove double slashes from poor coding
        return pageName;
    },
    
    isDownload: function(a) {
        if(!a || !a.href){return false;}
        if (typeof a == "string") {
            var tmp = document.createElement('a');
            tmp.href = a
            a = tmp;
        }
        if(a.className && a.className.indexOf('download') > -1) {return true;}
        if(a.rel && a.rel.indexOf('download') > -1) {return true;}
        var link = a.href.replace(/\?.*/,'');
        if (link && link.match(/\.(pdf|docx?|mov|zip|exe|dmg|mp3|xlsx?|jpg|gif|mmap|pptx?|m4v)$/)) {
           return true;
        }
        link = a.href;
        if (link && link.match(/\.(pdf|docx?|mov|zip|exe|dmg|mp3|xlsx?|jpg|gif|mmap|pptx?|m4v)$/)) {
           return true;
        }
        return false;
    },

    isOffsite: function(a) {
        if(!a || !a.href){return false;}
        if (typeof a == "string") {
            var tmp = document.createElement('a');
            tmp.href = a
            a = tmp;
        }
        if(a.className && a.className.indexOf('offsite') > -1) {return true;}
        if(a.rel && a.rel.indexOf('offsite') > -1) {return true;}
        if(a.className && a.className.indexOf('onsite') > -1) {return false;}
        if(a.rel && a.rel.indexOf('onsite') > -1) {return false;}
        var thisdomain = document.location.host.replace(/:\d+/,'');
        var linkdomain = a.host.replace(/:\d+/,'');
        if (linkdomain && linkdomain != thisdomain) {
           return true;
        } else {
           return false;
        }
    },

    isLink: function(a) {
        if(!a || !a.href){return false;}
        if (/^https?:/.test(a.href)) {
           return true
        } else {
           return false;
        }
    },

    touchScreen: function(){
        var a='touch screen',b='non-'+a;
        if('createTouch' in document) {return a}
        else {return b}
    },

    screenOrientation: function(){
        if (!window.matchMedia) return 'landscape';
        var a=window.matchMedia('(orientation: portrait)');
        if(a.matches){return'portrait'}
        else{return'landscape'}
    },

    searchEngineRank: function(ref){
        var s=window,r=ref?ref:document.referrer.toString(),n='',q;
        if(r.indexOf('google.com')>-1){q=Util.getParam('start',r);n=q?q:0;n='Google: '+((n/10)+1);}
        if(r.indexOf('bing.com')>-1){q=Util.getParam('first',r);n=q?q:1;n='Bing: '+((n-1)/10+1);}
        if(r.indexOf('yahoo.com')>-1){n=Util.getParam('pstart',r);n=q?q:1;n='Yahoo: '+((n-1)/10+1);}
        return n;
    },

    filename: function(url) {
        if (!url) return '';
        return url.substring(url.lastIndexOf('/') + 1);
    },

    timestamp: function(full) {
      var date = new Date();
      var day = date.getDate();
      day = (day < 10) ? ("0" + day) : day;
      var month = date.getMonth() + 1;
      month = (month < 10) ? ("0" + month) : month;
      var year = date.getFullYear();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      if (full) strTime = year + '-' + month + '-' + day + ' ' + strTime;
      return strTime;
    },

    getNewRepeat: function(d,cn,path) {
        var s=Adobe.s,e=new Date(),cval,sval,ct=e.getTime();
        d=d?d:30;
        cn=cn?cn:'s_nr';
        e.setTime(ct+d*24*60*60*1000);
        cval=Util.getCookie(cn);
        if(cval.length==0) {
          Util.setCookie(cn,ct+'-New',e,path);
          return'New';
        }
        sval=s.split(cval,'-');
        if(ct-sval[0]<30*60*1000&&sval[1]=='New') {
          Util.setCookie(cn,ct+'-New',e,path);
          return'New';
        } else {
          Util.setCookie(cn,ct+'-Repeat',e,path);
          return'Repeat';
        }
    },

    getVisitNum: function(profile,path){
        var s=this,e=new Date(),cval,cvisit,ct=e.getTime(),c='s_vnum'+profile,c2='s_invisit'+profile;
        e.setTime(ct+30*24*60*60*1000);
        cval=Util.getCookie(c);
        if(cval){
            var i=cval.indexOf('&vn='),str=cval.substring(i+4,cval.length),k;
        }
        cvisit=Util.getCookie(c2);
        if(cvisit) {
            if(str){
                e.setTime(ct+30*60*1000);Util.setCookie(c2,'true',e,path);
                return str;
            } else return 'unknown visit number';
        } else { 
            if(str){
                str++;
                k=cval.substring(0,i);
                e.setTime(k);
                Util.setCookie(c,k+'&vn='+str,e,path);
                e.setTime(ct+30*60*1000);
                Util.setCookie(c2,'true',e,path);
                return str;
            } else {
                Util.setCookie(c,ct+30*24*60*60*1000+'&vn=1',e,path);
                e.setTime(ct+30*60*1000);
                Util.setCookie(c2,'true',e,path);
                return 1;
            }
        }
    },

    baseHref: function() {
       var base = document.getElementsByTagName('base');
       var href = ''
       for (var i=0;i<base.length;i++) {
          if (base[i].href) { href = base[i].href; }
       }
       if (href) {
         var re = new RegExp("([a-z.]+\.hbs\.edu)")
         var m = href.match(re);
         if (m && m[1]) return m[1];
       }
       return href;
    },

    arrayContains: function(arr,val) {
        var len = arr.length;
        for (var i = 0; i < len; i++){
           if(arr[i]===val){ return true;}
        }
        return false;
    },
    
    toArray: function(val) {
       if (typeof(val) == typeof(Array())) {
           return val;
       }
       return [val];
    },    

    trim: function(str){
       return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },
    
    arrayEach: function(arr,fn) {
        var len = arr.length;
        for (var i = 0; i < len; i++){
           fn(arr[i]);
        }
    },

    arrayEqual: function(a1,a2) {
        var a1len = a1.length;
        var a2len = a2.length;
        if (a1len != a2len) {return false;}
       
        for (var i=0;i<a1len;i++) {
            for (var j=0;j<a2len;j++) {
               if (a1[i] != a2[j]) {return false;}
            }
        }
        return true;
    }

}


window.analytics = Analytics;
window.analytics.user = User;
window.analytics.adobe = Adobe;
window.analytics.google = Google;
window.analytics.path = new PathParser(analytics.options,document.location.href);
window.analytics.PathParser = PathParser;
window.analytics.util = Util;
Util.addEvent(window,'load',Analytics.save)
Util.addEvent(window,'load',function(){
    window.setTimeout(Analytics._checkImages,5000);
});
Util.addEvent(window,'load',Analytics._checkLoadTime);
if (!window.onerror) window.onerror = Analytics.onerror;
Analytics._preinit();

})();  // End Analytics module









if (!window.s) {
/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ============

 Adobe Visitor API for JavaScript version: 2.1.0
 Copyright 1996-2015 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
*/
function Visitor(q,w){function x(d){return function(b){b=b||s.location.href;try{var c=a.Xa(b,d);if(c)return m.Hb(c)}catch(e){}}}function B(a){function b(a,d,b){b=b?b+="|":b;return b+(a+"="+encodeURIComponent(d))}for(var c="",e=0,f=a.length;e<f;e++){var g=a[e],h=g[0],g=g[1];g!=j&&g!==u&&(c=b(h,g,c))}return function(a){var d=m.Da(),a=a?a+="|":a;return a+("TS="+d)}(c)}if(!q)throw"Visitor requires Adobe Marketing Cloud Org ID";var a=this;a.version="2.1.0";var s=window,l=s.Visitor;l.version=a.version;
s.s_c_in||(s.s_c_il=[],s.s_c_in=0);a._c="Visitor";a._il=s.s_c_il;a._in=s.s_c_in;a._il[a._in]=a;s.s_c_in++;a.na={La:[]};var v=s.document,j=l.Pb;j||(j=null);var F=l.Qb;F||(F=void 0);var i=l.Va;i||(i=!0);var k=l.Sa;k||(k=!1);var n={r:!!s.postMessage,Ra:1,ea:864E5,ba:"adobe_mc",ca:"adobe_mc_sdid",w:/^[0-9a-fA-F\-]+$/,Qa:5,Ta:/^\d+$/,fa:/vVersion\|((\d+\.)?(\d+\.)?(\*|\d+))(?=$|\|)/};a.Rb=n;a.ka=function(a){var b=0,c,e;if(a)for(c=0;c<a.length;c++)e=a.charCodeAt(c),b=(b<<5)-b+e,b&=b;return b};a.u=function(a,
b){var c="0123456789",e="",f="",g,h,j=8,k=10,l=10;b===o&&(y.isClientSideMarketingCloudVisitorID=i);if(1==a){c+="ABCDEF";for(g=0;16>g;g++)h=Math.floor(Math.random()*j),e+=c.substring(h,h+1),h=Math.floor(Math.random()*j),f+=c.substring(h,h+1),j=16;return e+"-"+f}for(g=0;19>g;g++)h=Math.floor(Math.random()*k),e+=c.substring(h,h+1),0==g&&9==h?k=3:(1==g||2==g)&&10!=k&&2>h?k=10:2<g&&(k=10),h=Math.floor(Math.random()*l),f+=c.substring(h,h+1),0==g&&9==h?l=3:(1==g||2==g)&&10!=l&&2>h?l=10:2<g&&(l=10);return e+
f};a.Ya=function(){var a;!a&&s.location&&(a=s.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a="";else{var b=a.split("."),c=b.length-1,e=c-1;1<c&&2>=b[c].length&&(2==b[c-1].length||0>",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,et,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,nz,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tr,tt,tv,tw,tz,ua,ug,uk,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,".indexOf(","+
b[c]+","))&&e--;if(0<e)for(a="";c>=e;)a=b[c]+(a?".":"")+a,c--}return a};a.cookieRead=function(a){var a=encodeURIComponent(a),b=(";"+v.cookie).split(" ").join(";"),c=b.indexOf(";"+a+"="),e=0>c?c:b.indexOf(";",c+1);return 0>c?"":decodeURIComponent(b.substring(c+2+a.length,0>e?b.length:e))};a.cookieWrite=function(d,b,c){var e=a.cookieLifetime,f,b=""+b,e=e?(""+e).toUpperCase():"";c&&"SESSION"!=e&&"NONE"!=e?(f=""!=b?parseInt(e?e:0,10):-60)?(c=new Date,c.setTime(c.getTime()+1E3*f)):1==c&&(c=new Date,f=
c.getYear(),c.setYear(f+2+(1900>f?1900:0))):c=0;return d&&"NONE"!=e?(v.cookie=encodeURIComponent(d)+"="+encodeURIComponent(b)+"; path=/;"+(c?" expires="+c.toGMTString()+";":"")+(a.cookieDomain?" domain="+a.cookieDomain+";":""),a.cookieRead(d)==b):0};a.h=j;a.z=function(a,b){try{"function"==typeof a?a.apply(s,b):a[1].apply(a[0],b)}catch(c){}};a.M=function(d,b){b&&(a.h==j&&(a.h={}),a.h[d]==F&&(a.h[d]=[]),a.h[d].push(b))};a.t=function(d,b){if(a.h!=j){var c=a.h[d];if(c)for(;0<c.length;)a.z(c.shift(),b)}};
a.s=function(a,b,c,e){c=encodeURIComponent(b)+"="+encodeURIComponent(c);b=m.Fb(a);a=m.wb(a);if(-1===a.indexOf("?"))return a+"?"+c+b;var f=a.split("?"),a=f[0]+"?",e=m.ib(f[1],c,e);return a+e+b};a.Xa=function(a,b){var c=RegExp("[\\?&#]"+b+"=([^&#]*)").exec(a);if(c&&c.length)return decodeURIComponent(c[1])};a.eb=x(n.ba);a.fb=x(n.ca);a.ha=function(){var d=a.fb(void 0);d&&d.SDID&&d[G]===q&&(a._supplementalDataIDCurrent=d.SDID,a._supplementalDataIDCurrentConsumed.SDID_URL_PARAM=i)};a.ga=function(){var d=
a.eb();if(d&&d.TS&&!(Math.floor((m.Da()-d.TS)/60)>n.Qa||d[G]!==q)){var b=d[o],c=a.setMarketingCloudVisitorID;b&&b.match(n.w)&&c(b);a.j(t,-1);d=d[r];b=a.setAnalyticsVisitorID;d&&d.match(n.w)&&b(d)}};a.cb=function(d){function b(d){m.Ga(d)&&a.setCustomerIDs(d)}function c(d){d=d||{};a._supplementalDataIDCurrent=d.supplementalDataIDCurrent||"";a._supplementalDataIDCurrentConsumed=d.supplementalDataIDCurrentConsumed||{};a._supplementalDataIDLast=d.supplementalDataIDLast||"";a._supplementalDataIDLastConsumed=
d.supplementalDataIDLastConsumed||{}}if(d)try{if(d=m.Ga(d)?d:m.Gb(d),d[a.marketingCloudOrgID]){var e=d[a.marketingCloudOrgID];b(e.customerIDs);c(e.sdid)}}catch(f){throw Error("`serverState` has an invalid format.");}};a.l=j;a.$a=function(d,b,c,e){b=a.s(b,"d_fieldgroup",d,1);e.url=a.s(e.url,"d_fieldgroup",d,1);e.m=a.s(e.m,"d_fieldgroup",d,1);y.d[d]=i;e===Object(e)&&e.m&&"XMLHttpRequest"===a.pa.F.G?a.pa.rb(e,c,d):a.useCORSOnly||a.ab(d,b,c)};a.ab=function(d,b,c){var e=0,f=0,g;if(b&&v){for(g=0;!e&&2>
g;){try{e=(e=v.getElementsByTagName(0<g?"HEAD":"head"))&&0<e.length?e[0]:0}catch(h){e=0}g++}if(!e)try{v.body&&(e=v.body)}catch(k){e=0}if(e)for(g=0;!f&&2>g;){try{f=v.createElement(0<g?"SCRIPT":"script")}catch(l){f=0}g++}}!b||!e||!f?c&&c():(f.type="text/javascript",f.src=b,e.firstChild?e.insertBefore(f,e.firstChild):e.appendChild(f),e=a.loadTimeout,p.d[d]={requestStart:p.p(),url:b,xa:e,va:p.Ca(),wa:0},c&&(a.l==j&&(a.l={}),a.l[d]=setTimeout(function(){c(i)},e)),a.na.La.push(b))};a.Wa=function(d){a.l!=
j&&a.l[d]&&(clearTimeout(a.l[d]),a.l[d]=0)};a.la=k;a.ma=k;a.isAllowed=function(){if(!a.la&&(a.la=i,a.cookieRead(a.cookieName)||a.cookieWrite(a.cookieName,"T",1)))a.ma=i;return a.ma};a.b=j;a.c=j;var H=l.gc;H||(H="MC");var o=l.nc;o||(o="MCMID");var G=l.kc;G||(G="MCORGID");var I=l.hc;I||(I="MCCIDH");var M=l.lc;M||(M="MCSYNCS");var K=l.mc;K||(K="MCSYNCSOP");var L=l.ic;L||(L="MCIDTS");var C=l.jc;C||(C="MCOPTOUT");var E=l.ec;E||(E="A");var r=l.bc;r||(r="MCAID");var D=l.fc;D||(D="AAM");var A=l.dc;A||(A=
"MCAAMLH");var t=l.cc;t||(t="MCAAMB");var u=l.oc;u||(u="NONE");a.N=0;a.ja=function(){if(!a.N){var d=a.version;a.audienceManagerServer&&(d+="|"+a.audienceManagerServer);a.audienceManagerServerSecure&&(d+="|"+a.audienceManagerServerSecure);a.N=a.ka(d)}return a.N};a.oa=k;a.f=function(){if(!a.oa){a.oa=i;var d=a.ja(),b=k,c=a.cookieRead(a.cookieName),e,f,g,h,l=new Date;a.b==j&&(a.b={});if(c&&"T"!=c){c=c.split("|");c[0].match(/^[\-0-9]+$/)&&(parseInt(c[0],10)!=d&&(b=i),c.shift());1==c.length%2&&c.pop();
for(d=0;d<c.length;d+=2)if(e=c[d].split("-"),f=e[0],g=c[d+1],1<e.length?(h=parseInt(e[1],10),e=0<e[1].indexOf("s")):(h=0,e=k),b&&(f==I&&(g=""),0<h&&(h=l.getTime()/1E3-60)),f&&g&&(a.e(f,g,1),0<h&&(a.b["expire"+f]=h+(e?"s":""),l.getTime()>=1E3*h||e&&!a.cookieRead(a.sessionCookieName))))a.c||(a.c={}),a.c[f]=i}if(!a.a(r)&&m.o()&&(c=a.cookieRead("s_vi")))c=c.split("|"),1<c.length&&0<=c[0].indexOf("v1")&&(g=c[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(n.w)&&a.e(r,g))}};a._appendVersionTo=
function(d){var b="vVersion|"+a.version,c=Boolean(d)?a._getCookieVersion(d):null;c?m.jb(c,a.version)&&(d=d.replace(n.fa,b)):d+=(d?"|":"")+b;return d};a.hb=function(){var d=a.ja(),b,c;for(b in a.b)!Object.prototype[b]&&a.b[b]&&"expire"!=b.substring(0,6)&&(c=a.b[b],d+=(d?"|":"")+b+(a.b["expire"+b]?"-"+a.b["expire"+b]:"")+"|"+c);d=a._appendVersionTo(d);a.cookieWrite(a.cookieName,d,1)};a.a=function(d,b){return a.b!=j&&(b||!a.c||!a.c[d])?a.b[d]:j};a.e=function(d,b,c){a.b==j&&(a.b={});a.b[d]=b;c||a.hb()};
a.Za=function(d,b){var c=a.a(d,b);return c?c.split("*"):j};a.gb=function(d,b,c){a.e(d,b?b.join("*"):"",c)};a.Wb=function(d,b){var c=a.Za(d,b);if(c){var e={},f;for(f=0;f<c.length;f+=2)e[c[f]]=c[f+1];return e}return j};a.Yb=function(d,b,c){var e=j,f;if(b)for(f in e=[],b)Object.prototype[f]||(e.push(f),e.push(b[f]));a.gb(d,e,c)};a.j=function(d,b,c){var e=new Date;e.setTime(e.getTime()+1E3*b);a.b==j&&(a.b={});a.b["expire"+d]=Math.floor(e.getTime()/1E3)+(c?"s":"");0>b?(a.c||(a.c={}),a.c[d]=i):a.c&&(a.c[d]=
k);c&&(a.cookieRead(a.sessionCookieName)||a.cookieWrite(a.sessionCookieName,"1"))};a.ia=function(a){if(a&&("object"==typeof a&&(a=a.d_mid?a.d_mid:a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a=u)),!a||a!=u&&!a.match(n.w)))a="";return a};a.k=function(d,b){a.Wa(d);a.i!=j&&(a.i[d]=k);p.d[d]&&(p.d[d].Nb=p.p(),p.J(d));y.d[d]&&y.Na(d,k);if(d==H){y.isClientSideMarketingCloudVisitorID!==i&&(y.isClientSideMarketingCloudVisitorID=k);var c=a.a(o);if(!c||a.overwriteCrossDomainMCIDAndAID){c=
"object"==typeof b&&b.mid?b.mid:a.ia(b);if(!c){if(a.D){a.getAnalyticsVisitorID(j,k,i);return}c=a.u(0,o)}a.e(o,c)}if(!c||c==u)c="";"object"==typeof b&&((b.d_region||b.dcs_region||b.d_blob||b.blob)&&a.k(D,b),a.D&&b.mid&&a.k(E,{id:b.id}));a.t(o,[c])}if(d==D&&"object"==typeof b){c=604800;b.id_sync_ttl!=F&&b.id_sync_ttl&&(c=parseInt(b.id_sync_ttl,10));var e=a.a(A);e||((e=b.d_region)||(e=b.dcs_region),e&&(a.j(A,c),a.e(A,e)));e||(e="");a.t(A,[e]);e=a.a(t);if(b.d_blob||b.blob)(e=b.d_blob)||(e=b.blob),a.j(t,
c),a.e(t,e);e||(e="");a.t(t,[e]);!b.error_msg&&a.C&&a.e(I,a.C)}if(d==E){c=a.a(r);if(!c||a.overwriteCrossDomainMCIDAndAID)(c=a.ia(b))?c!==u&&a.j(t,-1):c=u,a.e(r,c);if(!c||c==u)c="";a.t(r,[c])}a.idSyncDisableSyncs?z.Ea=i:(z.Ea=k,c={},c.ibs=b.ibs,c.subdomain=b.subdomain,z.Ib(c));if(b===Object(b)){var f;a.isAllowed()&&(f=a.a(C));f||(f=u,b.d_optout&&b.d_optout instanceof Array&&(f=b.d_optout.join(",")),c=parseInt(b.d_ottl,10),isNaN(c)&&(c=7200),a.j(C,c,i),a.e(C,f));a.t(C,[f])}};a.i=j;a.v=function(d,b,
c,e,f){var g="",h,k=m.yb(d);if(a.isAllowed())if(a.f(),g=a.a(d,N[d]===i),(!g||a.c&&a.c[d])&&(!a.disableThirdPartyCalls||k)){if(d==o||d==C?h=H:d==A||d==t?h=D:d==r&&(h=E),h){if(b&&(a.i==j||!a.i[h]))a.i==j&&(a.i={}),a.i[h]=i,a.$a(h,b,function(b){a.a(d)||(p.d[h]&&(p.d[h].timeout=p.p(),p.d[h].xb=!!b,p.J(h)),b&&y.Na(h,i),b="",d==o?b=a.u(0,o):h==D&&(b={error_msg:"timeout"}),a.k(h,b))},f);a.M(d,c);if(g)return g;b||a.k(h,{id:u});return""}}else g||(d===o?(a.M(d,c),g=a.u(0,o),a.setMarketingCloudVisitorID(g)):
d===r?(a.M(d,c),g="",a.setAnalyticsVisitorID(g)):(g="",e=i));if((d==o||d==r)&&g==u)g="",e=i;c&&e&&a.z(c,[g]);return g};a._setMarketingCloudFields=function(d){a.f();a.k(H,d)};a.setMarketingCloudVisitorID=function(d){a._setMarketingCloudFields(d)};a.D=k;a.getMarketingCloudVisitorID=function(d,b){if(a.isAllowed()){a.marketingCloudServer&&0>a.marketingCloudServer.indexOf(".demdex.net")&&(a.D=i);var c=a.B("_setMarketingCloudFields");return a.v(o,c.url,d,b,c)}return""};a.bb=function(d){a.getAudienceManagerBlob(d,
i)};l.AuthState={UNKNOWN:0,AUTHENTICATED:1,LOGGED_OUT:2};a.A={};a.K=k;a.C="";a.setCustomerIDs=function(d){if(a.isAllowed()&&d){a.f();var b,c;for(b in d)if(!Object.prototype[b]&&(c=d[b]))if("object"==typeof c){var e={};c.id&&(e.id=c.id);c.authState!=F&&(e.authState=c.authState);a.A[b]=e}else a.A[b]={id:c};var d=a.getCustomerIDs(),e=a.a(I),f="";e||(e=0);for(b in d)Object.prototype[b]||(c=d[b],f+=(f?"|":"")+b+"|"+(c.id?c.id:"")+(c.authState?c.authState:""));a.C=a.ka(f);a.C!=e&&(a.K=i,a.bb(function(){a.K=
k}))}};a.getCustomerIDs=function(){a.f();var d={},b,c;for(b in a.A)Object.prototype[b]||(c=a.A[b],d[b]||(d[b]={}),c.id&&(d[b].id=c.id),d[b].authState=c.authState!=F?c.authState:l.AuthState.UNKNOWN);return d};a._setAnalyticsFields=function(d){a.f();a.k(E,d)};a.setAnalyticsVisitorID=function(d){a._setAnalyticsFields(d)};a.getAnalyticsVisitorID=function(d,b,c){if(!m.o()&&!c)return a.z(d,[""]),"";if(a.isAllowed()){var e="";c||(e=a.getMarketingCloudVisitorID(function(){a.getAnalyticsVisitorID(d,i)}));
if(e||c){var f=c?a.marketingCloudServer:a.trackingServer,g="";a.loadSSL&&(c?a.marketingCloudServerSecure&&(f=a.marketingCloudServerSecure):a.trackingServerSecure&&(f=a.trackingServerSecure));var h={};if(f){var f="http"+(a.loadSSL?"s":"")+"://"+f+"/id",e="d_visid_ver="+a.version+"&mcorgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":""),j=["s_c_il",a._in,"_set"+(c?"MarketingCloud":"Analytics")+"Fields"],g=f+"?"+e+"&callback=s_c_il%5B"+
a._in+"%5D._set"+(c?"MarketingCloud":"Analytics")+"Fields";h.m=f+"?"+e;h.sa=j}h.url=g;return a.v(c?o:r,g,d,b,h)}}return""};a._setAudienceManagerFields=function(d){a.f();a.k(D,d)};a.B=function(d){var b=a.audienceManagerServer,c="",e=a.a(o),f=a.a(t,i),g=a.a(r),g=g&&g!=u?"&d_cid_ic=AVID%01"+encodeURIComponent(g):"";a.loadSSL&&a.audienceManagerServerSecure&&(b=a.audienceManagerServerSecure);if(b){var c=a.getCustomerIDs(),h,j;if(c)for(h in c)Object.prototype[h]||(j=c[h],g+="&d_cid_ic="+encodeURIComponent(h)+
"%01"+encodeURIComponent(j.id?j.id:"")+(j.authState?"%01"+j.authState:""));d||(d="_setAudienceManagerFields");b="http"+(a.loadSSL?"s":"")+"://"+b+"/id";e="d_visid_ver="+a.version+"&d_rtbd=json&d_ver=2"+(!e&&a.D?"&d_verify=1":"")+"&d_orgid="+encodeURIComponent(a.marketingCloudOrgID)+"&d_nsid="+(a.idSyncContainerID||0)+(e?"&d_mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":"")+(f?"&d_blob="+encodeURIComponent(f):"")+g;f=["s_c_il",a._in,d];c=b+"?"+e+"&d_cb=s_c_il%5B"+
a._in+"%5D."+d;return{url:c,m:b+"?"+e,sa:f}}return{url:c}};a.getAudienceManagerLocationHint=function(d,b){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerLocationHint(d,i)})){var c=a.a(r);!c&&m.o()&&(c=a.getAnalyticsVisitorID(function(){a.getAudienceManagerLocationHint(d,i)}));if(c||!m.o())return c=a.B(),a.v(A,c.url,d,b,c)}return""};a.getLocationHint=a.getAudienceManagerLocationHint;a.getAudienceManagerBlob=function(d,b){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerBlob(d,
i)})){var c=a.a(r);!c&&m.o()&&(c=a.getAnalyticsVisitorID(function(){a.getAudienceManagerBlob(d,i)}));if(c||!m.o()){var c=a.B(),e=c.url;a.K&&a.j(t,-1);return a.v(t,e,d,b,c)}}return""};a._supplementalDataIDCurrent="";a._supplementalDataIDCurrentConsumed={};a._supplementalDataIDLast="";a._supplementalDataIDLastConsumed={};a.getSupplementalDataID=function(d,b){!a._supplementalDataIDCurrent&&!b&&(a._supplementalDataIDCurrent=a.u(1));var c=a._supplementalDataIDCurrent;a._supplementalDataIDLast&&!a._supplementalDataIDLastConsumed[d]?
(c=a._supplementalDataIDLast,a._supplementalDataIDLastConsumed[d]=i):c&&(a._supplementalDataIDCurrentConsumed[d]&&(a._supplementalDataIDLast=a._supplementalDataIDCurrent,a._supplementalDataIDLastConsumed=a._supplementalDataIDCurrentConsumed,a._supplementalDataIDCurrent=c=!b?a.u(1):"",a._supplementalDataIDCurrentConsumed={}),c&&(a._supplementalDataIDCurrentConsumed[d]=i));return c};l.OptOut={GLOBAL:"global"};a.getOptOut=function(d,b){if(a.isAllowed()){var c=a.B("_setMarketingCloudFields");return a.v(C,
c.url,d,b,c)}return""};a.isOptedOut=function(d,b,c){return a.isAllowed()?(b||(b=l.OptOut.GLOBAL),(c=a.getOptOut(function(c){a.z(d,[c==l.OptOut.GLOBAL||0<=c.indexOf(b)])},c))?c==l.OptOut.GLOBAL||0<=c.indexOf(b):j):k};a.appendVisitorIDsTo=function(d){var b=n.ba,c=B([[o,a.a(o)],[r,a.a(r)],[G,a.marketingCloudOrgID]]);try{return a.s(d,b,c)}catch(e){return d}};a.appendSupplementalDataIDTo=function(d,b){b=b||a.getSupplementalDataID(m.sb(),!0);if(!b)return d;var c=n.ca,e;e="SDID="+encodeURIComponent(b)+"|"+
(G+"="+encodeURIComponent(a.marketingCloudOrgID));try{return a.s(d,c,e)}catch(f){return d}};a.ra={postMessage:function(a,b,c){var e=1;b&&(n.r?c.postMessage(a,b.replace(/([^:]+:\/\/[^\/]+).*/,"$1")):b&&(c.location=b.replace(/#.*$/,"")+"#"+ +new Date+e++ +"&"+a))},X:function(a,b){var c;try{if(n.r)if(a&&(c=function(c){if("string"===typeof b&&c.origin!==b||"[object Function]"===Object.prototype.toString.call(b)&&!1===b(c.origin))return!1;a(c)}),window.addEventListener)window[a?"addEventListener":"removeEventListener"]("message",
c,!1);else window[a?"attachEvent":"detachEvent"]("onmessage",c)}catch(e){}}};var m={O:function(){if(v.addEventListener)return function(a,b,c){a.addEventListener(b,function(a){"function"===typeof c&&c(a)},k)};if(v.attachEvent)return function(a,b,c){a.attachEvent("on"+b,function(a){"function"===typeof c&&c(a)})}}(),map:function(a,b){if(Array.prototype.map)return a.map(b);if(void 0===a||a===j)throw new TypeError;var c=Object(a),e=c.length>>>0;if("function"!==typeof b)throw new TypeError;for(var f=Array(e),
g=0;g<e;g++)g in c&&(f[g]=b.call(b,c[g],g,c));return f},za:function(a,b){return this.map(a,function(a){return encodeURIComponent(a)}).join(b)},Fb:function(a){var b=a.indexOf("#");return 0<b?a.substr(b):""},wb:function(a){var b=a.indexOf("#");return 0<b?a.substr(0,b):a},ib:function(a,b,c){a=a.split("&");c=c!=j?c:a.length;a.splice(c,0,b);return a.join("&")},yb:function(d,b,c){if(d!==r)return k;b||(b=a.trackingServer);c||(c=a.trackingServerSecure);d=a.loadSSL?c:b;return"string"===typeof d&&d.length?
0>d.indexOf("2o7.net")&&0>d.indexOf("omtrdc.net"):k},Ga:function(a){return Boolean(a&&a===Object(a))},zb:function(d,b){return 0>a._compareVersions(d,b)},jb:function(d,b){return 0!==a._compareVersions(d,b)},Mb:function(a){document.cookie=encodeURIComponent(a)+"=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"},o:function(){return!!a.trackingServer||!!a.trackingServerSecure},Gb:function(a,b){function c(a,d){var e,j,i=a[d];if(i&&"object"===typeof i)for(e in i)Object.prototype.hasOwnProperty.call(i,
e)&&(j=c(i,e),void 0!==j?i[e]=j:delete i[e]);return b.call(a,d,i)}if("object"===typeof JSON&&"function"===typeof JSON.parse)return JSON.parse(a,b);var e;e=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;a=""+a;e.lastIndex=0;e.test(a)&&(a=a.replace(e,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return e=eval("("+a+")"),"function"===typeof b?c({"":e},""):e;throw new SyntaxError("JSON.parse");},Da:function(){return Math.round((new Date).getTime()/1E3)},Hb:function(a){for(var b={},a=a.split("|"),c=0,e=a.length;c<e;c++){var f=a[c].split("=");b[f[0]]=decodeURIComponent(f[1])}return b},sb:function(a){for(var a=a||5,b="";a--;)b+="abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(36*Math.random())];return b}};a.Xb=m;a.pa={F:function(){var a="none",b=i;"undefined"!==
typeof XMLHttpRequest&&XMLHttpRequest===Object(XMLHttpRequest)&&("withCredentials"in new XMLHttpRequest?a="XMLHttpRequest":"undefined"!==typeof XDomainRequest&&XDomainRequest===Object(XDomainRequest)&&(b=k),0<Object.prototype.toString.call(window.Ob).indexOf("Constructor")&&(b=k));return{G:a,$b:b}}(),tb:function(){return"none"===this.F.G?j:new window[this.F.G]},rb:function(d,b,c){var e=this;b&&(d.U=b);try{var f=this.tb();f.open("get",d.m+"&ts="+(new Date).getTime(),i);"XMLHttpRequest"===this.F.G&&
(f.withCredentials=i,f.timeout=a.loadTimeout,f.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),f.onreadystatechange=function(){if(4===this.readyState&&200===this.status)a:{var a;try{if(a=JSON.parse(this.responseText),a!==Object(a)){e.n(d,j,"Response is not JSON");break a}}catch(b){e.n(d,b,"Error parsing response as JSON");break a}try{for(var c=d.sa,f=window,g=0;g<c.length;g++)f=f[c[g]];f(a)}catch(i){e.n(d,i,"Error forming callback function")}}});f.onerror=function(a){e.n(d,a,
"onerror")};f.ontimeout=function(a){e.n(d,a,"ontimeout")};f.send();p.d[c]={requestStart:p.p(),url:d.m,xa:f.timeout,va:p.Ca(),wa:1};a.na.La.push(d.m)}catch(g){this.n(d,g,"try-catch")}},n:function(d,b,c){a.CORSErrors.push({ac:d,error:b,description:c});d.U&&("ontimeout"===c?d.U(i):d.U(k))}};var z={Ua:3E4,da:649,Pa:k,id:j,W:[],S:j,Ba:function(a){if("string"===typeof a)return a=a.split("/"),a[0]+"//"+a[2]},g:j,url:j,ub:function(){var d="http://fast.",b="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(v.location.href);
this.g||(this.g="nosubdomainreturned");a.loadSSL&&(d=a.idSyncSSLUseAkamai?"https://fast.":"https://");d=d+this.g+".demdex.net/dest5.html"+b;this.S=this.Ba(d);this.id="destination_publishing_iframe_"+this.g+"_"+a.idSyncContainerID;return d},mb:function(){var d="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(v.location.href);"string"===typeof a.L&&a.L.length&&(this.id="destination_publishing_iframe_"+(new Date).getTime()+"_"+a.idSyncContainerID,this.S=this.Ba(a.L),this.url=a.L+d)},Ea:j,ya:k,Z:k,
H:j,pc:j,Eb:j,qc:j,Y:k,I:[],Cb:[],Db:[],Ha:n.r?15:100,T:[],Ab:[],ta:i,Ka:k,Ja:function(){return!a.idSyncDisable3rdPartySyncing&&(this.ya||a.Tb)&&this.g&&"nosubdomainreturned"!==this.g&&this.url&&!this.Z},Q:function(){function a(){e=document.createElement("iframe");e.sandbox="allow-scripts allow-same-origin";e.title="Adobe ID Syncing iFrame";e.id=c.id;e.style.cssText="display: none; width: 0; height: 0;";e.src=c.url;c.Eb=i;b();document.body.appendChild(e)}function b(){m.O(e,"load",function(){e.className=
"aamIframeLoaded";c.H=i;c.q()})}this.Z=i;var c=this,e=document.getElementById(this.id);e?"IFRAME"!==e.nodeName?(this.id+="_2",a()):"aamIframeLoaded"!==e.className?b():(this.H=i,this.Fa=e,this.q()):a();this.Fa=e},q:function(d){var b=this;d===Object(d)&&(this.T.push(d),this.Jb(d));if((this.Ka||!n.r||this.H)&&this.T.length)this.J(this.T.shift()),this.q();!a.idSyncDisableSyncs&&this.H&&this.I.length&&!this.Y&&(this.Pa||(this.Pa=i,setTimeout(function(){b.Ha=n.r?15:150},this.Ua)),this.Y=i,this.Ma())},Jb:function(a){var b,
c,e;if((b=a.ibs)&&b instanceof Array&&(c=b.length))for(a=0;a<c;a++)e=b[a],e.syncOnPage&&this.ua(e,"","syncOnPage")},J:function(a){var b=encodeURIComponent,c,e,f,g,h;if((c=a.ibs)&&c instanceof Array&&(e=c.length))for(f=0;f<e;f++)g=c[f],h=[b("ibs"),b(g.id||""),b(g.tag||""),m.za(g.url||[],","),b(g.ttl||""),"","",g.fireURLSync?"true":"false"],g.syncOnPage||(this.ta?this.P(h.join("|")):g.fireURLSync&&this.ua(g,h.join("|")));this.Ab.push(a)},ua:function(d,b,c){var e=(c="syncOnPage"===c?i:k)?K:M;a.f();var f=
a.a(e),g=k,h=k,j=Math.ceil((new Date).getTime()/n.ea);f?(f=f.split("*"),h=this.Kb(f,d.id,j),g=h.pb,h=h.qb,(!g||!h)&&this.Aa(c,d,b,f,e,j)):(f=[],this.Aa(c,d,b,f,e,j))},Kb:function(a,b,c){var e=k,f=k,g,h,j;for(h=0;h<a.length;h++)g=a[h],j=parseInt(g.split("-")[1],10),g.match("^"+b+"-")?(e=i,c<j?f=i:(a.splice(h,1),h--)):c>=j&&(a.splice(h,1),h--);return{pb:e,qb:f}},Bb:function(a){if(a.join("*").length>this.da)for(a.sort(function(a,c){return parseInt(a.split("-")[1],10)-parseInt(c.split("-")[1],10)});a.join("*").length>
this.da;)a.shift()},Aa:function(d,b,c,e,f,g){var h=this;if(d){if("img"===b.tag){var d=b.url,c=a.loadSSL?"https:":"http:",i,k,l;for(e=0,i=d.length;e<i;e++){k=d[e];l=/^\/\//.test(k);var n=new Image;m.O(n,"load",function(b,c,d,e){return function(){h.W[b]=j;a.f();var g=a.a(f),i=[];if(g){var g=g.split("*"),k,l,m;for(k=0,l=g.length;k<l;k++)m=g[k],m.match("^"+c.id+"-")||i.push(m)}h.Oa(i,c,d,e)}}(this.W.length,b,f,g));n.src=(l?c:"")+k;this.W.push(n)}}}else this.P(c),this.Oa(e,b,f,g)},P:function(d){var b=
encodeURIComponent;this.I.push((a.Ub?b("---destpub-debug---"):b("---destpub---"))+d)},Oa:function(d,b,c,e){d.push(b.id+"-"+(e+Math.ceil(b.ttl/60/24)));this.Bb(d);a.e(c,d.join("*"))},Ma:function(){var d=this,b;this.I.length?(b=this.I.shift(),a.ra.postMessage(b,this.url,this.Fa.contentWindow),this.Cb.push(b),setTimeout(function(){d.Ma()},this.Ha)):this.Y=k},X:function(a){var b=/^---destpub-to-parent---/;"string"===typeof a&&b.test(a)&&(b=a.replace(b,"").split("|"),"canSetThirdPartyCookies"===b[0]&&
(this.ta="true"===b[1]?i:k,this.Ka=i,this.q()),this.Db.push(a))},Ib:function(d){if(this.url===j||d.subdomain&&"nosubdomainreturned"===this.g)this.g="string"===typeof a.qa&&a.qa.length?a.qa:d.subdomain||"",this.url=this.ub();d.ibs instanceof Array&&d.ibs.length&&(this.ya=i);this.Ja()&&(a.idSyncAttachIframeOnWindowLoad?(l.aa||"complete"===v.readyState||"loaded"===v.readyState)&&this.Q():this.kb());"function"===typeof a.idSyncIDCallResult?a.idSyncIDCallResult(d):this.q(d);"function"===typeof a.idSyncAfterIDCallResult&&
a.idSyncAfterIDCallResult(d)},lb:function(d,b){return a.Vb||!d||b-d>n.Ra},kb:function(){function a(){b.Z||(document.body?b.Q():setTimeout(a,30))}var b=this;a()}};a.Sb=z;a.timeoutMetricsLog=[];var p={ob:window.performance&&window.performance.timing?1:0,Ia:window.performance&&window.performance.timing?window.performance.timing:j,$:j,R:j,d:{},V:[],send:function(d){if(a.takeTimeoutMetrics&&d===Object(d)){var b=[],c=encodeURIComponent,e;for(e in d)d.hasOwnProperty(e)&&b.push(c(e)+"="+c(d[e]));d="http"+
(a.loadSSL?"s":"")+"://dpm.demdex.net/event?d_visid_ver="+a.version+"&d_visid_stg_timeout="+a.loadTimeout+"&"+b.join("&")+"&d_orgid="+c(a.marketingCloudOrgID)+"&d_timingapi="+this.ob+"&d_winload="+this.vb()+"&d_ld="+this.p();(new Image).src=d;a.timeoutMetricsLog.push(d)}},vb:function(){this.R===j&&(this.R=this.Ia?this.$-this.Ia.navigationStart:this.$-l.nb);return this.R},p:function(){return(new Date).getTime()},J:function(a){var b=this.d[a],c={};c.d_visid_stg_timeout_captured=b.xa;c.d_visid_cors=
b.wa;c.d_fieldgroup=a;c.d_settimeout_overriden=b.va;b.timeout?b.xb?(c.d_visid_timedout=1,c.d_visid_timeout=b.timeout-b.requestStart,c.d_visid_response=-1):(c.d_visid_timedout="n/a",c.d_visid_timeout="n/a",c.d_visid_response="n/a"):(c.d_visid_timedout=0,c.d_visid_timeout=-1,c.d_visid_response=b.Nb-b.requestStart);c.d_visid_url=b.url;l.aa?this.send(c):this.V.push(c);delete this.d[a]},Lb:function(){for(var a=0,b=this.V.length;a<b;a++)this.send(this.V[a])},Ca:function(){return"function"===typeof setTimeout.toString?
-1<setTimeout.toString().indexOf("[native code]")?0:1:-1}};a.Zb=p;var y={isClientSideMarketingCloudVisitorID:j,MCIDCallTimedOut:j,AnalyticsIDCallTimedOut:j,AAMIDCallTimedOut:j,d:{},Na:function(a,b){switch(a){case H:b===k?this.MCIDCallTimedOut!==i&&(this.MCIDCallTimedOut=k):this.MCIDCallTimedOut=b;break;case E:b===k?this.AnalyticsIDCallTimedOut!==i&&(this.AnalyticsIDCallTimedOut=k):this.AnalyticsIDCallTimedOut=b;break;case D:b===k?this.AAMIDCallTimedOut!==i&&(this.AAMIDCallTimedOut=k):this.AAMIDCallTimedOut=
b}}};a.isClientSideMarketingCloudVisitorID=function(){return y.isClientSideMarketingCloudVisitorID};a.MCIDCallTimedOut=function(){return y.MCIDCallTimedOut};a.AnalyticsIDCallTimedOut=function(){return y.AnalyticsIDCallTimedOut};a.AAMIDCallTimedOut=function(){return y.AAMIDCallTimedOut};a.idSyncGetOnPageSyncInfo=function(){a.f();return a.a(K)};a.idSyncByURL=function(d){var b,c=d||{};b=c.minutesToLive;var e="";a.idSyncDisableSyncs&&(e=e?e:"Error: id syncs have been disabled");if("string"!==typeof c.dpid||
!c.dpid.length)e=e?e:"Error: config.dpid is empty";if("string"!==typeof c.url||!c.url.length)e=e?e:"Error: config.url is empty";if("undefined"===typeof b)b=20160;else if(b=parseInt(b,10),isNaN(b)||0>=b)e=e?e:"Error: config.minutesToLive needs to be a positive number";b={error:e,rc:b};if(b.error)return b.error;var e=d.url,f=encodeURIComponent,c=z,g,e=e.replace(/^https:/,"").replace(/^http:/,"");g=m.za(["",d.dpid,d.dpuuid||""],",");d=["ibs",f(d.dpid),"img",f(e),b.ttl,"",g];c.P(d.join("|"));c.q();return"Successfully queued"};
a.idSyncByDataSource=function(d){if(d!==Object(d)||"string"!==typeof d.dpuuid||!d.dpuuid.length)return"Error: config or config.dpuuid is empty";d.url="//dpm.demdex.net/ibs:dpid="+d.dpid+"&dpuuid="+d.dpuuid;return a.idSyncByURL(d)};a._compareVersions=function(a,b){if(a===b)return 0;var c=a.toString().split("."),e=b.toString().split("."),f;a:{f=c.concat(e);for(var g=0,h=f.length;g<h;g++)if(!n.Ta.test(f[g])){f=k;break a}f=i}if(!f)return NaN;for(;c.length<e.length;)c.push("0");for(;e.length<c.length;)e.push("0");
a:{for(f=0;f<c.length;f++){g=parseInt(c[f],10);h=parseInt(e[f],10);if(g>h){c=1;break a}if(h>g){c=-1;break a}}c=0}return c};a._getCookieVersion=function(d){d=d||a.cookieRead(a.cookieName);return(d=n.fa.exec(d))&&1<d.length?d[1]:null};a._resetAmcvCookie=function(d){var b=a._getCookieVersion();(!b||m.zb(b,d))&&m.Mb(a.cookieName)};0>q.indexOf("@")&&(q+="@AdobeOrg");a.marketingCloudOrgID=q;a.cookieName="AMCV_"+q;a.sessionCookieName="AMCVS_"+q;a.cookieDomain=a.Ya();a.cookieDomain==s.location.hostname&&
(a.cookieDomain="");a.loadSSL=0<=s.location.protocol.toLowerCase().indexOf("https");a.loadTimeout=3E4;a.CORSErrors=[];a.marketingCloudServer=a.audienceManagerServer="dpm.demdex.net";var N={};N[A]=i;N[t]=i;if(w&&"object"==typeof w){for(var J in w)!Object.prototype[J]&&(a[J]=w[J]);a.idSyncContainerID=a.idSyncContainerID||0;a.resetBeforeVersion&&a._resetAmcvCookie(a.resetBeforeVersion);a.ga();a.ha();a.f();J=a.a(L);var O=Math.ceil((new Date).getTime()/n.ea);!a.idSyncDisableSyncs&&z.lb(J,O)&&(a.j(t,-1),
a.e(L,O));a.getMarketingCloudVisitorID();a.getAudienceManagerLocationHint();a.getAudienceManagerBlob();a.cb(a.serverState)}else a.ga(),a.ha();if(!a.idSyncDisableSyncs){z.mb();m.O(window,"load",function(){l.aa=i;p.$=p.p();p.Lb();var a=z;a.Ja()&&a.Q()});try{a.ra.X(function(a){z.X(a.data)},z.S)}catch(P){}}}
Visitor.getInstance=function(q,w){var x,B=window.s_c_il,a;0>q.indexOf("@")&&(q+="@AdobeOrg");if(B)for(a=0;a<B.length;a++)if((x=B[a])&&"Visitor"==x._c&&x.marketingCloudOrgID==q)return x;return new Visitor(q,w)};(function(){function q(){w.aa=x}var w=window.Visitor,x=w.Va,B=w.Sa;x||(x=!0);B||(B=!1);window.addEventListener?window.addEventListener("load",q):window.attachEvent&&window.attachEvent("onload",q);w.nb=(new Date).getTime()})();



/*
 Start ActivityMap Module

 The following module enables ActivityMap tracking in Adobe Analytics. ActivityMap
 allows you to view data overlays on your links and content to understand how
 users engage with your web site. If you do not intend to use ActivityMap, you
 can remove the following block of code from your AppMeasurement.js file.
 Additional documentation on how to configure ActivityMap is available at:
 https://marketing.adobe.com/resources/help/en_US/analytics/activitymap/getting-started-admins.html
*/
function AppMeasurement_Module_ActivityMap(f){function g(a,d){var b,c,n;if(a&&d&&(b=e.c[d]||(e.c[d]=d.split(","))))for(n=0;n<b.length&&(c=b[n++]);)if(-1<a.indexOf(c))return null;p=1;return a}function q(a,d,b,c,e){var g,h;if(a.dataset&&(h=a.dataset[d]))g=h;else if(a.getAttribute)if(h=a.getAttribute("data-"+b))g=h;else if(h=a.getAttribute(b))g=h;if(!g&&f.useForcedLinkTracking&&e&&(g="",d=a.onclick?""+a.onclick:"")){b=d.indexOf(c);var l,k;if(0<=b){for(b+=10;b<d.length&&0<="= \t\r\n".indexOf(d.charAt(b));)b++;
if(b<d.length){h=b;for(l=k=0;h<d.length&&(";"!=d.charAt(h)||l);)l?d.charAt(h)!=l||k?k="\\"==d.charAt(h)?!k:0:l=0:(l=d.charAt(h),'"'!=l&&"'"!=l&&(l=0)),h++;if(d=d.substring(b,h))a.e=new Function("s","var e;try{s.w."+c+"="+d+"}catch(e){}"),a.e(f)}}}return g||e&&f.w[c]}function r(a,d,b){var c;return(c=e[d](a,b))&&(p?(p=0,c):g(k(c),e[d+"Exclusions"]))}function s(a,d,b){var c;if(a&&!(1===(c=a.nodeType)&&(c=a.nodeName)&&(c=c.toUpperCase())&&t[c])&&(1===a.nodeType&&(c=a.nodeValue)&&(d[d.length]=c),b.a||
b.t||b.s||!a.getAttribute||((c=a.getAttribute("alt"))?b.a=c:(c=a.getAttribute("title"))?b.t=c:"IMG"==(""+a.nodeName).toUpperCase()&&(c=a.getAttribute("src")||a.src)&&(b.s=c)),(c=a.childNodes)&&c.length))for(a=0;a<c.length;a++)s(c[a],d,b)}function k(a){if(null==a||void 0==a)return a;try{return a.replace(RegExp("^[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+","mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+$",
"mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]{1,}","mg")," ").substring(0,254)}catch(d){}}var e=this;e.s=f;var m=window;m.s_c_in||(m.s_c_il=[],m.s_c_in=0);e._il=m.s_c_il;e._in=m.s_c_in;e._il[e._in]=e;m.s_c_in++;e._c="s_m";e.c={};var p=0,t={SCRIPT:1,STYLE:1,LINK:1,CANVAS:1};e._g=function(){var a,d,b,c=f.contextData,e=f.linkObject;(a=f.pageName||f.pageURL)&&(d=r(e,"link",f.linkName))&&(b=r(e,"region"))&&(c["a.activitymap.page"]=a.substring(0,
255),c["a.activitymap.link"]=128<d.length?d.substring(0,128):d,c["a.activitymap.region"]=127<b.length?b.substring(0,127):b,c["a.activitymap.pageIDType"]=f.pageName?1:0)};e.link=function(a,d){var b;if(d)b=g(k(d),e.linkExclusions);else if((b=a)&&!(b=q(a,"sObjectId","s-object-id","s_objectID",1))){var c,f;(f=g(k(a.innerText||a.textContent),e.linkExclusions))||(s(a,c=[],b={a:void 0,t:void 0,s:void 0}),(f=g(k(c.join(""))))||(f=g(k(b.a?b.a:b.t?b.t:b.s?b.s:void 0)))||!(c=(c=a.tagName)&&c.toUpperCase?c.toUpperCase():
"")||("INPUT"==c||"SUBMIT"==c&&a.value?f=g(k(a.value)):"IMAGE"==c&&a.src&&(f=g(k(a.src)))));b=f}return b};e.region=function(a){for(var d,b=e.regionIDAttribute||"id";a&&(a=a.parentNode);){if(d=q(a,b,b,b))return d;if("BODY"==a.nodeName)return"BODY"}}}
/* End ActivityMap Module */
/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ===============

AppMeasurement for JavaScript version: 1.8.0
Copyright 1996-2016 Adobe, Inc. All Rights Reserved
More info available at http://www.adobe.com/marketing-cloud.html
*/
function AppMeasurement(){var a=this;a.version="1.8.0";var h=window;h.s_c_in||(h.s_c_il=[],h.s_c_in=0);a._il=h.s_c_il;a._in=h.s_c_in;a._il[a._in]=a;h.s_c_in++;a._c="s_c";var n=h.AppMeasurement.Ob;n||(n=null);var p=h,l,r;try{for(l=p.parent,r=p.location;l&&l.location&&r&&""+l.location!=""+r&&p.location&&""+l.location!=""+p.location&&l.location.host==r.host;)p=l,l=p.parent}catch(s){}a.P=function(a){try{console.log(a)}catch(b){}};a.La=function(a){return""+parseInt(a)==""+a};a.replace=function(a,b,d){return!a||
0>a.indexOf(b)?a:a.split(b).join(d)};a.escape=function(c){var b,d;if(!c)return c;c=encodeURIComponent(c);for(b=0;7>b;b++)d="+~!*()'".substring(b,b+1),0<=c.indexOf(d)&&(c=a.replace(c,d,"%"+d.charCodeAt(0).toString(16).toUpperCase()));return c};a.unescape=function(c){if(!c)return c;c=0<=c.indexOf("+")?a.replace(c,"+"," "):c;try{return decodeURIComponent(c)}catch(b){}return unescape(c)};a.vb=function(){var c=h.location.hostname,b=a.fpCookieDomainPeriods,d;b||(b=a.cookieDomainPeriods);if(c&&!a.cookieDomain&&
!/^[0-9.]+$/.test(c)&&(b=b?parseInt(b):2,b=2<b?b:2,d=c.lastIndexOf("."),0<=d)){for(;0<=d&&1<b;)d=c.lastIndexOf(".",d-1),b--;a.cookieDomain=0<d?c.substring(d):c}return a.cookieDomain};a.c_r=a.cookieRead=function(c){c=a.escape(c);var b=" "+a.d.cookie,d=b.indexOf(" "+c+"="),f=0>d?d:b.indexOf(";",d);c=0>d?"":a.unescape(b.substring(d+2+c.length,0>f?b.length:f));return"[[B]]"!=c?c:""};a.c_w=a.cookieWrite=function(c,b,d){var f=a.vb(),e=a.cookieLifetime,g;b=""+b;e=e?(""+e).toUpperCase():"";d&&"SESSION"!=
e&&"NONE"!=e&&((g=""!=b?parseInt(e?e:0):-60)?(d=new Date,d.setTime(d.getTime()+1E3*g)):1==d&&(d=new Date,g=d.getYear(),d.setYear(g+5+(1900>g?1900:0))));return c&&"NONE"!=e?(a.d.cookie=a.escape(c)+"="+a.escape(""!=b?b:"[[B]]")+"; path=/;"+(d&&"SESSION"!=e?" expires="+d.toGMTString()+";":"")+(f?" domain="+f+";":""),a.cookieRead(c)==b):0};a.K=[];a.ia=function(c,b,d){if(a.Ea)return 0;a.maxDelay||(a.maxDelay=250);var f=0,e=(new Date).getTime()+a.maxDelay,g=a.d.visibilityState,k=["webkitvisibilitychange",
"visibilitychange"];g||(g=a.d.webkitVisibilityState);if(g&&"prerender"==g){if(!a.ja)for(a.ja=1,d=0;d<k.length;d++)a.d.addEventListener(k[d],function(){var c=a.d.visibilityState;c||(c=a.d.webkitVisibilityState);"visible"==c&&(a.ja=0,a.delayReady())});f=1;e=0}else d||a.p("_d")&&(f=1);f&&(a.K.push({m:c,a:b,t:e}),a.ja||setTimeout(a.delayReady,a.maxDelay));return f};a.delayReady=function(){var c=(new Date).getTime(),b=0,d;for(a.p("_d")?b=1:a.xa();0<a.K.length;){d=a.K.shift();if(b&&!d.t&&d.t>c){a.K.unshift(d);
setTimeout(a.delayReady,parseInt(a.maxDelay/2));break}a.Ea=1;a[d.m].apply(a,d.a);a.Ea=0}};a.setAccount=a.sa=function(c){var b,d;if(!a.ia("setAccount",arguments))if(a.account=c,a.allAccounts)for(b=a.allAccounts.concat(c.split(",")),a.allAccounts=[],b.sort(),d=0;d<b.length;d++)0!=d&&b[d-1]==b[d]||a.allAccounts.push(b[d]);else a.allAccounts=c.split(",")};a.foreachVar=function(c,b){var d,f,e,g,k="";e=f="";if(a.lightProfileID)d=a.O,(k=a.lightTrackVars)&&(k=","+k+","+a.na.join(",")+",");else{d=a.g;if(a.pe||
a.linkType)k=a.linkTrackVars,f=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(k=a[e].Mb,f=a[e].Lb));k&&(k=","+k+","+a.G.join(",")+",");f&&k&&(k+=",events,")}b&&(b=","+b+",");for(f=0;f<d.length;f++)e=d[f],(g=a[e])&&(!k||0<=k.indexOf(","+e+","))&&(!b||0<=b.indexOf(","+e+","))&&c(e,g)};a.r=function(c,b,d,f,e){var g="",k,m,h,t,l=0;"contextData"==c&&(c="c");if(b){for(k in b)if(!(Object.prototype[k]||e&&k.substring(0,e.length)!=e)&&b[k]&&(!d||0<=d.indexOf(","+(f?f+
".":"")+k+","))){h=!1;if(l)for(m=0;m<l.length;m++)k.substring(0,l[m].length)==l[m]&&(h=!0);if(!h&&(""==g&&(g+="&"+c+"."),m=b[k],e&&(k=k.substring(e.length)),0<k.length))if(h=k.indexOf("."),0<h)m=k.substring(0,h),h=(e?e:"")+m+".",l||(l=[]),l.push(h),g+=a.r(m,b,d,f,h);else if("boolean"==typeof m&&(m=m?"true":"false"),m){if("retrieveLightData"==f&&0>e.indexOf(".contextData."))switch(h=k.substring(0,4),t=k.substring(4),k){case "transactionID":k="xact";break;case "channel":k="ch";break;case "campaign":k=
"v0";break;default:a.La(t)&&("prop"==h?k="c"+t:"eVar"==h?k="v"+t:"list"==h?k="l"+t:"hier"==h&&(k="h"+t,m=m.substring(0,255)))}g+="&"+a.escape(k)+"="+a.escape(m)}}""!=g&&(g+="&."+c)}return g};a.usePostbacks=0;a.yb=function(){var c="",b,d,f,e,g,k,m,h,l="",p="",q=e="";if(a.lightProfileID)b=a.O,(l=a.lightTrackVars)&&(l=","+l+","+a.na.join(",")+",");else{b=a.g;if(a.pe||a.linkType)l=a.linkTrackVars,p=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(l=a[e].Mb,p=a[e].Lb));
l&&(l=","+l+","+a.G.join(",")+",");p&&(p=","+p+",",l&&(l+=",events,"));a.events2&&(q+=(""!=q?",":"")+a.events2)}if(a.visitor&&a.visitor.getCustomerIDs){e=n;if(g=a.visitor.getCustomerIDs())for(d in g)Object.prototype[d]||(f=g[d],"object"==typeof f&&(e||(e={}),f.id&&(e[d+".id"]=f.id),f.authState&&(e[d+".as"]=f.authState)));e&&(c+=a.r("cid",e))}a.AudienceManagement&&a.AudienceManagement.isReady()&&(c+=a.r("d",a.AudienceManagement.getEventCallConfigParams()));for(d=0;d<b.length;d++){e=b[d];g=a[e];f=e.substring(0,
4);k=e.substring(4);!g&&"events"==e&&q&&(g=q,q="");if(g&&(!l||0<=l.indexOf(","+e+","))){switch(e){case "supplementalDataID":e="sdid";break;case "timestamp":e="ts";break;case "dynamicVariablePrefix":e="D";break;case "visitorID":e="vid";break;case "marketingCloudVisitorID":e="mid";break;case "analyticsVisitorID":e="aid";break;case "audienceManagerLocationHint":e="aamlh";break;case "audienceManagerBlob":e="aamb";break;case "authState":e="as";break;case "pageURL":e="g";255<g.length&&(a.pageURLRest=g.substring(255),
g=g.substring(0,255));break;case "pageURLRest":e="-g";break;case "referrer":e="r";break;case "vmk":case "visitorMigrationKey":e="vmt";break;case "visitorMigrationServer":e="vmf";a.ssl&&a.visitorMigrationServerSecure&&(g="");break;case "visitorMigrationServerSecure":e="vmf";!a.ssl&&a.visitorMigrationServer&&(g="");break;case "charSet":e="ce";break;case "visitorNamespace":e="ns";break;case "cookieDomainPeriods":e="cdp";break;case "cookieLifetime":e="cl";break;case "variableProvider":e="vvp";break;case "currencyCode":e=
"cc";break;case "channel":e="ch";break;case "transactionID":e="xact";break;case "campaign":e="v0";break;case "latitude":e="lat";break;case "longitude":e="lon";break;case "resolution":e="s";break;case "colorDepth":e="c";break;case "javascriptVersion":e="j";break;case "javaEnabled":e="v";break;case "cookiesEnabled":e="k";break;case "browserWidth":e="bw";break;case "browserHeight":e="bh";break;case "connectionType":e="ct";break;case "homepage":e="hp";break;case "events":q&&(g+=(""!=g?",":"")+q);if(p)for(k=
g.split(","),g="",f=0;f<k.length;f++)m=k[f],h=m.indexOf("="),0<=h&&(m=m.substring(0,h)),h=m.indexOf(":"),0<=h&&(m=m.substring(0,h)),0<=p.indexOf(","+m+",")&&(g+=(g?",":"")+k[f]);break;case "events2":g="";break;case "contextData":c+=a.r("c",a[e],l,e);g="";break;case "lightProfileID":e="mtp";break;case "lightStoreForSeconds":e="mtss";a.lightProfileID||(g="");break;case "lightIncrementBy":e="mti";a.lightProfileID||(g="");break;case "retrieveLightProfiles":e="mtsr";break;case "deleteLightProfiles":e=
"mtsd";break;case "retrieveLightData":a.retrieveLightProfiles&&(c+=a.r("mts",a[e],l,e));g="";break;default:a.La(k)&&("prop"==f?e="c"+k:"eVar"==f?e="v"+k:"list"==f?e="l"+k:"hier"==f&&(e="h"+k,g=g.substring(0,255)))}g&&(c+="&"+e+"="+("pev"!=e.substring(0,3)?a.escape(g):g))}"pev3"==e&&a.e&&(c+=a.e)}return c};a.D=function(a){var b=a.tagName;if("undefined"!=""+a.Rb||"undefined"!=""+a.Hb&&"HTML"!=(""+a.Hb).toUpperCase())return"";b=b&&b.toUpperCase?b.toUpperCase():"";"SHAPE"==b&&(b="");b&&(("INPUT"==b||
"BUTTON"==b)&&a.type&&a.type.toUpperCase?b=a.type.toUpperCase():!b&&a.href&&(b="A"));return b};a.Ha=function(a){var b=h.location,d=a.href?a.href:"",f,e,g;f=d.indexOf(":");e=d.indexOf("?");g=d.indexOf("/");d&&(0>f||0<=e&&f>e||0<=g&&f>g)&&(e=a.protocol&&1<a.protocol.length?a.protocol:b.protocol?b.protocol:"",f=b.pathname.lastIndexOf("/"),d=(e?e+"//":"")+(a.host?a.host:b.host?b.host:"")+("/"!=d.substring(0,1)?b.pathname.substring(0,0>f?0:f)+"/":"")+d);return d};a.L=function(c){var b=a.D(c),d,f,e="",
g=0;return b&&(d=c.protocol,f=c.onclick,!c.href||"A"!=b&&"AREA"!=b||f&&d&&!(0>d.toLowerCase().indexOf("javascript"))?f?(e=a.replace(a.replace(a.replace(a.replace(""+f,"\r",""),"\n",""),"\t","")," ",""),g=2):"INPUT"==b||"SUBMIT"==b?(c.value?e=c.value:c.innerText?e=c.innerText:c.textContent&&(e=c.textContent),g=3):"IMAGE"==b&&c.src&&(e=c.src):e=a.Ha(c),e)?{id:e.substring(0,100),type:g}:0};a.Pb=function(c){for(var b=a.D(c),d=a.L(c);c&&!d&&"BODY"!=b;)if(c=c.parentElement?c.parentElement:c.parentNode)b=
a.D(c),d=a.L(c);d&&"BODY"!=b||(c=0);c&&(b=c.onclick?""+c.onclick:"",0<=b.indexOf(".tl(")||0<=b.indexOf(".trackLink("))&&(c=0);return c};a.Gb=function(){var c,b,d=a.linkObject,f=a.linkType,e=a.linkURL,g,k;a.oa=1;d||(a.oa=0,d=a.clickObject);if(d){c=a.D(d);for(b=a.L(d);d&&!b&&"BODY"!=c;)if(d=d.parentElement?d.parentElement:d.parentNode)c=a.D(d),b=a.L(d);b&&"BODY"!=c||(d=0);if(d&&!a.linkObject){var m=d.onclick?""+d.onclick:"";if(0<=m.indexOf(".tl(")||0<=m.indexOf(".trackLink("))d=0}}else a.oa=1;!e&&d&&
(e=a.Ha(d));e&&!a.linkLeaveQueryString&&(g=e.indexOf("?"),0<=g&&(e=e.substring(0,g)));if(!f&&e){var l=0,p=0,n;if(a.trackDownloadLinks&&a.linkDownloadFileTypes)for(m=e.toLowerCase(),g=m.indexOf("?"),k=m.indexOf("#"),0<=g?0<=k&&k<g&&(g=k):g=k,0<=g&&(m=m.substring(0,g)),g=a.linkDownloadFileTypes.toLowerCase().split(","),k=0;k<g.length;k++)(n=g[k])&&m.substring(m.length-(n.length+1))=="."+n&&(f="d");if(a.trackExternalLinks&&!f&&(m=e.toLowerCase(),a.Ka(m)&&(a.linkInternalFilters||(a.linkInternalFilters=
h.location.hostname),g=0,a.linkExternalFilters?(g=a.linkExternalFilters.toLowerCase().split(","),l=1):a.linkInternalFilters&&(g=a.linkInternalFilters.toLowerCase().split(",")),g))){for(k=0;k<g.length;k++)n=g[k],0<=m.indexOf(n)&&(p=1);p?l&&(f="e"):l||(f="e")}}a.linkObject=d;a.linkURL=e;a.linkType=f;if(a.trackClickMap||a.trackInlineStats)a.e="",d&&(f=a.pageName,e=1,d=d.sourceIndex,f||(f=a.pageURL,e=0),h.s_objectID&&(b.id=h.s_objectID,d=b.type=1),f&&b&&b.id&&c&&(a.e="&pid="+a.escape(f.substring(0,255))+
(e?"&pidt="+e:"")+"&oid="+a.escape(b.id.substring(0,100))+(b.type?"&oidt="+b.type:"")+"&ot="+c+(d?"&oi="+d:"")))};a.zb=function(){var c=a.oa,b=a.linkType,d=a.linkURL,f=a.linkName;b&&(d||f)&&(b=b.toLowerCase(),"d"!=b&&"e"!=b&&(b="o"),a.pe="lnk_"+b,a.pev1=d?a.escape(d):"",a.pev2=f?a.escape(f):"",c=1);a.abort&&(c=0);if(a.trackClickMap||a.trackInlineStats||a.ActivityMap){var b={},d=0,e=a.cookieRead("s_sq"),g=e?e.split("&"):0,k,m,h,e=0;if(g)for(k=0;k<g.length;k++)m=g[k].split("="),f=a.unescape(m[0]).split(","),
m=a.unescape(m[1]),b[m]=f;f=a.account.split(",");k={};for(h in a.contextData)h&&!Object.prototype[h]&&"a.activitymap."==h.substring(0,14)&&(k[h]=a.contextData[h],a.contextData[h]="");a.e=a.r("c",k)+(a.e?a.e:"");if(c||a.e){c&&!a.e&&(e=1);for(m in b)if(!Object.prototype[m])for(h=0;h<f.length;h++)for(e&&(g=b[m].join(","),g==a.account&&(a.e+=("&"!=m.charAt(0)?"&":"")+m,b[m]=[],d=1)),k=0;k<b[m].length;k++)g=b[m][k],g==f[h]&&(e&&(a.e+="&u="+a.escape(g)+("&"!=m.charAt(0)?"&":"")+m+"&u=0"),b[m].splice(k,
1),d=1);c||(d=1);if(d){e="";k=2;!c&&a.e&&(e=a.escape(f.join(","))+"="+a.escape(a.e),k=1);for(m in b)!Object.prototype[m]&&0<k&&0<b[m].length&&(e+=(e?"&":"")+a.escape(b[m].join(","))+"="+a.escape(m),k--);a.cookieWrite("s_sq",e)}}}return c};a.Ab=function(){if(!a.Kb){var c=new Date,b=p.location,d,f,e=f=d="",g="",k="",h="1.2",l=a.cookieWrite("s_cc","true",0)?"Y":"N",n="",q="";if(c.setUTCDate&&(h="1.3",(0).toPrecision&&(h="1.5",c=[],c.forEach))){h="1.6";f=0;d={};try{f=new Iterator(d),f.next&&(h="1.7",
c.reduce&&(h="1.8",h.trim&&(h="1.8.1",Date.parse&&(h="1.8.2",Object.create&&(h="1.8.5")))))}catch(r){}}d=screen.width+"x"+screen.height;e=navigator.javaEnabled()?"Y":"N";f=screen.pixelDepth?screen.pixelDepth:screen.colorDepth;g=a.w.innerWidth?a.w.innerWidth:a.d.documentElement.offsetWidth;k=a.w.innerHeight?a.w.innerHeight:a.d.documentElement.offsetHeight;try{a.b.addBehavior("#default#homePage"),n=a.b.Qb(b)?"Y":"N"}catch(s){}try{a.b.addBehavior("#default#clientCaps"),q=a.b.connectionType}catch(u){}a.resolution=
d;a.colorDepth=f;a.javascriptVersion=h;a.javaEnabled=e;a.cookiesEnabled=l;a.browserWidth=g;a.browserHeight=k;a.connectionType=q;a.homepage=n;a.Kb=1}};a.Q={};a.loadModule=function(c,b){var d=a.Q[c];if(!d){d=h["AppMeasurement_Module_"+c]?new h["AppMeasurement_Module_"+c](a):{};a.Q[c]=a[c]=d;d.cb=function(){return d.hb};d.ib=function(b){if(d.hb=b)a[c+"_onLoad"]=b,a.ia(c+"_onLoad",[a,d],1)||b(a,d)};try{Object.defineProperty?Object.defineProperty(d,"onLoad",{get:d.cb,set:d.ib}):d._olc=1}catch(f){d._olc=
1}}b&&(a[c+"_onLoad"]=b,a.ia(c+"_onLoad",[a,d],1)||b(a,d))};a.p=function(c){var b,d;for(b in a.Q)if(!Object.prototype[b]&&(d=a.Q[b])&&(d._olc&&d.onLoad&&(d._olc=0,d.onLoad(a,d)),d[c]&&d[c]()))return 1;return 0};a.Cb=function(){var c=Math.floor(1E13*Math.random()),b=a.visitorSampling,d=a.visitorSamplingGroup,d="s_vsn_"+(a.visitorNamespace?a.visitorNamespace:a.account)+(d?"_"+d:""),f=a.cookieRead(d);if(b){b*=100;f&&(f=parseInt(f));if(!f){if(!a.cookieWrite(d,c))return 0;f=c}if(f%1E4>b)return 0}return 1};
a.R=function(c,b){var d,f,e,g,k,h;for(d=0;2>d;d++)for(f=0<d?a.Aa:a.g,e=0;e<f.length;e++)if(g=f[e],(k=c[g])||c["!"+g]){if(!b&&("contextData"==g||"retrieveLightData"==g)&&a[g])for(h in a[g])k[h]||(k[h]=a[g][h]);a[g]=k}};a.Ua=function(c,b){var d,f,e,g;for(d=0;2>d;d++)for(f=0<d?a.Aa:a.g,e=0;e<f.length;e++)g=f[e],c[g]=a[g],b||c[g]||(c["!"+g]=1)};a.ub=function(a){var b,d,f,e,g,k=0,h,l="",n="";if(a&&255<a.length&&(b=""+a,d=b.indexOf("?"),0<d&&(h=b.substring(d+1),b=b.substring(0,d),e=b.toLowerCase(),f=0,
"http://"==e.substring(0,7)?f+=7:"https://"==e.substring(0,8)&&(f+=8),d=e.indexOf("/",f),0<d&&(e=e.substring(f,d),g=b.substring(d),b=b.substring(0,d),0<=e.indexOf("google")?k=",q,ie,start,search_key,word,kw,cd,":0<=e.indexOf("yahoo.co")&&(k=",p,ei,"),k&&h)))){if((a=h.split("&"))&&1<a.length){for(f=0;f<a.length;f++)e=a[f],d=e.indexOf("="),0<d&&0<=k.indexOf(","+e.substring(0,d)+",")?l+=(l?"&":"")+e:n+=(n?"&":"")+e;l&&n?h=l+"&"+n:n=""}d=253-(h.length-n.length)-b.length;a=b+(0<d?g.substring(0,d):"")+
"?"+h}return a};a.$a=function(c){var b=a.d.visibilityState,d=["webkitvisibilitychange","visibilitychange"];b||(b=a.d.webkitVisibilityState);if(b&&"prerender"==b){if(c)for(b=0;b<d.length;b++)a.d.addEventListener(d[b],function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&c()});return!1}return!0};a.ea=!1;a.I=!1;a.kb=function(){a.I=!0;a.j()};a.ca=!1;a.V=!1;a.gb=function(c){a.marketingCloudVisitorID=c;a.V=!0;a.j()};a.fa=!1;a.W=!1;a.lb=function(c){a.visitorOptedOut=c;a.W=!0;
a.j()};a.Z=!1;a.S=!1;a.Wa=function(c){a.analyticsVisitorID=c;a.S=!0;a.j()};a.ba=!1;a.U=!1;a.Ya=function(c){a.audienceManagerLocationHint=c;a.U=!0;a.j()};a.aa=!1;a.T=!1;a.Xa=function(c){a.audienceManagerBlob=c;a.T=!0;a.j()};a.Za=function(c){a.maxDelay||(a.maxDelay=250);return a.p("_d")?(c&&setTimeout(function(){c()},a.maxDelay),!1):!0};a.da=!1;a.H=!1;a.xa=function(){a.H=!0;a.j()};a.isReadyToTrack=function(){var c=!0,b=a.visitor,d,f,e;a.ea||a.I||(a.$a(a.kb)?a.I=!0:a.ea=!0);if(a.ea&&!a.I)return!1;b&&
b.isAllowed()&&(a.ca||a.marketingCloudVisitorID||!b.getMarketingCloudVisitorID||(a.ca=!0,a.marketingCloudVisitorID=b.getMarketingCloudVisitorID([a,a.gb]),a.marketingCloudVisitorID&&(a.V=!0)),a.fa||a.visitorOptedOut||!b.isOptedOut||(a.fa=!0,a.visitorOptedOut=b.isOptedOut([a,a.lb]),a.visitorOptedOut!=n&&(a.W=!0)),a.Z||a.analyticsVisitorID||!b.getAnalyticsVisitorID||(a.Z=!0,a.analyticsVisitorID=b.getAnalyticsVisitorID([a,a.Wa]),a.analyticsVisitorID&&(a.S=!0)),a.ba||a.audienceManagerLocationHint||!b.getAudienceManagerLocationHint||
(a.ba=!0,a.audienceManagerLocationHint=b.getAudienceManagerLocationHint([a,a.Ya]),a.audienceManagerLocationHint&&(a.U=!0)),a.aa||a.audienceManagerBlob||!b.getAudienceManagerBlob||(a.aa=!0,a.audienceManagerBlob=b.getAudienceManagerBlob([a,a.Xa]),a.audienceManagerBlob&&(a.T=!0)),c=a.ca&&!a.V&&!a.marketingCloudVisitorID,b=a.Z&&!a.S&&!a.analyticsVisitorID,d=a.ba&&!a.U&&!a.audienceManagerLocationHint,f=a.aa&&!a.T&&!a.audienceManagerBlob,e=a.fa&&!a.W,c=c||b||d||f||e?!1:!0);a.da||a.H||(a.Za(a.xa)?a.H=!0:
a.da=!0);a.da&&!a.H&&(c=!1);return c};a.o=n;a.u=0;a.callbackWhenReadyToTrack=function(c,b,d){var f;f={};f.pb=c;f.ob=b;f.mb=d;a.o==n&&(a.o=[]);a.o.push(f);0==a.u&&(a.u=setInterval(a.j,100))};a.j=function(){var c;if(a.isReadyToTrack()&&(a.jb(),a.o!=n))for(;0<a.o.length;)c=a.o.shift(),c.ob.apply(c.pb,c.mb)};a.jb=function(){a.u&&(clearInterval(a.u),a.u=0)};a.eb=function(c){var b,d,f=n,e=n;if(!a.isReadyToTrack()){b=[];if(c!=n)for(d in f={},c)f[d]=c[d];e={};a.Ua(e,!0);b.push(f);b.push(e);a.callbackWhenReadyToTrack(a,
a.track,b);return!0}return!1};a.wb=function(){var c=a.cookieRead("s_fid"),b="",d="",f;f=8;var e=4;if(!c||0>c.indexOf("-")){for(c=0;16>c;c++)f=Math.floor(Math.random()*f),b+="0123456789ABCDEF".substring(f,f+1),f=Math.floor(Math.random()*e),d+="0123456789ABCDEF".substring(f,f+1),f=e=16;c=b+"-"+d}a.cookieWrite("s_fid",c,1)||(c=0);return c};a.t=a.track=function(c,b){var d,f=new Date,e="s"+Math.floor(f.getTime()/108E5)%10+Math.floor(1E13*Math.random()),g=f.getYear(),g="t="+a.escape(f.getDate()+"/"+f.getMonth()+
"/"+(1900>g?g+1900:g)+" "+f.getHours()+":"+f.getMinutes()+":"+f.getSeconds()+" "+f.getDay()+" "+f.getTimezoneOffset());a.visitor&&a.visitor.getAuthState&&(a.authState=a.visitor.getAuthState());a.p("_s");a.eb(c)||(b&&a.R(b),c&&(d={},a.Ua(d,0),a.R(c)),a.Cb()&&!a.visitorOptedOut&&(a.analyticsVisitorID||a.marketingCloudVisitorID||(a.fid=a.wb()),a.Gb(),a.usePlugins&&a.doPlugins&&a.doPlugins(a),a.account&&(a.abort||(a.visitor&&!a.supplementalDataID&&a.visitor.getSupplementalDataID&&(a.supplementalDataID=
a.visitor.getSupplementalDataID("AppMeasurement:"+a._in,a.expectSupplementalData?!1:!0)),a.trackOffline&&!a.timestamp&&(a.timestamp=Math.floor(f.getTime()/1E3)),f=h.location,a.pageURL||(a.pageURL=f.href?f.href:f),a.referrer||a.Va||(a.referrer=p.document.referrer),a.Va=1,a.referrer=a.ub(a.referrer),a.p("_g")),a.zb()&&!a.abort&&(a.Ab(),g+=a.yb(),a.Fb(e,g),a.p("_t"),a.referrer=""))),c&&a.R(d,1));a.abort=a.supplementalDataID=a.timestamp=a.pageURLRest=a.linkObject=a.clickObject=a.linkURL=a.linkName=a.linkType=
h.s_objectID=a.pe=a.pev1=a.pev2=a.pev3=a.e=a.lightProfileID=0};a.za=[];a.registerPreTrackCallback=function(c){for(var b=[],d=1;d<arguments.length;d++)b.push(arguments[d]);"function"==typeof c?a.za.push([c,b]):a.debugTracking&&a.P("DEBUG: Non function type passed to registerPreTrackCallback")};a.bb=function(c){a.wa(a.za,c)};a.ya=[];a.registerPostTrackCallback=function(c){for(var b=[],d=1;d<arguments.length;d++)b.push(arguments[d]);"function"==typeof c?a.ya.push([c,b]):a.debugTracking&&a.P("DEBUG: Non function type passed to registerPostTrackCallback")};
a.ab=function(c){a.wa(a.ya,c)};a.wa=function(c,b){if("object"==typeof c)for(var d=0;d<c.length;d++){var f=c[d][0],e=c[d][1];e.unshift(b);if("function"==typeof f)try{f.apply(null,e)}catch(g){a.debugTracking&&a.P(g.message)}}};a.tl=a.trackLink=function(c,b,d,f,e){a.linkObject=c;a.linkType=b;a.linkName=d;e&&(a.l=c,a.A=e);return a.track(f)};a.trackLight=function(c,b,d,f){a.lightProfileID=c;a.lightStoreForSeconds=b;a.lightIncrementBy=d;return a.track(f)};a.clearVars=function(){var c,b;for(c=0;c<a.g.length;c++)if(b=
a.g[c],"prop"==b.substring(0,4)||"eVar"==b.substring(0,4)||"hier"==b.substring(0,4)||"list"==b.substring(0,4)||"channel"==b||"events"==b||"eventList"==b||"products"==b||"productList"==b||"purchaseID"==b||"transactionID"==b||"state"==b||"zip"==b||"campaign"==b)a[b]=void 0};a.tagContainerMarker="";a.Fb=function(c,b){var d,f=a.trackingServer;d="";var e=a.dc,g="sc.",h=a.visitorNamespace;f?a.trackingServerSecure&&a.ssl&&(f=a.trackingServerSecure):(h||(h=a.account,f=h.indexOf(","),0<=f&&(h=h.substring(0,
f)),h=h.replace(/[^A-Za-z0-9]/g,"")),d||(d="2o7.net"),e=e?(""+e).toLowerCase():"d1","2o7.net"==d&&("d1"==e?e="112":"d2"==e&&(e="122"),g=""),f=h+"."+e+"."+g+d);d=a.ssl?"https://":"http://";e=a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks;d+=f+"/b/ss/"+a.account+"/"+(a.mobile?"5.":"")+(e?"10":"1")+"/JS-"+a.version+(a.Jb?"T":"")+(a.tagContainerMarker?"-"+a.tagContainerMarker:"")+"/"+c+"?AQB=1&ndh=1&pf=1&"+(e?"callback=s_c_il["+a._in+"].doPostbacks&et=1&":"")+b+"&AQE=1";a.bb(d);
a.sb(d);a.ka()};a.Ta=/{(%?)(.*?)(%?)}/;a.Nb=RegExp(a.Ta.source,"g");a.tb=function(c){if("object"==typeof c.dests)for(var b=0;b<c.dests.length;++b){var d=c.dests[b];if("string"==typeof d.c&&"aa."==d.id.substr(0,3))for(var f=d.c.match(a.Nb),e=0;e<f.length;++e){var g=f[e],h=g.match(a.Ta),l="";"%"==h[1]&&"timezone_offset"==h[2]?l=(new Date).getTimezoneOffset():"%"==h[1]&&"timestampz"==h[2]&&(l=a.xb());d.c=d.c.replace(g,a.escape(l))}}};a.xb=function(){var c=new Date,b=new Date(6E4*Math.abs(c.getTimezoneOffset()));
return a.k(4,c.getFullYear())+"-"+a.k(2,c.getMonth()+1)+"-"+a.k(2,c.getDate())+"T"+a.k(2,c.getHours())+":"+a.k(2,c.getMinutes())+":"+a.k(2,c.getSeconds())+(0<c.getTimezoneOffset()?"-":"+")+a.k(2,b.getUTCHours())+":"+a.k(2,b.getUTCMinutes())};a.k=function(a,b){return(Array(a+1).join(0)+b).slice(-a)};a.ta={};a.doPostbacks=function(c){if("object"==typeof c)if(a.tb(c),"object"==typeof a.AudienceManagement&&"function"==typeof a.AudienceManagement.isReady&&a.AudienceManagement.isReady()&&"function"==typeof a.AudienceManagement.passData)a.AudienceManagement.passData(c);
else if("object"==typeof c&&"object"==typeof c.dests)for(var b=0;b<c.dests.length;++b){var d=c.dests[b];"object"==typeof d&&"string"==typeof d.c&&"string"==typeof d.id&&"aa."==d.id.substr(0,3)&&(a.ta[d.id]=new Image,a.ta[d.id].alt="",a.ta[d.id].src=d.c)}};a.sb=function(c){a.i||a.Bb();a.i.push(c);a.ma=a.C();a.Ra()};a.Bb=function(){a.i=a.Db();a.i||(a.i=[])};a.Db=function(){var c,b;if(a.ra()){try{(b=h.localStorage.getItem(a.pa()))&&(c=h.JSON.parse(b))}catch(d){}return c}};a.ra=function(){var c=!0;a.trackOffline&&
a.offlineFilename&&h.localStorage&&h.JSON||(c=!1);return c};a.Ia=function(){var c=0;a.i&&(c=a.i.length);a.q&&c++;return c};a.ka=function(){if(a.q&&(a.B&&a.B.complete&&a.B.F&&a.B.va(),a.q))return;a.Ja=n;if(a.qa)a.ma>a.N&&a.Pa(a.i),a.ua(500);else{var c=a.nb();if(0<c)a.ua(c);else if(c=a.Fa())a.q=1,a.Eb(c),a.Ib(c)}};a.ua=function(c){a.Ja||(c||(c=0),a.Ja=setTimeout(a.ka,c))};a.nb=function(){var c;if(!a.trackOffline||0>=a.offlineThrottleDelay)return 0;c=a.C()-a.Oa;return a.offlineThrottleDelay<c?0:a.offlineThrottleDelay-
c};a.Fa=function(){if(0<a.i.length)return a.i.shift()};a.Eb=function(c){if(a.debugTracking){var b="AppMeasurement Debug: "+c;c=c.split("&");var d;for(d=0;d<c.length;d++)b+="\n\t"+a.unescape(c[d]);a.P(b)}};a.fb=function(){return a.marketingCloudVisitorID||a.analyticsVisitorID};a.Y=!1;var q;try{q=JSON.parse('{"x":"y"}')}catch(u){q=null}q&&"y"==q.x?(a.Y=!0,a.X=function(a){return JSON.parse(a)}):h.$&&h.$.parseJSON?(a.X=function(a){return h.$.parseJSON(a)},a.Y=!0):a.X=function(){return null};a.Ib=function(c){var b,
d,f;a.fb()&&2047<c.length&&("undefined"!=typeof XMLHttpRequest&&(b=new XMLHttpRequest,"withCredentials"in b?d=1:b=0),b||"undefined"==typeof XDomainRequest||(b=new XDomainRequest,d=2),b&&(a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks)&&(a.Y?b.Ba=!0:b=0));!b&&a.Sa&&(c=c.substring(0,2047));!b&&a.d.createElement&&(0!=a.usePostbacks||a.AudienceManagement&&a.AudienceManagement.isReady())&&(b=a.d.createElement("SCRIPT"))&&"async"in b&&((f=(f=a.d.getElementsByTagName("HEAD"))&&f[0]?
f[0]:a.d.body)?(b.type="text/javascript",b.setAttribute("async","async"),d=3):b=0);b||(b=new Image,b.alt="",b.abort||"undefined"===typeof h.InstallTrigger||(b.abort=function(){b.src=n}));b.Da=function(){try{b.F&&(clearTimeout(b.F),b.F=0)}catch(a){}};b.onload=b.va=function(){a.ab(c);b.Da();a.rb();a.ga();a.q=0;a.ka();if(b.Ba){b.Ba=!1;try{a.doPostbacks(a.X(b.responseText))}catch(d){}}};b.onabort=b.onerror=b.Ga=function(){b.Da();(a.trackOffline||a.qa)&&a.q&&a.i.unshift(a.qb);a.q=0;a.ma>a.N&&a.Pa(a.i);
a.ga();a.ua(500)};b.onreadystatechange=function(){4==b.readyState&&(200==b.status?b.va():b.Ga())};a.Oa=a.C();if(1==d||2==d){var e=c.indexOf("?");f=c.substring(0,e);e=c.substring(e+1);e=e.replace(/&callback=[a-zA-Z0-9_.\[\]]+/,"");1==d?(b.open("POST",f,!0),b.send(e)):2==d&&(b.open("POST",f),b.send(e))}else if(b.src=c,3==d){if(a.Ma)try{f.removeChild(a.Ma)}catch(g){}f.firstChild?f.insertBefore(b,f.firstChild):f.appendChild(b);a.Ma=a.B}b.F=setTimeout(function(){b.F&&(b.complete?b.va():(a.trackOffline&&
b.abort&&b.abort(),b.Ga()))},5E3);a.qb=c;a.B=h["s_i_"+a.replace(a.account,",","_")]=b;if(a.useForcedLinkTracking&&a.J||a.A)a.forcedLinkTrackingTimeout||(a.forcedLinkTrackingTimeout=250),a.ha=setTimeout(a.ga,a.forcedLinkTrackingTimeout)};a.rb=function(){if(a.ra()&&!(a.Na>a.N))try{h.localStorage.removeItem(a.pa()),a.Na=a.C()}catch(c){}};a.Pa=function(c){if(a.ra()){a.Ra();try{h.localStorage.setItem(a.pa(),h.JSON.stringify(c)),a.N=a.C()}catch(b){}}};a.Ra=function(){if(a.trackOffline){if(!a.offlineLimit||
0>=a.offlineLimit)a.offlineLimit=10;for(;a.i.length>a.offlineLimit;)a.Fa()}};a.forceOffline=function(){a.qa=!0};a.forceOnline=function(){a.qa=!1};a.pa=function(){return a.offlineFilename+"-"+a.visitorNamespace+a.account};a.C=function(){return(new Date).getTime()};a.Ka=function(a){a=a.toLowerCase();return 0!=a.indexOf("#")&&0!=a.indexOf("about:")&&0!=a.indexOf("opera:")&&0!=a.indexOf("javascript:")?!0:!1};a.setTagContainer=function(c){var b,d,f;a.Jb=c;for(b=0;b<a._il.length;b++)if((d=a._il[b])&&"s_l"==
d._c&&d.tagContainerName==c){a.R(d);if(d.lmq)for(b=0;b<d.lmq.length;b++)f=d.lmq[b],a.loadModule(f.n);if(d.ml)for(f in d.ml)if(a[f])for(b in c=a[f],f=d.ml[f],f)!Object.prototype[b]&&("function"!=typeof f[b]||0>(""+f[b]).indexOf("s_c_il"))&&(c[b]=f[b]);if(d.mmq)for(b=0;b<d.mmq.length;b++)f=d.mmq[b],a[f.m]&&(c=a[f.m],c[f.f]&&"function"==typeof c[f.f]&&(f.a?c[f.f].apply(c,f.a):c[f.f].apply(c)));if(d.tq)for(b=0;b<d.tq.length;b++)a.track(d.tq[b]);d.s=a;break}};a.Util={urlEncode:a.escape,urlDecode:a.unescape,
cookieRead:a.cookieRead,cookieWrite:a.cookieWrite,getQueryParam:function(c,b,d){var f;b||(b=a.pageURL?a.pageURL:h.location);d||(d="&");return c&&b&&(b=""+b,f=b.indexOf("?"),0<=f&&(b=d+b.substring(f+1)+d,f=b.indexOf(d+c+"="),0<=f&&(b=b.substring(f+d.length+c.length+1),f=b.indexOf(d),0<=f&&(b=b.substring(0,f)),0<b.length)))?a.unescape(b):""}};a.G="supplementalDataID timestamp dynamicVariablePrefix visitorID marketingCloudVisitorID analyticsVisitorID audienceManagerLocationHint authState fid vmk visitorMigrationKey visitorMigrationServer visitorMigrationServerSecure charSet visitorNamespace cookieDomainPeriods fpCookieDomainPeriods cookieLifetime pageName pageURL referrer contextData currencyCode lightProfileID lightStoreForSeconds lightIncrementBy retrieveLightProfiles deleteLightProfiles retrieveLightData".split(" ");
a.g=a.G.concat("purchaseID variableProvider channel server pageType transactionID campaign state zip events events2 products audienceManagerBlob tnt".split(" "));a.na="timestamp charSet visitorNamespace cookieDomainPeriods cookieLifetime contextData lightProfileID lightStoreForSeconds lightIncrementBy".split(" ");a.O=a.na.slice(0);a.Aa="account allAccounts debugTracking visitor visitorOptedOut trackOffline offlineLimit offlineThrottleDelay offlineFilename usePlugins doPlugins configURL visitorSampling visitorSamplingGroup linkObject clickObject linkURL linkName linkType trackDownloadLinks trackExternalLinks trackClickMap trackInlineStats linkLeaveQueryString linkTrackVars linkTrackEvents linkDownloadFileTypes linkExternalFilters linkInternalFilters useForcedLinkTracking forcedLinkTrackingTimeout trackingServer trackingServerSecure ssl abort mobile dc lightTrackVars maxDelay expectSupplementalData usePostbacks registerPreTrackCallback registerPostTrackCallback AudienceManagement".split(" ");
for(l=0;250>=l;l++)76>l&&(a.g.push("prop"+l),a.O.push("prop"+l)),a.g.push("eVar"+l),a.O.push("eVar"+l),6>l&&a.g.push("hier"+l),4>l&&a.g.push("list"+l);l="pe pev1 pev2 pev3 latitude longitude resolution colorDepth javascriptVersion javaEnabled cookiesEnabled browserWidth browserHeight connectionType homepage pageURLRest".split(" ");a.g=a.g.concat(l);a.G=a.G.concat(l);a.ssl=0<=h.location.protocol.toLowerCase().indexOf("https");a.charSet="UTF-8";a.contextData={};a.offlineThrottleDelay=0;a.offlineFilename=
"AppMeasurement.offline";a.Oa=0;a.ma=0;a.N=0;a.Na=0;a.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";a.w=h;a.d=h.document;try{if(a.Sa=!1,navigator){var v=navigator.userAgent;if("Microsoft Internet Explorer"==navigator.appName||0<=v.indexOf("MSIE ")||0<=v.indexOf("Trident/")&&0<=v.indexOf("Windows NT 6"))a.Sa=!0}}catch(w){}a.ga=function(){a.ha&&(h.clearTimeout(a.ha),a.ha=n);a.l&&a.J&&a.l.dispatchEvent(a.J);a.A&&("function"==typeof a.A?a.A():a.l&&a.l.href&&(a.d.location=
a.l.href));a.l=a.J=a.A=0};a.Qa=function(){a.b=a.d.body;a.b?(a.v=function(c){var b,d,f,e,g;if(!(a.d&&a.d.getElementById("cppXYctnr")||c&&c["s_fe_"+a._in])){if(a.Ca)if(a.useForcedLinkTracking)a.b.removeEventListener("click",a.v,!1);else{a.b.removeEventListener("click",a.v,!0);a.Ca=a.useForcedLinkTracking=0;return}else a.useForcedLinkTracking=0;a.clickObject=c.srcElement?c.srcElement:c.target;try{if(!a.clickObject||a.M&&a.M==a.clickObject||!(a.clickObject.tagName||a.clickObject.parentElement||a.clickObject.parentNode))a.clickObject=
0;else{var k=a.M=a.clickObject;a.la&&(clearTimeout(a.la),a.la=0);a.la=setTimeout(function(){a.M==k&&(a.M=0)},1E4);f=a.Ia();a.track();if(f<a.Ia()&&a.useForcedLinkTracking&&c.target){for(e=c.target;e&&e!=a.b&&"A"!=e.tagName.toUpperCase()&&"AREA"!=e.tagName.toUpperCase();)e=e.parentNode;if(e&&(g=e.href,a.Ka(g)||(g=0),d=e.target,c.target.dispatchEvent&&g&&(!d||"_self"==d||"_top"==d||"_parent"==d||h.name&&d==h.name))){try{b=a.d.createEvent("MouseEvents")}catch(l){b=new h.MouseEvent}if(b){try{b.initMouseEvent("click",
c.bubbles,c.cancelable,c.view,c.detail,c.screenX,c.screenY,c.clientX,c.clientY,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.button,c.relatedTarget)}catch(n){b=0}b&&(b["s_fe_"+a._in]=b.s_fe=1,c.stopPropagation(),c.stopImmediatePropagation&&c.stopImmediatePropagation(),c.preventDefault(),a.l=c.target,a.J=b)}}}}}catch(p){a.clickObject=0}}},a.b&&a.b.attachEvent?a.b.attachEvent("onclick",a.v):a.b&&a.b.addEventListener&&(navigator&&(0<=navigator.userAgent.indexOf("WebKit")&&a.d.createEvent||0<=navigator.userAgent.indexOf("Firefox/2")&&
h.MouseEvent)&&(a.Ca=1,a.useForcedLinkTracking=1,a.b.addEventListener("click",a.v,!0)),a.b.addEventListener("click",a.v,!1))):setTimeout(a.Qa,30)};a.Qa();a.loadModule("ActivityMap")}
function s_gi(a){var h,n=window.s_c_il,p,l,r=a.split(","),s,q,u=0;if(n)for(p=0;!u&&p<n.length;){h=n[p];if("s_c"==h._c&&(h.account||h.oun))if(h.account&&h.account==a)u=1;else for(l=h.account?h.account:h.oun,l=h.allAccounts?h.allAccounts:l.split(","),s=0;s<r.length;s++)for(q=0;q<l.length;q++)r[s]==l[q]&&(u=1);p++}u||(h=new AppMeasurement);h.setAccount?h.setAccount(a):h.sa&&h.sa(a);return h}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
function s_pgicq(){var a=window,h=a.s_giq,n,p,l;if(h)for(n=0;n<h.length;n++)p=h[n],l=s_gi(p.oun),l.setAccount(p.un),l.setTagContainer(p.tagContainerName);a.s_giq=0}s_pgicq();


var s_account="null";
var s=s_gi(s_account);
window.adobe_s = s;

s.usePlugins=true;
s.charSet="UTF-8";

s.linkInternalFilters ='javascript:,.hbs.edu,.hbs.';

//Remove Plugins
s.doPlugins = function(s) {
   s.plugins="";
}   

//Channel Manager Plugin Settings
s._channelDomain='Social Networks|facebook.com,linkedin.com,twitter.com,orkut.com,friendster.com,livejournal.com,blogspot.com,wordpress.com,friendfeed.com,myspace.com,digg.com,reddit.com'
    +'stumbleupon.com,twine.com,yelp.com,mixx.com,delicious.com,tumblr.com,disqus.com,intensedebate.com,plurk.com,slideshare.net,backtype.com,netvibes.com,mister-wong.com,'
    +'diigo.com,flixster.com,youtube.com,vimeo.com,12seconds.tv,zooomr.com,identi.ca,jaiku.com,flickr.com,imeem.com,dailymotion.com,photobucket.com,fotolog.com,smugmug.com,'
    +'classmates.com,myyearbook.com,mylife.com,tagged.com,brightkite.com,ning.com,bebo.com,hi5.com,yuku.com,cafemom.com,xanga.com,plus.google.com,pinterest.com'+'School ISPs|yale.edu,brown.edu,princeton.edu,stanford.edu,columbia.edu,mit.edu'+'Harvard Web Properties|harvard.edu';
s._channelParameter='Email|et_cid';
s._channelPattern='Email|em>Paid Search|ps>Paid Display|pd_>Affiliates|aff_>Social Networks|socdp_,soc_>Consumer Shopping Engines|cse';


/* WARNING: Changing any of the below variables will cause drastic
changes to how your visitor data is collected.  Changes should only be
made when instructed to do so by your account manager.*/
s.visitorNamespace = "harvardbusinessschool";
s.trackingServer = "harvardbusinessschool.d2.sc.omtrdc.net";
s.trackingServerSecure = "";


var visitor = new Visitor("B08C1C8B533094750A490D4D@AdobeOrg");
visitor.trackingServer = s.trackingServer;
visitor.trackingServerSecure = s.trackingServerSecure;
s.visitor = Visitor.getInstance("B08C1C8B533094750A490D4D@AdobeOrg");

s.u_warn = function(msg) {
	if (window.console && window.console.warn) window.console.warn(msg + " is removed");
}

/* Plugin: getValOnce_v1.1 */
s.getValOnce=new Function("v","c","e","t",""
+"var s=this,a=new Date,v=v?v:'',c=c?c:'s_gvo',e=e?e:0,i=t=='m'?6000"
+"0:86400000;k=s.c_r(c);if(v){a.setTime(a.getTime()+e*i);s.c_w(c,v,e"
+"==0?0:a);}return v==k?'':v");

/* Plugin: getTimeParting 2.1  */
s.getTimeParting=new Function("t","z","y","l","j",""
+"var s=this,d,A,U,X,Z,W,B,C,D,Y;d=new Date();A=d.getFullYear();Y=U=S"
+"tring(A);if(s.dstStart&&s.dstEnd){B=s.dstStart;C=s.dstEnd}else{;U=U"
+".substring(2,4);X='090801|101407|111306|121104|131003|140902|150801"
+"|161306|171205|181104|191003';X=s.split(X,'|');for(W=0;W<=10;W++){Z"
+"=X[W].substring(0,2);if(U==Z){B=X[W].substring(2,4);C=X[W].substrin"
+"g(4,6)}}if(!B||!C){B='08';C='01'}B='03/'+B+'/'+A;C='11/'+C+'/'+A;}D"
+"=new Date('1/1/2000');if(D.getDay()!=6||D.getMonth()!=0){return'Dat"
+"a Not Available'}else{z=z?z:'0';z=parseFloat(z);B=new Date(B);C=new"
+" Date(C);W=new Date();if(W>B&&W<C&&l!='0'){z=z+1}W=W.getTime()+(W.g"
+"etTimezoneOffset()*60000);W=new Date(W+(3600000*z));X=['Sunday','Mo"
+"nday','Tuesday','Wednesday','Thursday','Friday','Saturday'];B=W.get"
+"Hours();C=W.getMinutes();D=W.getDay();Z=X[D];U='AM';A='Weekday';X='"
+"00';if(C>30){X='30'}if(j=='1'){if(C>15){X='15'}if(C>30){X='30'}if(C"
+">45){X='45'}}if(B>=12){U='PM';B=B-12};if(B==0){B=12};if(D==6||D==0)"
+"{A='Weekend'}W=B+':'+X+U;if(y&&y!=Y){return'Data Not Available'}els"
+"e{if(t){if(t=='h'){return W}if(t=='d'){return Z}if(t=='w'){return A"
+"}}else{return Z+', '+W}}}");

/*
 * Plugin: Days since last Visit 1.1 - capture time from last visit
 */
s.getDaysSinceLastVisit=new Function("c",""
+"var s=this,e=new Date(),es=new Date(),cval,cval_s,cval_ss,ct=e.getT"
+"ime(),day=24*60*60*1000,f1,f2,f3,f4,f5;e.setTime(ct+3*365*day);es.s"
+"etTime(ct+30*60*1000);f0='Cookies Not Supported';f1='First Visit';f"
+"2='More than 30 days';f3='More than 7 days';f4='Less than 7 days';f"
+"5='Less than 1 day';cval=s.c_r(c);if(cval.length==0){s.c_w(c,ct,e);"
+"s.c_w(c+'_s',f1,es);}else{var d=ct-cval;if(d>30*60*1000){if(d>30*da"
+"y){s.c_w(c,ct,e);s.c_w(c+'_s',f2,es);}else if(d<30*day+1 && d>7*day"
+"){s.c_w(c,ct,e);s.c_w(c+'_s',f3,es);}else if(d<7*day+1 && d>day){s."
+"c_w(c,ct,e);s.c_w(c+'_s',f4,es);}else if(d<day+1){s.c_w(c,ct,e);s.c"
+"_w(c+'_s',f5,es);}}else{s.c_w(c,ct,e);cval_ss=s.c_r(c+'_s');s.c_w(c"
+"+'_s',cval_ss,es);}}cval_s=s.c_r(c+'_s');if(cval_s.length==0) retur"
+"n f0;else if(cval_s!=f1&&cval_s!=f2&&cval_s!=f3&&cval_s!=f4&&cval_s"
+"!=f5) return '';else return cval_s;");


/*
 * Plugin: getVisitStart v2.0 
 */
s.getVisitStart=new Function("c",""
+"var s=this,v=1,t=new Date;t.setTime(t.getTime()+1800000);if(s.c_r(c"
+")){v=0}if(!s.c_w(c,1,t)){s.c_w(c,1,0)}if(!s.c_r(c)){v=0}return v;");

s.clickPast = function(){
	s.u_warn("clickPast")
}


/*
 * Plugin: getPercentPageViewed v1.71
 */
s.getPercentPageViewed=new Function("n",""
+"var s=this,W=window,EL=W.addEventListener,AE=W.attachEvent,E=['load"
+"','unload','scroll','resize','zoom','keyup','mouseup','touchend','o"
+"rientationchange','pan'];W.s_Obj=s;s_PPVid=(n=='-'?s.pageName:n)||s"
+".pageName||location.href;if(!W.s_PPVevent){s.s_PPVg=function(n,r){v"
+"ar k='s_ppv',p=k+'l',c=s.c_r(n||r?k:p),a=c.indexOf(',')>-1?c.split("
+"',',10):[''],l=a.length,i;a[0]=unescape(a[0]);r=r||(n&&n!=a[0])||0;"
+"a.length=10;if(typeof a[0]!='string')a[0]='';for(i=1;i<10;i++)a[i]="
+"!r&&i<l?parseInt(a[i])||0:0;if(l<10||typeof a[9]!='string')a[9]='';"
+"if(r){s.c_w(p,c);s.c_w(k,'?')}return a};W.s_PPVevent=function(e){va"
+"r W=window,D=document,B=D.body,E=D.documentElement,S=window.screen|"
+"|0,Ho='offsetHeight',Hs='scrollHeight',Ts='scrollTop',Wc='clientWid"
+"th',Hc='clientHeight',C=100,M=Math,J='object',N='number',s=W.s_Obj|"
+"|W.s||0;e=e&&typeof e==J?e.type||'':'';if(!e.indexOf('on'))e=e.subs"
+"tring(2);s_PPVi=W.s_PPVi||0;if(W.s_PPVt&&!e){clearTimeout(s_PPVt);s"
+"_PPVt=0;if(s_PPVi<2)s_PPVi++}if(typeof s==J){var h=M.max(B[Hs]||E[H"
+"s],B[Ho]||E[Ho],B[Hc]||E[Hc]),X=W.innerWidth||E[Wc]||B[Wc]||0,Y=W.i"
+"nnerHeight||E[Hc]||B[Hc]||0,x=S?S.width:0,y=S?S.height:0,r=M.round("
+"C*(W.devicePixelRatio||1))/C,b=(D.pageYOffset||E[Ts]||B[Ts]||0)+Y,p"
+"=h>0&&b>0?M.round(C*b/h):0,O=W.orientation,o=!isNaN(O)?M.abs(o)%180"
+":Y>X?0:90,L=e=='load'||s_PPVi<1,a=s.s_PPVg(s_PPVid,L),V=function(i,"
+"v,f,n){i=parseInt(typeof a==J&&a.length>i?a[i]:'0')||0;v=typeof v!="
+"N?i:v;v=f||v>i?v:i;return n?v:v>C?C:v<0?0:v};if(new RegExp('(iPod|i"
+"Pad|iPhone)').exec(navigator.userAgent||'')&&o){o=x;x=y;y=o}o=o?'P'"
+":'L';a[9]=L?'':a[9].substring(0,1);s.c_w('s_ppv',escape(W.s_PPVid)+"
+"','+V(1,p,L)+','+(L||!V(2)?p:V(2))+','+V(3,b,L,1)+','+X+','+Y+','+x"
+"+','+y+','+r+','+a[9]+(a[9]==o?'':o))}if(!W.s_PPVt&&e!='unload')W.s"
+"_PPVt=setTimeout(W.s_PPVevent,333)};for(var f=W.s_PPVevent,i=0;i<E."
+"length;i++)if(EL)EL(E[i],f,false);else if(AE)AE('on'+E[i],f);f()};v"
+"ar a=s.s_PPVg();return!n||n=='-'?a[1]:a");

/* Plugin Utility: join v1.0 */
s.join=function(v,p){var s=this;var f,b,d,w;if(p){f=p.front?p.front:"";b=p.back?p.back:"";d=p.delim?p.delim:"";w=p.wrap?p.wrap:""}var str="";for(var x=0;x<v.length;x++){if(typeof v[x]=="object")str+=s.join(v[x],p);else str+=w+v[x]+w;if(x<v.length-1)str+=d}return f+str+b};

/*
 *  Plug-in: crossVisitParticipation v1.8 (Minified)
 */
s.crossVisitParticipation=function(v,cn,ex,ct,dl,ev,dv){var s=this,ce;if(typeof cn==="undefined")cn="s_cvp";if(typeof ex==="undefined")ex=90;if(typeof dl==="undefined")dl=">";if(typeof ct==="undefined")ct=5;if(typeof dv==="undefined")dv=0;if(s.events&&ev){var ay=ev.split(",");var ea=s.events.split(",");var ayl=ay.length;var eal=ea.length;for(var u=0;u<ayl;u++)for(var x=0;x<eal;x++)if(ay[u]==ea[x])ce=1}if(typeof v==="undefined"||v==""){if(ce)s.c_w(cn,"");return""}v=encodeURIComponent(v);var arry=new Array,
a=new Array,h=new Array;c=s.c_r(cn),g=0,arryl=0;if(c&&c!=""){arry=c.split("],[");arryl=arry.length;for(q=0;q<arryl;q++){z=arry[q];z=s.replace?s.replace(z,"[",""):s.repl(z,"[","");z=s.replace?s.replace(z,"]",""):s.repl(z,"]","");z=s.replace?s.replace(z,"'",""):s.repl(z,"'","");arry[q]=z.split(",")}}else arryl=0;var e=new Date;e.setFullYear(e.getFullYear()+5);if(dv==0&&arryl>0&&arry[arryl-1][0]==v)arry[arryl-1]=[v,(new Date).getTime()];else arry[arryl]=[v,(new Date).getTime()];arryl=arry.length;var start=
arryl-ct<0?0:arryl-ct;var td=new Date;for(var x=start;x<arryl;x++){var diff=Math.round((td.getTime()-arry[x][1])/864E5);if(diff<ex){h[g]=decodeURIComponent(arry[x][0]);a[g]=[arry[x][0],arry[x][1]];g++}}var data=s.join(a,{delim:",",front:"[",back:"]",wrap:"'"});s.c_w(cn,data,e);var r=s.join(h,{delim:dl});if(ce)s.c_w(cn,"");return r};

/*
 * Plugin: getPreviousValue_v1.0 - return previous value of designated
 *   variable (requires split utility)
 */
s.getPreviousValue=new Function("v","c","el",""
+"var s=this,t=new Date,i,j,r='';t.setTime(t.getTime()+1800000);if(el"
+"){if(s.events){i=s.split(el,',');j=s.split(s.events,',');for(x in i"
+"){for(y in j){if(i[x]==j[y]){if(s.c_r(c)) r=s.c_r(c);v?s.c_w(c,v,t)"
+":s.c_w(c,'no value',t);return r}}}}}else{if(s.c_r(c)) r=s.c_r(c);v?"
+"s.c_w(c,v,t):s.c_w(c,'no value',t);return r}");
/*
 * Utility Function: split v1.5 - split a string (JS 1.0 compatible)
 */
s.split=new Function("l","d",""
+"var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x"
+"++]=l.substring(0,i);l=l.substring(i+d.length);}return a");

}



