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
        }
        if (User.roleDetail) {
            Adobe.set('prop9',User.role + " : " + User.roleDetail);  // get as specific as possible in the prop9
            Adobe.set('eVar11','D=c9');
            Adobe.set('eVar8','D=c9');
        } 
        if (User.id) {
            //Adobe.set('visitorID',Util.obfuscate(User.id));
            //Adobe.set("eVar16","D=vid"); 
            //if (User.personID) {
                //Adobe.set('prop8',User.personID);
            //}
            //Adobe.set('eVar10',"D=c8"); //dynamic prop8
            Adobe.set('eVar9','logged in');
        } else {
            //Adobe.set('prop8','guest');
            //Adobe.set('eVar10',"D=c8"); //dynamic prop8
            Adobe.set('eVar9','anonymous');
        } 

        if (User.eePersonID) {
            Adobe.set('eVar36',User.eePersonID);
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
        s.clickPast(visitStart,'event3','event4');

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
        if (cid) { Analytics.campaignStart(cid);}

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
        if (!sw) {
            sw = new StopWatch();
            Analytics._stopWatches[mediaName] = sw;
        }
        sw.start();
    },

    // pauses the startwatch
    mediaPause: function(mediaName) {
        var sw = Analytics._stopWatches[mediaName];
        if (sw) sw.stop();
    },

    // tracks media progress
    mediaMilestone: function(mediaName,milestone) {
        var sw = Analytics._stopWatches[mediaName] || new StopWatch();
        Adobe.set("eVar19",mediaName);
        Adobe.set("prop24","D=v19");
        Adobe.appendEvent("event18="+sw.duration());
        Adobe.set("eVar49",sw.duration());
        Adobe.set("eVar50","page");
        sw.reset();
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
   id: null,
   startTime: 0,
   campaign: "None",
   referrerId: null,
   lastPageName: null,

   cached: ['role','roleDetail','id','campaign','lastprofile','lastsite','lasturl','startTime', 'personID','referrerId','linkType'],   

   init: function() {
     arguments.callee.done = true
     User.id = User._getIdFromCookie();
     if (User.load()) {
        // loaded the data from a cookie cache
     } else if (User.id) {
        // need to fetch the data
        User._fetchUserInfo();
     } else {
        // we know nothing about the user and they've never logged in
        User._fetchUserInfo();
     }

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

   _fetchUserInfo: function() {
        var roles = User._getRolesFromCookie();
        User.role = roles[0];
        User.roleDetail = roles[1];
        if (User.role == 'Staff') {
            // not enough info in the cookie, so we need to do a remote lookup
            Util.addEvent(window,'load',function(){
               var script = document.createElement('script');
               script.type = "text/javascript";
               script.src = "https://www.alumni.hbs.edu/analytics-data.aspx";
               try { document.getElementsByTagName('head')[0].appendChild(script); }
               catch (e) {}
            });
        }
        // if we have data, store it
        if (User.id && User.role) {User.store();}
   },

   userdataCallback: function(vars) {
      if (User.id == vars['id']) {
         for (var key in vars) {
            User[key] = vars[key];
         }
      }
      // update the data store
      User.store();
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
   
     var hbscookie = Util.getCookie("HBSCOOKIE");
     var klass = User._getClassFromCookie(hbscookie);
     var decade = User._getDecadeFromClass(klass);
     
     if (!/@/.test(hbscookie)) {
        return ["External","Non HBS"];
     } else if (/alumni.hbs.edu/.test(hbscookie) && decade) {
        return ["Alumni",decade];
     } else if (/alumni.hbs.edu/.test(hbscookie)) {
        return ["Alumni","Exed Alum"];
     } else if (/alumnistg.hbsstg.org/.test(hbscookie) && decade) {
        return ["Alumni",decade];
     } else if (/alumnistg.hbsstg.org/.test(hbscookie)) {
        return ["Alumni","Exed Alum"];
     } else if (/@bschool/.test(hbscookie)) {
        return ["Staff","Staff"];
     } else if (/@mba/.test(hbscookie) && klass) {
        return ["MBA","MBA "+klass];
     } else if (/exed.hbs.edu/.test(hbscookie)) {
        return ["Exed","Exed"];
     } else if (/@public/.test(hbscookie)) {
        return ["External","Public"];
     } else if (/@crossreg/.test(hbscookie)) {
        return ["External","Crossreg"];
     } else if (/@partners/.test(hbscookie)) {
        return ["External","Partners"];
     } else if (/@guest/.test(hbscookie)) {
        return ["External","Guest"];
     } else {
        return ["External","Non HBS"];
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

     // this is some other users cache
     if (User.id && User.id != Util.getParam('id',datastr)) {return false;}

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
     
     if (User.role && !User.isValid("role",User.role)) { return false; }
     
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

 Adobe Visitor API for JavaScript version: 1.10.0
 Copyright 1996-2015 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
*/
function Visitor(q,v){function y(a){function c(a,d,c){c=c?c+="|":c;return c+(a+"="+encodeURIComponent(d))}for(var b="",e=0,f=a.length;e<f;e++){var g=a[e],h=g[0],g=g[1];g!=i&&g!==t&&(b=c(h,g,b))}return function(a){var d=(new Date).getTime(),a=a?a+="|":a;return a+("TS="+d)}(b)}if(!q)throw"Visitor requires Adobe Marketing Cloud Org ID";var a=this;a.version="1.10.0";var m=window,l=m.Visitor;l.version=a.version;m.s_c_in||(m.s_c_il=[],m.s_c_in=0);a._c="Visitor";a._il=m.s_c_il;a._in=m.s_c_in;a._il[a._in]=
a;m.s_c_in++;a.ja={Fa:[]};var u=m.document,i=l.Cb;i||(i=null);var E=l.Db;E||(E=void 0);var j=l.Oa;j||(j=!0);var k=l.Ma;k||(k=!1);a.fa=function(a){var c=0,b,e;if(a)for(b=0;b<a.length;b++)e=a.charCodeAt(b),c=(c<<5)-c+e,c&=c;return c};a.s=function(a,c){var b="0123456789",e="",f="",g,h,i=8,k=10,l=10;c===n&&(w.isClientSideMarketingCloudVisitorID=j);if(1==a){b+="ABCDEF";for(g=0;16>g;g++)h=Math.floor(Math.random()*i),e+=b.substring(h,h+1),h=Math.floor(Math.random()*i),f+=b.substring(h,h+1),i=16;return e+
"-"+f}for(g=0;19>g;g++)h=Math.floor(Math.random()*k),e+=b.substring(h,h+1),0==g&&9==h?k=3:(1==g||2==g)&&10!=k&&2>h?k=10:2<g&&(k=10),h=Math.floor(Math.random()*l),f+=b.substring(h,h+1),0==g&&9==h?l=3:(1==g||2==g)&&10!=l&&2>h?l=10:2<g&&(l=10);return e+f};a.Ra=function(){var a;!a&&m.location&&(a=m.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a="";else{var c=a.split("."),b=c.length-1,e=b-1;1<b&&2>=c[b].length&&(2==c[b-1].length||0>",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,et,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,nz,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tr,tt,tv,tw,tz,ua,ug,uk,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,".indexOf(","+
c[b]+","))&&e--;if(0<e)for(a="";b>=e;)a=c[b]+(a?".":"")+a,b--}return a};a.cookieRead=function(a){var a=encodeURIComponent(a),c=(";"+u.cookie).split(" ").join(";"),b=c.indexOf(";"+a+"="),e=0>b?b:c.indexOf(";",b+1);return 0>b?"":decodeURIComponent(c.substring(b+2+a.length,0>e?c.length:e))};a.cookieWrite=function(d,c,b){var e=a.cookieLifetime,f,c=""+c,e=e?(""+e).toUpperCase():"";b&&"SESSION"!=e&&"NONE"!=e?(f=""!=c?parseInt(e?e:0,10):-60)?(b=new Date,b.setTime(b.getTime()+1E3*f)):1==b&&(b=new Date,f=
b.getYear(),b.setYear(f+2+(1900>f?1900:0))):b=0;return d&&"NONE"!=e?(u.cookie=encodeURIComponent(d)+"="+encodeURIComponent(c)+"; path=/;"+(b?" expires="+b.toGMTString()+";":"")+(a.cookieDomain?" domain="+a.cookieDomain+";":""),a.cookieRead(d)==c):0};a.h=i;a.J=function(a,c){try{"function"==typeof a?a.apply(m,c):a[1].apply(a[0],c)}catch(b){}};a.Xa=function(d,c){c&&(a.h==i&&(a.h={}),a.h[d]==E&&(a.h[d]=[]),a.h[d].push(c))};a.r=function(d,c){if(a.h!=i){var b=a.h[d];if(b)for(;0<b.length;)a.J(b.shift(),
c)}};a.v=function(a,c,b,e){b=encodeURIComponent(c)+"="+encodeURIComponent(b);c=x.vb(a);a=x.mb(a);if(-1===a.indexOf("?"))return a+"?"+b+c;var f=a.split("?"),a=f[0]+"?",e=x.$a(f[1],b,e);return a+e+c};a.Qa=function(a,c){var b=RegExp("[\\?&#]"+c+"=([^&#]*)").exec(a);if(b&&b.length)return decodeURIComponent(b[1])};a.Wa=function(){var d=i,c=m.location.href;try{var b=a.Qa(c,r.Z);if(b)for(var d={},e=b.split("|"),c=0,f=e.length;c<f;c++){var g=e[c].split("=");d[g[0]]=decodeURIComponent(g[1])}return d}catch(h){}};
a.ba=function(){var d=a.Wa();if(d&&d.TS&&!(((new Date).getTime()-d.TS)/6E4>r.Ka||d[I]!==q)){var c=d[n],b=a.setMarketingCloudVisitorID;c&&c.match(r.u)&&b(c);a.j(s,-1);d=d[p];c=a.setAnalyticsVisitorID;d&&d.match(r.u)&&c(d)}};a.Va=function(d){function c(d){x.pb(d)&&a.setCustomerIDs(d)}function b(d){d=d||{};a._supplementalDataIDCurrent=d.supplementalDataIDCurrent||"";a._supplementalDataIDCurrentConsumed=d.supplementalDataIDCurrentConsumed||{};a._supplementalDataIDLast=d.supplementalDataIDLast||"";a._supplementalDataIDLastConsumed=
d.supplementalDataIDLastConsumed||{}}d&&d[a.marketingCloudOrgID]&&(d=d[a.marketingCloudOrgID],c(d.customerIDs),b(d.sdid))};a.l=i;a.Ta=function(d,c,b,e){c=a.v(c,"d_fieldgroup",d,1);e.url=a.v(e.url,"d_fieldgroup",d,1);e.m=a.v(e.m,"d_fieldgroup",d,1);w.d[d]=j;e===Object(e)&&e.m&&"XMLHttpRequest"===a.la.C.D?a.la.ib(e,b,d):a.useCORSOnly||a.ia(d,c,b)};a.ia=function(d,c,b){var e=0,f=0,g;if(c&&u){for(g=0;!e&&2>g;){try{e=(e=u.getElementsByTagName(0<g?"HEAD":"head"))&&0<e.length?e[0]:0}catch(h){e=0}g++}if(!e)try{u.body&&
(e=u.body)}catch(k){e=0}if(e)for(g=0;!f&&2>g;){try{f=u.createElement(0<g?"SCRIPT":"script")}catch(l){f=0}g++}}!c||!e||!f?b&&b():(f.type="text/javascript",f.src=c,e.firstChild?e.insertBefore(f,e.firstChild):e.appendChild(f),e=a.loadTimeout,o.d[d]={requestStart:o.o(),url:c,ta:e,ra:o.ya(),sa:0},b&&(a.l==i&&(a.l={}),a.l[d]=setTimeout(function(){b(j)},e)),a.ja.Fa.push(c))};a.Pa=function(d){a.l!=i&&a.l[d]&&(clearTimeout(a.l[d]),a.l[d]=0)};a.ga=k;a.ha=k;a.isAllowed=function(){if(!a.ga&&(a.ga=j,a.cookieRead(a.cookieName)||
a.cookieWrite(a.cookieName,"T",1)))a.ha=j;return a.ha};a.b=i;a.c=i;var F=l.Ub;F||(F="MC");var n=l.ac;n||(n="MCMID");var I=l.Yb;I||(I="MCORGID");var H=l.Vb;H||(H="MCCIDH");var L=l.Zb;L||(L="MCSYNCS");var J=l.$b;J||(J="MCSYNCSOP");var K=l.Wb;K||(K="MCIDTS");var B=l.Xb;B||(B="MCOPTOUT");var D=l.Sb;D||(D="A");var p=l.Pb;p||(p="MCAID");var C=l.Tb;C||(C="AAM");var A=l.Rb;A||(A="MCAAMLH");var s=l.Qb;s||(s="MCAAMB");var t=l.bc;t||(t="NONE");a.L=0;a.ea=function(){if(!a.L){var d=a.version;a.audienceManagerServer&&
(d+="|"+a.audienceManagerServer);a.audienceManagerServerSecure&&(d+="|"+a.audienceManagerServerSecure);a.L=a.fa(d)}return a.L};a.ka=k;a.f=function(){if(!a.ka){a.ka=j;var d=a.ea(),c=k,b=a.cookieRead(a.cookieName),e,f,g,h,l=new Date;a.b==i&&(a.b={});if(b&&"T"!=b){b=b.split("|");b[0].match(/^[\-0-9]+$/)&&(parseInt(b[0],10)!=d&&(c=j),b.shift());1==b.length%2&&b.pop();for(d=0;d<b.length;d+=2)if(e=b[d].split("-"),f=e[0],g=b[d+1],1<e.length?(h=parseInt(e[1],10),e=0<e[1].indexOf("s")):(h=0,e=k),c&&(f==H&&
(g=""),0<h&&(h=l.getTime()/1E3-60)),f&&g&&(a.e(f,g,1),0<h&&(a.b["expire"+f]=h+(e?"s":""),l.getTime()>=1E3*h||e&&!a.cookieRead(a.sessionCookieName))))a.c||(a.c={}),a.c[f]=j}c=a.loadSSL?!!a.trackingServerSecure:!!a.trackingServer;if(!a.a(p)&&c&&(b=a.cookieRead("s_vi")))b=b.split("|"),1<b.length&&0<=b[0].indexOf("v1")&&(g=b[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(r.u)&&a.e(p,g))}};a.Za=function(){var d=a.ea(),c,b;for(c in a.b)!Object.prototype[c]&&a.b[c]&&"expire"!=c.substring(0,6)&&
(b=a.b[c],d+=(d?"|":"")+c+(a.b["expire"+c]?"-"+a.b["expire"+c]:"")+"|"+b);a.cookieWrite(a.cookieName,d,1)};a.a=function(d,c){return a.b!=i&&(c||!a.c||!a.c[d])?a.b[d]:i};a.e=function(d,c,b){a.b==i&&(a.b={});a.b[d]=c;b||a.Za()};a.Sa=function(d,c){var b=a.a(d,c);return b?b.split("*"):i};a.Ya=function(d,c,b){a.e(d,c?c.join("*"):"",b)};a.Jb=function(d,c){var b=a.Sa(d,c);if(b){var e={},f;for(f=0;f<b.length;f+=2)e[b[f]]=b[f+1];return e}return i};a.Lb=function(d,c,b){var e=i,f;if(c)for(f in e=[],c)Object.prototype[f]||
(e.push(f),e.push(c[f]));a.Ya(d,e,b)};a.j=function(d,c,b){var e=new Date;e.setTime(e.getTime()+1E3*c);a.b==i&&(a.b={});a.b["expire"+d]=Math.floor(e.getTime()/1E3)+(b?"s":"");0>c?(a.c||(a.c={}),a.c[d]=j):a.c&&(a.c[d]=k);b&&(a.cookieRead(a.sessionCookieName)||a.cookieWrite(a.sessionCookieName,"1"))};a.da=function(a){if(a&&("object"==typeof a&&(a=a.d_mid?a.d_mid:a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a=t)),!a||a!=t&&!a.match(r.u)))a="";return a};a.k=
function(d,c){a.Pa(d);a.i!=i&&(a.i[d]=k);o.d[d]&&(o.d[d].Ab=o.o(),o.I(d));w.d[d]&&w.Ha(d,k);if(d==F){w.isClientSideMarketingCloudVisitorID!==j&&(w.isClientSideMarketingCloudVisitorID=k);var b=a.a(n);if(!b||a.overwriteCrossDomainMCIDAndAID){b="object"==typeof c&&c.mid?c.mid:a.da(c);if(!b){if(a.B){a.getAnalyticsVisitorID(i,k,j);return}b=a.s(0,n)}a.e(n,b)}if(!b||b==t)b="";"object"==typeof c&&((c.d_region||c.dcs_region||c.d_blob||c.blob)&&a.k(C,c),a.B&&c.mid&&a.k(D,{id:c.id}));a.r(n,[b])}if(d==C&&"object"==
typeof c){b=604800;c.id_sync_ttl!=E&&c.id_sync_ttl&&(b=parseInt(c.id_sync_ttl,10));var e=a.a(A);e||((e=c.d_region)||(e=c.dcs_region),e&&(a.j(A,b),a.e(A,e)));e||(e="");a.r(A,[e]);e=a.a(s);if(c.d_blob||c.blob)(e=c.d_blob)||(e=c.blob),a.j(s,b),a.e(s,e);e||(e="");a.r(s,[e]);!c.error_msg&&a.A&&a.e(H,a.A)}if(d==D){b=a.a(p);if(!b||a.overwriteCrossDomainMCIDAndAID)(b=a.da(c))?b!==t&&a.j(s,-1):b=t,a.e(p,b);if(!b||b==t)b="";a.r(p,[b])}a.idSyncDisableSyncs?z.za=j:(z.za=k,b={},b.ibs=c.ibs,b.subdomain=c.subdomain,
z.wb(b));if(c===Object(c)){var f;a.isAllowed()&&(f=a.a(B));f||(f=t,c.d_optout&&c.d_optout instanceof Array&&(f=c.d_optout.join(",")),b=parseInt(c.d_ottl,10),isNaN(b)&&(b=7200),a.j(B,b,j),a.e(B,f));a.r(B,[f])}};a.i=i;a.t=function(d,c,b,e,f){var g="",h,k=x.ob(d);if(a.isAllowed()&&(a.f(),g=a.a(d,M[d]===j),a.disableThirdPartyCalls&&!g&&(d===n?(g=a.s(0,n),a.setMarketingCloudVisitorID(g)):d===p&&!k&&(g="",a.setAnalyticsVisitorID(g))),(!g||a.c&&a.c[d])&&(!a.disableThirdPartyCalls||k)))if(d==n||d==B?h=F:
d==A||d==s?h=C:d==p&&(h=D),h){if(c&&(a.i==i||!a.i[h]))a.i==i&&(a.i={}),a.i[h]=j,a.Ta(h,c,function(c,b){if(!a.a(d))if(o.d[h]&&(o.d[h].timeout=o.o(),o.d[h].nb=!!c,o.I(h)),b===Object(b)&&!a.useCORSOnly)a.ia(h,b.url,b.G);else{c&&w.Ha(h,j);var e="";d==n?e=a.s(0,n):h==C&&(e={error_msg:"timeout"});a.k(h,e)}},f);if(g)return g;a.Xa(d,b);c||a.k(h,{id:t});return""}if((d==n||d==p)&&g==t)g="",e=j;b&&(e||a.disableThirdPartyCalls)&&a.J(b,[g]);return g};a._setMarketingCloudFields=function(d){a.f();a.k(F,d)};a.setMarketingCloudVisitorID=
function(d){a._setMarketingCloudFields(d)};a.B=k;a.getMarketingCloudVisitorID=function(d,c){if(a.isAllowed()){a.marketingCloudServer&&0>a.marketingCloudServer.indexOf(".demdex.net")&&(a.B=j);var b=a.z("_setMarketingCloudFields");return a.t(n,b.url,d,c,b)}return""};a.Ua=function(){a.getAudienceManagerBlob()};l.AuthState={UNKNOWN:0,AUTHENTICATED:1,LOGGED_OUT:2};a.w={};a.ca=k;a.A="";a.setCustomerIDs=function(d){if(a.isAllowed()&&d){a.f();var c,b;for(c in d)if(!Object.prototype[c]&&(b=d[c]))if("object"==
typeof b){var e={};b.id&&(e.id=b.id);b.authState!=E&&(e.authState=b.authState);a.w[c]=e}else a.w[c]={id:b};var d=a.getCustomerIDs(),e=a.a(H),f="";e||(e=0);for(c in d)Object.prototype[c]||(b=d[c],f+=(f?"|":"")+c+"|"+(b.id?b.id:"")+(b.authState?b.authState:""));a.A=a.fa(f);a.A!=e&&(a.ca=j,a.Ua())}};a.getCustomerIDs=function(){a.f();var d={},c,b;for(c in a.w)Object.prototype[c]||(b=a.w[c],d[c]||(d[c]={}),b.id&&(d[c].id=b.id),d[c].authState=b.authState!=E?b.authState:l.AuthState.UNKNOWN);return d};a._setAnalyticsFields=
function(d){a.f();a.k(D,d)};a.setAnalyticsVisitorID=function(d){a._setAnalyticsFields(d)};a.getAnalyticsVisitorID=function(d,c,b){if(a.isAllowed()){var e="";b||(e=a.getMarketingCloudVisitorID(function(){a.getAnalyticsVisitorID(d,j)}));if(e||b){var f=b?a.marketingCloudServer:a.trackingServer,g="";a.loadSSL&&(b?a.marketingCloudServerSecure&&(f=a.marketingCloudServerSecure):a.trackingServerSecure&&(f=a.trackingServerSecure));var h={};if(f){var f="http"+(a.loadSSL?"s":"")+"://"+f+"/id",e="d_visid_ver="+
a.version+"&mcorgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":""),i=["s_c_il",a._in,"_set"+(b?"MarketingCloud":"Analytics")+"Fields"],g=f+"?"+e+"&callback=s_c_il%5B"+a._in+"%5D._set"+(b?"MarketingCloud":"Analytics")+"Fields";h.m=f+"?"+e;h.oa=i}h.url=g;return a.t(b?n:p,g,d,c,h)}}return""};a._setAudienceManagerFields=function(d){a.f();a.k(C,d)};a.z=function(d){var c=a.audienceManagerServer,b="",e=a.a(n),f=a.a(s,j),
g=a.a(p),g=g&&g!=t?"&d_cid_ic=AVID%01"+encodeURIComponent(g):"";a.loadSSL&&a.audienceManagerServerSecure&&(c=a.audienceManagerServerSecure);if(c){var b=a.getCustomerIDs(),h,i;if(b)for(h in b)Object.prototype[h]||(i=b[h],g+="&d_cid_ic="+encodeURIComponent(h)+"%01"+encodeURIComponent(i.id?i.id:"")+(i.authState?"%01"+i.authState:""));d||(d="_setAudienceManagerFields");c="http"+(a.loadSSL?"s":"")+"://"+c+"/id";e="d_visid_ver="+a.version+"&d_rtbd=json&d_ver=2"+(!e&&a.B?"&d_verify=1":"")+"&d_orgid="+encodeURIComponent(a.marketingCloudOrgID)+
"&d_nsid="+(a.idSyncContainerID||0)+(e?"&d_mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":"")+(f?"&d_blob="+encodeURIComponent(f):"")+g;f=["s_c_il",a._in,d];b=c+"?"+e+"&d_cb=s_c_il%5B"+a._in+"%5D."+d;return{url:b,m:c+"?"+e,oa:f}}return{url:b}};a.getAudienceManagerLocationHint=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerLocationHint(d,j)})){var b=a.a(p);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerLocationHint(d,
j)}));if(b)return b=a.z(),a.t(A,b.url,d,c,b)}return""};a.getLocationHint=a.getAudienceManagerLocationHint;a.getAudienceManagerBlob=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerBlob(d,j)})){var b=a.a(p);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerBlob(d,j)}));if(b){var b=a.z(),e=b.url;a.ca&&a.j(s,-1);return a.t(s,e,d,c,b)}}return""};a._supplementalDataIDCurrent="";a._supplementalDataIDCurrentConsumed={};a._supplementalDataIDLast="";a._supplementalDataIDLastConsumed=
{};a.getSupplementalDataID=function(d,c){!a._supplementalDataIDCurrent&&!c&&(a._supplementalDataIDCurrent=a.s(1));var b=a._supplementalDataIDCurrent;a._supplementalDataIDLast&&!a._supplementalDataIDLastConsumed[d]?(b=a._supplementalDataIDLast,a._supplementalDataIDLastConsumed[d]=j):b&&(a._supplementalDataIDCurrentConsumed[d]&&(a._supplementalDataIDLast=a._supplementalDataIDCurrent,a._supplementalDataIDLastConsumed=a._supplementalDataIDCurrentConsumed,a._supplementalDataIDCurrent=b=!c?a.s(1):"",a._supplementalDataIDCurrentConsumed=
{}),b&&(a._supplementalDataIDCurrentConsumed[d]=j));return b};l.OptOut={GLOBAL:"global"};a.getOptOut=function(d,c){if(a.isAllowed()){var b=a.z("_setMarketingCloudFields");return a.t(B,b.url,d,c,b)}return""};a.isOptedOut=function(d,c,b){return a.isAllowed()?(c||(c=l.OptOut.GLOBAL),(b=a.getOptOut(function(b){a.J(d,[b==l.OptOut.GLOBAL||0<=b.indexOf(c)])},b))?b==l.OptOut.GLOBAL||0<=b.indexOf(c):i):k};a.appendVisitorIDsTo=function(d){var c=r.Z,b=y([[n,a.a(n)],[p,a.a(p)],[I,a.marketingCloudOrgID]]);try{return a.v(d,
c,b)}catch(e){return d}};var r={q:!!m.postMessage,La:1,aa:864E5,Z:"adobe_mc",u:/^[0-9a-fA-F\-]+$/,Ka:5};a.Eb=r;a.na={postMessage:function(a,c,b){var e=1;c&&(r.q?b.postMessage(a,c.replace(/([^:]+:\/\/[^\/]+).*/,"$1")):c&&(b.location=c.replace(/#.*$/,"")+"#"+ +new Date+e++ +"&"+a))},U:function(a,c){var b;try{if(r.q)if(a&&(b=function(b){if("string"===typeof c&&b.origin!==c||"[object Function]"===Object.prototype.toString.call(c)&&!1===c(b.origin))return!1;a(b)}),window.addEventListener)window[a?"addEventListener":
"removeEventListener"]("message",b,!1);else window[a?"attachEvent":"detachEvent"]("onmessage",b)}catch(e){}}};var x={M:function(){if(u.addEventListener)return function(a,c,b){a.addEventListener(c,function(a){"function"===typeof b&&b(a)},k)};if(u.attachEvent)return function(a,c,b){a.attachEvent("on"+c,function(a){"function"===typeof b&&b(a)})}}(),map:function(a,c){if(Array.prototype.map)return a.map(c);if(void 0===a||a===i)throw new TypeError;var b=Object(a),e=b.length>>>0;if("function"!==typeof c)throw new TypeError;
for(var f=Array(e),g=0;g<e;g++)g in b&&(f[g]=c.call(c,b[g],g,b));return f},va:function(a,c){return this.map(a,function(a){return encodeURIComponent(a)}).join(c)},vb:function(a){var c=a.indexOf("#");return 0<c?a.substr(c):""},mb:function(a){var c=a.indexOf("#");return 0<c?a.substr(0,c):a},$a:function(a,c,b){a=a.split("&");b=b!=i?b:a.length;a.splice(b,0,c);return a.join("&")},ob:function(d,c,b){if(d!==p)return k;c||(c=a.trackingServer);b||(b=a.trackingServerSecure);d=a.loadSSL?b:c;return"string"===
typeof d&&d.length?0>d.indexOf("2o7.net")&&0>d.indexOf("omtrdc.net"):k},pb:function(a){return Boolean(a&&a===Object(a))}};a.Kb=x;var N={C:function(){var a="none",c=j;"undefined"!==typeof XMLHttpRequest&&XMLHttpRequest===Object(XMLHttpRequest)&&("withCredentials"in new XMLHttpRequest?a="XMLHttpRequest":(new Function("/*@cc_on return /^10/.test(@_jscript_version) @*/"))()?a="XMLHttpRequest":"undefined"!==typeof XDomainRequest&&XDomainRequest===Object(XDomainRequest)&&(c=k),0<Object.prototype.toString.call(window.Bb).indexOf("Constructor")&&
(c=k));return{D:a,Nb:c}}(),jb:function(){return"none"===this.C.D?i:new window[this.C.D]},ib:function(d,c,b){var e=this;c&&(d.G=c);try{var f=this.jb();f.open("get",d.m+"&ts="+(new Date).getTime(),j);"XMLHttpRequest"===this.C.D&&(f.withCredentials=j,f.timeout=a.loadTimeout,f.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),f.onreadystatechange=function(){if(4===this.readyState&&200===this.status)a:{var a;try{if(a=JSON.parse(this.responseText),a!==Object(a)){e.n(d,i,"Response is not JSON");
break a}}catch(c){e.n(d,c,"Error parsing response as JSON");break a}try{for(var b=d.oa,f=window,g=0;g<b.length;g++)f=f[b[g]];f(a)}catch(j){e.n(d,j,"Error forming callback function")}}});f.onerror=function(a){e.n(d,a,"onerror")};f.ontimeout=function(a){e.n(d,a,"ontimeout")};f.send();o.d[b]={requestStart:o.o(),url:d.m,ta:f.timeout,ra:o.ya(),sa:1};a.ja.Fa.push(d.m)}catch(g){this.n(d,g,"try-catch")}},n:function(d,c,b){a.CORSErrors.push({Ob:d,error:c,description:b});d.G&&("ontimeout"===b?d.G(j):d.G(k,
d))}};a.la=N;var z={Na:3E4,$:649,Ja:k,id:i,T:[],Q:i,xa:function(a){if("string"===typeof a)return a=a.split("/"),a[0]+"//"+a[2]},g:i,url:i,kb:function(){var d="http://fast.",c="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(u.location.href);this.g||(this.g="nosubdomainreturned");a.loadSSL&&(d=a.idSyncSSLUseAkamai?"https://fast.":"https://");d=d+this.g+".demdex.net/dest5.html"+c;this.Q=this.xa(d);this.id="destination_publishing_iframe_"+this.g+"_"+a.idSyncContainerID;return d},cb:function(){var d=
"?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(u.location.href);"string"===typeof a.K&&a.K.length&&(this.id="destination_publishing_iframe_"+(new Date).getTime()+"_"+a.idSyncContainerID,this.Q=this.xa(a.K),this.url=a.K+d)},za:i,ua:k,W:k,F:i,cc:i,ub:i,dc:i,V:k,H:[],sb:[],tb:[],Ba:r.q?15:100,R:[],qb:[],pa:j,Ea:k,Da:function(){return!a.idSyncDisable3rdPartySyncing&&(this.ua||a.Gb)&&this.g&&"nosubdomainreturned"!==this.g&&this.url&&!this.W},O:function(){function a(){e=document.createElement("iframe");
e.sandbox="allow-scripts allow-same-origin";e.title="Adobe ID Syncing iFrame";e.id=b.id;e.style.cssText="display: none; width: 0; height: 0;";e.src=b.url;b.ub=j;c();document.body.appendChild(e)}function c(){x.M(e,"load",function(){e.className="aamIframeLoaded";b.F=j;b.p()})}this.W=j;var b=this,e=document.getElementById(this.id);e?"IFRAME"!==e.nodeName?(this.id+="_2",a()):"aamIframeLoaded"!==e.className?c():(this.F=j,this.Aa=e,this.p()):a();this.Aa=e},p:function(d){var c=this;d===Object(d)&&(this.R.push(d),
this.xb(d));if((this.Ea||!r.q||this.F)&&this.R.length)this.I(this.R.shift()),this.p();!a.idSyncDisableSyncs&&this.F&&this.H.length&&!this.V&&(this.Ja||(this.Ja=j,setTimeout(function(){c.Ba=r.q?15:150},this.Na)),this.V=j,this.Ga())},xb:function(a){var c,b,e;if((c=a.ibs)&&c instanceof Array&&(b=c.length))for(a=0;a<b;a++)e=c[a],e.syncOnPage&&this.qa(e,"","syncOnPage")},I:function(a){var c=encodeURIComponent,b,e,f,g,h;if((b=a.ibs)&&b instanceof Array&&(e=b.length))for(f=0;f<e;f++)g=b[f],h=[c("ibs"),c(g.id||
""),c(g.tag||""),x.va(g.url||[],","),c(g.ttl||""),"","",g.fireURLSync?"true":"false"],g.syncOnPage||(this.pa?this.N(h.join("|")):g.fireURLSync&&this.qa(g,h.join("|")));this.qb.push(a)},qa:function(d,c,b){var e=(b="syncOnPage"===b?j:k)?J:L;a.f();var f=a.a(e),g=k,h=k,i=Math.ceil((new Date).getTime()/r.aa);f?(f=f.split("*"),h=this.yb(f,d.id,i),g=h.gb,h=h.hb,(!g||!h)&&this.wa(b,d,c,f,e,i)):(f=[],this.wa(b,d,c,f,e,i))},yb:function(a,c,b){var e=k,f=k,g,h,i;for(h=0;h<a.length;h++)g=a[h],i=parseInt(g.split("-")[1],
10),g.match("^"+c+"-")?(e=j,b<i?f=j:(a.splice(h,1),h--)):b>=i&&(a.splice(h,1),h--);return{gb:e,hb:f}},rb:function(a){if(a.join("*").length>this.$)for(a.sort(function(a,b){return parseInt(a.split("-")[1],10)-parseInt(b.split("-")[1],10)});a.join("*").length>this.$;)a.shift()},wa:function(d,c,b,e,f,g){var h=this;if(d){if("img"===c.tag){var d=c.url,b=a.loadSSL?"https:":"http:",j,k,l;for(e=0,j=d.length;e<j;e++){k=d[e];l=/^\/\//.test(k);var m=new Image;x.M(m,"load",function(b,c,d,e){return function(){h.T[b]=
i;a.f();var g=a.a(f),j=[];if(g){var g=g.split("*"),k,l,m;for(k=0,l=g.length;k<l;k++)m=g[k],m.match("^"+c.id+"-")||j.push(m)}h.Ia(j,c,d,e)}}(this.T.length,c,f,g));m.src=(l?b:"")+k;this.T.push(m)}}}else this.N(b),this.Ia(e,c,f,g)},N:function(d){var c=encodeURIComponent;this.H.push((a.Hb?c("---destpub-debug---"):c("---destpub---"))+d)},Ia:function(d,c,b,e){d.push(c.id+"-"+(e+Math.ceil(c.ttl/60/24)));this.rb(d);a.e(b,d.join("*"))},Ga:function(){var d=this,c;this.H.length?(c=this.H.shift(),a.na.postMessage(c,
this.url,this.Aa.contentWindow),this.sb.push(c),setTimeout(function(){d.Ga()},this.Ba)):this.V=k},U:function(a){var c=/^---destpub-to-parent---/;"string"===typeof a&&c.test(a)&&(c=a.replace(c,"").split("|"),"canSetThirdPartyCookies"===c[0]&&(this.pa="true"===c[1]?j:k,this.Ea=j,this.p()),this.tb.push(a))},wb:function(d){if(this.url===i||d.subdomain&&"nosubdomainreturned"===this.g)this.g="string"===typeof a.ma&&a.ma.length?a.ma:d.subdomain||"",this.url=this.kb();d.ibs instanceof Array&&d.ibs.length&&
(this.ua=j);this.Da()&&(a.idSyncAttachIframeOnWindowLoad?(l.Y||"complete"===u.readyState||"loaded"===u.readyState)&&this.O():this.ab());"function"===typeof a.idSyncIDCallResult?a.idSyncIDCallResult(d):this.p(d);"function"===typeof a.idSyncAfterIDCallResult&&a.idSyncAfterIDCallResult(d)},bb:function(d,c){return a.Ib||!d||c-d>r.La},ab:function(){function a(){c.W||(document.body?c.O():setTimeout(a,30))}var c=this;a()}};a.Fb=z;a.timeoutMetricsLog=[];var o={fb:window.performance&&window.performance.timing?
1:0,Ca:window.performance&&window.performance.timing?window.performance.timing:i,X:i,P:i,d:{},S:[],send:function(d){if(a.takeTimeoutMetrics&&d===Object(d)){var c=[],b=encodeURIComponent,e;for(e in d)d.hasOwnProperty(e)&&c.push(b(e)+"="+b(d[e]));d="http"+(a.loadSSL?"s":"")+"://dpm.demdex.net/event?d_visid_ver="+a.version+"&d_visid_stg_timeout="+a.loadTimeout+"&"+c.join("&")+"&d_orgid="+b(a.marketingCloudOrgID)+"&d_timingapi="+this.fb+"&d_winload="+this.lb()+"&d_ld="+this.o();(new Image).src=d;a.timeoutMetricsLog.push(d)}},
lb:function(){this.P===i&&(this.P=this.Ca?this.X-this.Ca.navigationStart:this.X-l.eb);return this.P},o:function(){return(new Date).getTime()},I:function(a){var c=this.d[a],b={};b.d_visid_stg_timeout_captured=c.ta;b.d_visid_cors=c.sa;b.d_fieldgroup=a;b.d_settimeout_overriden=c.ra;c.timeout?c.nb?(b.d_visid_timedout=1,b.d_visid_timeout=c.timeout-c.requestStart,b.d_visid_response=-1):(b.d_visid_timedout="n/a",b.d_visid_timeout="n/a",b.d_visid_response="n/a"):(b.d_visid_timedout=0,b.d_visid_timeout=-1,
b.d_visid_response=c.Ab-c.requestStart);b.d_visid_url=c.url;l.Y?this.send(b):this.S.push(b);delete this.d[a]},zb:function(){for(var a=0,c=this.S.length;a<c;a++)this.send(this.S[a])},ya:function(){return"function"===typeof setTimeout.toString?-1<setTimeout.toString().indexOf("[native code]")?0:1:-1}};a.Mb=o;var w={isClientSideMarketingCloudVisitorID:i,MCIDCallTimedOut:i,AnalyticsIDCallTimedOut:i,AAMIDCallTimedOut:i,d:{},Ha:function(a,c){switch(a){case F:c===k?this.MCIDCallTimedOut!==j&&(this.MCIDCallTimedOut=
k):this.MCIDCallTimedOut=c;break;case D:c===k?this.AnalyticsIDCallTimedOut!==j&&(this.AnalyticsIDCallTimedOut=k):this.AnalyticsIDCallTimedOut=c;break;case C:c===k?this.AAMIDCallTimedOut!==j&&(this.AAMIDCallTimedOut=k):this.AAMIDCallTimedOut=c}}};a.isClientSideMarketingCloudVisitorID=function(){return w.isClientSideMarketingCloudVisitorID};a.MCIDCallTimedOut=function(){return w.MCIDCallTimedOut};a.AnalyticsIDCallTimedOut=function(){return w.AnalyticsIDCallTimedOut};a.AAMIDCallTimedOut=function(){return w.AAMIDCallTimedOut};
a.idSyncGetOnPageSyncInfo=function(){a.f();return a.a(J)};a.idSyncByURL=function(d){var c,b=d||{};c=b.minutesToLive;var e="";a.idSyncDisableSyncs&&(e=e?e:"Error: id syncs have been disabled");if("string"!==typeof b.dpid||!b.dpid.length)e=e?e:"Error: config.dpid is empty";if("string"!==typeof b.url||!b.url.length)e=e?e:"Error: config.url is empty";if("undefined"===typeof c)c=20160;else if(c=parseInt(c,10),isNaN(c)||0>=c)e=e?e:"Error: config.minutesToLive needs to be a positive number";c={error:e,ec:c};
if(c.error)return c.error;var e=d.url,f=encodeURIComponent,b=z,g,e=e.replace(/^https:/,"").replace(/^http:/,"");g=x.va(["",d.dpid,d.dpuuid||""],",");d=["ibs",f(d.dpid),"img",f(e),c.ttl,"",g];b.N(d.join("|"));b.p();return"Successfully queued"};a.idSyncByDataSource=function(d){if(d!==Object(d)||"string"!==typeof d.dpuuid||!d.dpuuid.length)return"Error: config or config.dpuuid is empty";d.url="//dpm.demdex.net/ibs:dpid="+d.dpid+"&dpuuid="+d.dpuuid;return a.idSyncByURL(d)};0>q.indexOf("@")&&(q+="@AdobeOrg");
a.marketingCloudOrgID=q;a.cookieName="AMCV_"+q;a.sessionCookieName="AMCVS_"+q;a.cookieDomain=a.Ra();a.cookieDomain==m.location.hostname&&(a.cookieDomain="");a.loadSSL=0<=m.location.protocol.toLowerCase().indexOf("https");a.loadTimeout=3E4;a.CORSErrors=[];a.marketingCloudServer=a.audienceManagerServer="dpm.demdex.net";var M={};M[A]=j;M[s]=j;if(v&&"object"==typeof v){for(var G in v)!Object.prototype[G]&&(a[G]=v[G]);a.idSyncContainerID=a.idSyncContainerID||0;a.ba();a.f();N=a.a(K);G=Math.ceil((new Date).getTime()/
r.aa);!a.idSyncDisableSyncs&&z.bb(N,G)&&(a.j(s,-1),a.e(K,G));a.getMarketingCloudVisitorID();a.getAudienceManagerLocationHint();a.getAudienceManagerBlob();a.Va(a.serverState)}else a.ba();if(!a.idSyncDisableSyncs){z.cb();x.M(window,"load",function(){l.Y=j;o.X=o.o();o.zb();var a=z;a.Da()&&a.O()});try{a.na.U(function(a){z.U(a.data)},z.Q)}catch(O){}}}
Visitor.getInstance=function(q,v){var y,a=window.s_c_il,m;0>q.indexOf("@")&&(q+="@AdobeOrg");if(a)for(m=0;m<a.length;m++)if((y=a[m])&&"Visitor"==y._c&&y.marketingCloudOrgID==q)return y;return new Visitor(q,v)};(function(){function q(){v.Y=y}var v=window.Visitor,y=v.Oa,a=v.Ma;y||(y=!0);a||(a=!1);window.addEventListener?window.addEventListener("load",q):window.attachEvent&&window.attachEvent("onload",q);v.eb=(new Date).getTime()})();

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

AppMeasurement for JavaScript version: 1.7.0
Copyright 1996-2016 Adobe, Inc. All Rights Reserved
More info available at http://www.adobe.com/marketing-cloud.html
*/
function AppMeasurement(){var a=this;a.version="1.7.0";var k=window;k.s_c_in||(k.s_c_il=[],k.s_c_in=0);a._il=k.s_c_il;a._in=k.s_c_in;a._il[a._in]=a;k.s_c_in++;a._c="s_c";var q=k.AppMeasurement.Jb;q||(q=null);var r=k,n,t;try{for(n=r.parent,t=r.location;n&&n.location&&t&&""+n.location!=""+t&&r.location&&""+n.location!=""+r.location&&n.location.host==t.host;)r=n,n=r.parent}catch(u){}a.yb=function(a){try{console.log(a)}catch(b){}};a.Ha=function(a){return""+parseInt(a)==""+a};a.replace=function(a,b,d){return!a||
0>a.indexOf(b)?a:a.split(b).join(d)};a.escape=function(c){var b,d;if(!c)return c;c=encodeURIComponent(c);for(b=0;7>b;b++)d="+~!*()'".substring(b,b+1),0<=c.indexOf(d)&&(c=a.replace(c,d,"%"+d.charCodeAt(0).toString(16).toUpperCase()));return c};a.unescape=function(c){if(!c)return c;c=0<=c.indexOf("+")?a.replace(c,"+"," "):c;try{return decodeURIComponent(c)}catch(b){}return unescape(c)};a.pb=function(){var c=k.location.hostname,b=a.fpCookieDomainPeriods,d;b||(b=a.cookieDomainPeriods);if(c&&!a.cookieDomain&&
!/^[0-9.]+$/.test(c)&&(b=b?parseInt(b):2,b=2<b?b:2,d=c.lastIndexOf("."),0<=d)){for(;0<=d&&1<b;)d=c.lastIndexOf(".",d-1),b--;a.cookieDomain=0<d?c.substring(d):c}return a.cookieDomain};a.c_r=a.cookieRead=function(c){c=a.escape(c);var b=" "+a.d.cookie,d=b.indexOf(" "+c+"="),f=0>d?d:b.indexOf(";",d);c=0>d?"":a.unescape(b.substring(d+2+c.length,0>f?b.length:f));return"[[B]]"!=c?c:""};a.c_w=a.cookieWrite=function(c,b,d){var f=a.pb(),e=a.cookieLifetime,g;b=""+b;e=e?(""+e).toUpperCase():"";d&&"SESSION"!=
e&&"NONE"!=e&&((g=""!=b?parseInt(e?e:0):-60)?(d=new Date,d.setTime(d.getTime()+1E3*g)):1==d&&(d=new Date,g=d.getYear(),d.setYear(g+5+(1900>g?1900:0))));return c&&"NONE"!=e?(a.d.cookie=a.escape(c)+"="+a.escape(""!=b?b:"[[B]]")+"; path=/;"+(d&&"SESSION"!=e?" expires="+d.toGMTString()+";":"")+(f?" domain="+f+";":""),a.cookieRead(c)==b):0};a.K=[];a.ha=function(c,b,d){if(a.Aa)return 0;a.maxDelay||(a.maxDelay=250);var f=0,e=(new Date).getTime()+a.maxDelay,g=a.d.visibilityState,m=["webkitvisibilitychange",
"visibilitychange"];g||(g=a.d.webkitVisibilityState);if(g&&"prerender"==g){if(!a.ia)for(a.ia=1,d=0;d<m.length;d++)a.d.addEventListener(m[d],function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&(a.ia=0,a.delayReady())});f=1;e=0}else d||a.p("_d")&&(f=1);f&&(a.K.push({m:c,a:b,t:e}),a.ia||setTimeout(a.delayReady,a.maxDelay));return f};a.delayReady=function(){var c=(new Date).getTime(),b=0,d;for(a.p("_d")?b=1:a.va();0<a.K.length;){d=a.K.shift();if(b&&!d.t&&d.t>c){a.K.unshift(d);
setTimeout(a.delayReady,parseInt(a.maxDelay/2));break}a.Aa=1;a[d.m].apply(a,d.a);a.Aa=0}};a.setAccount=a.sa=function(c){var b,d;if(!a.ha("setAccount",arguments))if(a.account=c,a.allAccounts)for(b=a.allAccounts.concat(c.split(",")),a.allAccounts=[],b.sort(),d=0;d<b.length;d++)0!=d&&b[d-1]==b[d]||a.allAccounts.push(b[d]);else a.allAccounts=c.split(",")};a.foreachVar=function(c,b){var d,f,e,g,m="";e=f="";if(a.lightProfileID)d=a.O,(m=a.lightTrackVars)&&(m=","+m+","+a.ma.join(",")+",");else{d=a.g;if(a.pe||
a.linkType)m=a.linkTrackVars,f=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(m=a[e].Hb,f=a[e].Gb));m&&(m=","+m+","+a.G.join(",")+",");f&&m&&(m+=",events,")}b&&(b=","+b+",");for(f=0;f<d.length;f++)e=d[f],(g=a[e])&&(!m||0<=m.indexOf(","+e+","))&&(!b||0<=b.indexOf(","+e+","))&&c(e,g)};a.r=function(c,b,d,f,e){var g="",m,p,k,w,n=0;"contextData"==c&&(c="c");if(b){for(m in b)if(!(Object.prototype[m]||e&&m.substring(0,e.length)!=e)&&b[m]&&(!d||0<=d.indexOf(","+(f?f+
".":"")+m+","))){k=!1;if(n)for(p=0;p<n.length;p++)m.substring(0,n[p].length)==n[p]&&(k=!0);if(!k&&(""==g&&(g+="&"+c+"."),p=b[m],e&&(m=m.substring(e.length)),0<m.length))if(k=m.indexOf("."),0<k)p=m.substring(0,k),k=(e?e:"")+p+".",n||(n=[]),n.push(k),g+=a.r(p,b,d,f,k);else if("boolean"==typeof p&&(p=p?"true":"false"),p){if("retrieveLightData"==f&&0>e.indexOf(".contextData."))switch(k=m.substring(0,4),w=m.substring(4),m){case "transactionID":m="xact";break;case "channel":m="ch";break;case "campaign":m=
"v0";break;default:a.Ha(w)&&("prop"==k?m="c"+w:"eVar"==k?m="v"+w:"list"==k?m="l"+w:"hier"==k&&(m="h"+w,p=p.substring(0,255)))}g+="&"+a.escape(m)+"="+a.escape(p)}}""!=g&&(g+="&."+c)}return g};a.usePostbacks=0;a.sb=function(){var c="",b,d,f,e,g,m,p,k,n="",r="",s=e="";if(a.lightProfileID)b=a.O,(n=a.lightTrackVars)&&(n=","+n+","+a.ma.join(",")+",");else{b=a.g;if(a.pe||a.linkType)n=a.linkTrackVars,r=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(n=a[e].Hb,r=a[e].Gb));
n&&(n=","+n+","+a.G.join(",")+",");r&&(r=","+r+",",n&&(n+=",events,"));a.events2&&(s+=(""!=s?",":"")+a.events2)}if(a.visitor&&1.5<=parseFloat(a.visitor.version)&&a.visitor.getCustomerIDs){e=q;if(g=a.visitor.getCustomerIDs())for(d in g)Object.prototype[d]||(f=g[d],e||(e={}),f.id&&(e[d+".id"]=f.id),f.authState&&(e[d+".as"]=f.authState));e&&(c+=a.r("cid",e))}a.AudienceManagement&&a.AudienceManagement.isReady()&&(c+=a.r("d",a.AudienceManagement.getEventCallConfigParams()));for(d=0;d<b.length;d++){e=b[d];
g=a[e];f=e.substring(0,4);m=e.substring(4);!g&&"events"==e&&s&&(g=s,s="");if(g&&(!n||0<=n.indexOf(","+e+","))){switch(e){case "supplementalDataID":e="sdid";break;case "timestamp":e="ts";break;case "dynamicVariablePrefix":e="D";break;case "visitorID":e="vid";break;case "marketingCloudVisitorID":e="mid";break;case "analyticsVisitorID":e="aid";break;case "audienceManagerLocationHint":e="aamlh";break;case "audienceManagerBlob":e="aamb";break;case "authState":e="as";break;case "pageURL":e="g";255<g.length&&
(a.pageURLRest=g.substring(255),g=g.substring(0,255));break;case "pageURLRest":e="-g";break;case "referrer":e="r";break;case "vmk":case "visitorMigrationKey":e="vmt";break;case "visitorMigrationServer":e="vmf";a.ssl&&a.visitorMigrationServerSecure&&(g="");break;case "visitorMigrationServerSecure":e="vmf";!a.ssl&&a.visitorMigrationServer&&(g="");break;case "charSet":e="ce";break;case "visitorNamespace":e="ns";break;case "cookieDomainPeriods":e="cdp";break;case "cookieLifetime":e="cl";break;case "variableProvider":e=
"vvp";break;case "currencyCode":e="cc";break;case "channel":e="ch";break;case "transactionID":e="xact";break;case "campaign":e="v0";break;case "latitude":e="lat";break;case "longitude":e="lon";break;case "resolution":e="s";break;case "colorDepth":e="c";break;case "javascriptVersion":e="j";break;case "javaEnabled":e="v";break;case "cookiesEnabled":e="k";break;case "browserWidth":e="bw";break;case "browserHeight":e="bh";break;case "connectionType":e="ct";break;case "homepage":e="hp";break;case "events":s&&
(g+=(""!=g?",":"")+s);if(r)for(m=g.split(","),g="",f=0;f<m.length;f++)p=m[f],k=p.indexOf("="),0<=k&&(p=p.substring(0,k)),k=p.indexOf(":"),0<=k&&(p=p.substring(0,k)),0<=r.indexOf(","+p+",")&&(g+=(g?",":"")+m[f]);break;case "events2":g="";break;case "contextData":c+=a.r("c",a[e],n,e);g="";break;case "lightProfileID":e="mtp";break;case "lightStoreForSeconds":e="mtss";a.lightProfileID||(g="");break;case "lightIncrementBy":e="mti";a.lightProfileID||(g="");break;case "retrieveLightProfiles":e="mtsr";break;
case "deleteLightProfiles":e="mtsd";break;case "retrieveLightData":a.retrieveLightProfiles&&(c+=a.r("mts",a[e],n,e));g="";break;default:a.Ha(m)&&("prop"==f?e="c"+m:"eVar"==f?e="v"+m:"list"==f?e="l"+m:"hier"==f&&(e="h"+m,g=g.substring(0,255)))}g&&(c+="&"+e+"="+("pev"!=e.substring(0,3)?a.escape(g):g))}"pev3"==e&&a.e&&(c+=a.e)}return c};a.D=function(a){var b=a.tagName;if("undefined"!=""+a.Mb||"undefined"!=""+a.Cb&&"HTML"!=(""+a.Cb).toUpperCase())return"";b=b&&b.toUpperCase?b.toUpperCase():"";"SHAPE"==
b&&(b="");b&&(("INPUT"==b||"BUTTON"==b)&&a.type&&a.type.toUpperCase?b=a.type.toUpperCase():!b&&a.href&&(b="A"));return b};a.Da=function(a){var b=a.href?a.href:"",d,f,e;d=b.indexOf(":");f=b.indexOf("?");e=b.indexOf("/");b&&(0>d||0<=f&&d>f||0<=e&&d>e)&&(f=a.protocol&&1<a.protocol.length?a.protocol:l.protocol?l.protocol:"",d=l.pathname.lastIndexOf("/"),b=(f?f+"//":"")+(a.host?a.host:l.host?l.host:"")+("/"!=h.substring(0,1)?l.pathname.substring(0,0>d?0:d)+"/":"")+b);return b};a.L=function(c){var b=a.D(c),
d,f,e="",g=0;return b&&(d=c.protocol,f=c.onclick,!c.href||"A"!=b&&"AREA"!=b||f&&d&&!(0>d.toLowerCase().indexOf("javascript"))?f?(e=a.replace(a.replace(a.replace(a.replace(""+f,"\r",""),"\n",""),"\t","")," ",""),g=2):"INPUT"==b||"SUBMIT"==b?(c.value?e=c.value:c.innerText?e=c.innerText:c.textContent&&(e=c.textContent),g=3):"IMAGE"==b&&c.src&&(e=c.src):e=a.Da(c),e)?{id:e.substring(0,100),type:g}:0};a.Kb=function(c){for(var b=a.D(c),d=a.L(c);c&&!d&&"BODY"!=b;)if(c=c.parentElement?c.parentElement:c.parentNode)b=
a.D(c),d=a.L(c);d&&"BODY"!=b||(c=0);c&&(b=c.onclick?""+c.onclick:"",0<=b.indexOf(".tl(")||0<=b.indexOf(".trackLink("))&&(c=0);return c};a.Bb=function(){var c,b,d=a.linkObject,f=a.linkType,e=a.linkURL,g,m;a.na=1;d||(a.na=0,d=a.clickObject);if(d){c=a.D(d);for(b=a.L(d);d&&!b&&"BODY"!=c;)if(d=d.parentElement?d.parentElement:d.parentNode)c=a.D(d),b=a.L(d);b&&"BODY"!=c||(d=0);if(d&&!a.linkObject){var p=d.onclick?""+d.onclick:"";if(0<=p.indexOf(".tl(")||0<=p.indexOf(".trackLink("))d=0}}else a.na=1;!e&&d&&
(e=a.Da(d));e&&!a.linkLeaveQueryString&&(g=e.indexOf("?"),0<=g&&(e=e.substring(0,g)));if(!f&&e){var n=0,r=0,q;if(a.trackDownloadLinks&&a.linkDownloadFileTypes)for(p=e.toLowerCase(),g=p.indexOf("?"),m=p.indexOf("#"),0<=g?0<=m&&m<g&&(g=m):g=m,0<=g&&(p=p.substring(0,g)),g=a.linkDownloadFileTypes.toLowerCase().split(","),m=0;m<g.length;m++)(q=g[m])&&p.substring(p.length-(q.length+1))=="."+q&&(f="d");if(a.trackExternalLinks&&!f&&(p=e.toLowerCase(),a.Ga(p)&&(a.linkInternalFilters||(a.linkInternalFilters=
k.location.hostname),g=0,a.linkExternalFilters?(g=a.linkExternalFilters.toLowerCase().split(","),n=1):a.linkInternalFilters&&(g=a.linkInternalFilters.toLowerCase().split(",")),g))){for(m=0;m<g.length;m++)q=g[m],0<=p.indexOf(q)&&(r=1);r?n&&(f="e"):n||(f="e")}}a.linkObject=d;a.linkURL=e;a.linkType=f;if(a.trackClickMap||a.trackInlineStats)a.e="",d&&(f=a.pageName,e=1,d=d.sourceIndex,f||(f=a.pageURL,e=0),k.s_objectID&&(b.id=k.s_objectID,d=b.type=1),f&&b&&b.id&&c&&(a.e="&pid="+a.escape(f.substring(0,255))+
(e?"&pidt="+e:"")+"&oid="+a.escape(b.id.substring(0,100))+(b.type?"&oidt="+b.type:"")+"&ot="+c+(d?"&oi="+d:"")))};a.tb=function(){var c=a.na,b=a.linkType,d=a.linkURL,f=a.linkName;b&&(d||f)&&(b=b.toLowerCase(),"d"!=b&&"e"!=b&&(b="o"),a.pe="lnk_"+b,a.pev1=d?a.escape(d):"",a.pev2=f?a.escape(f):"",c=1);a.abort&&(c=0);if(a.trackClickMap||a.trackInlineStats||a.ActivityMap){var b={},d=0,e=a.cookieRead("s_sq"),g=e?e.split("&"):0,m,p,k,e=0;if(g)for(m=0;m<g.length;m++)p=g[m].split("="),f=a.unescape(p[0]).split(","),
p=a.unescape(p[1]),b[p]=f;f=a.account.split(",");m={};for(k in a.contextData)k&&!Object.prototype[k]&&"a.activitymap."==k.substring(0,14)&&(m[k]=a.contextData[k],a.contextData[k]="");a.e=a.r("c",m)+(a.e?a.e:"");if(c||a.e){c&&!a.e&&(e=1);for(p in b)if(!Object.prototype[p])for(k=0;k<f.length;k++)for(e&&(g=b[p].join(","),g==a.account&&(a.e+=("&"!=p.charAt(0)?"&":"")+p,b[p]=[],d=1)),m=0;m<b[p].length;m++)g=b[p][m],g==f[k]&&(e&&(a.e+="&u="+a.escape(g)+("&"!=p.charAt(0)?"&":"")+p+"&u=0"),b[p].splice(m,
1),d=1);c||(d=1);if(d){e="";m=2;!c&&a.e&&(e=a.escape(f.join(","))+"="+a.escape(a.e),m=1);for(p in b)!Object.prototype[p]&&0<m&&0<b[p].length&&(e+=(e?"&":"")+a.escape(b[p].join(","))+"="+a.escape(p),m--);a.cookieWrite("s_sq",e)}}}return c};a.ub=function(){if(!a.Fb){var c=new Date,b=r.location,d,f,e=f=d="",g="",m="",k="1.2",n=a.cookieWrite("s_cc","true",0)?"Y":"N",q="",s="";if(c.setUTCDate&&(k="1.3",(0).toPrecision&&(k="1.5",c=[],c.forEach))){k="1.6";f=0;d={};try{f=new Iterator(d),f.next&&(k="1.7",
c.reduce&&(k="1.8",k.trim&&(k="1.8.1",Date.parse&&(k="1.8.2",Object.create&&(k="1.8.5")))))}catch(t){}}d=screen.width+"x"+screen.height;e=navigator.javaEnabled()?"Y":"N";f=screen.pixelDepth?screen.pixelDepth:screen.colorDepth;g=a.w.innerWidth?a.w.innerWidth:a.d.documentElement.offsetWidth;m=a.w.innerHeight?a.w.innerHeight:a.d.documentElement.offsetHeight;try{a.b.addBehavior("#default#homePage"),q=a.b.Lb(b)?"Y":"N"}catch(u){}try{a.b.addBehavior("#default#clientCaps"),s=a.b.connectionType}catch(x){}a.resolution=
d;a.colorDepth=f;a.javascriptVersion=k;a.javaEnabled=e;a.cookiesEnabled=n;a.browserWidth=g;a.browserHeight=m;a.connectionType=s;a.homepage=q;a.Fb=1}};a.P={};a.loadModule=function(c,b){var d=a.P[c];if(!d){d=k["AppMeasurement_Module_"+c]?new k["AppMeasurement_Module_"+c](a):{};a.P[c]=a[c]=d;d.Xa=function(){return d.ab};d.bb=function(b){if(d.ab=b)a[c+"_onLoad"]=b,a.ha(c+"_onLoad",[a,d],1)||b(a,d)};try{Object.defineProperty?Object.defineProperty(d,"onLoad",{get:d.Xa,set:d.bb}):d._olc=1}catch(f){d._olc=
1}}b&&(a[c+"_onLoad"]=b,a.ha(c+"_onLoad",[a,d],1)||b(a,d))};a.p=function(c){var b,d;for(b in a.P)if(!Object.prototype[b]&&(d=a.P[b])&&(d._olc&&d.onLoad&&(d._olc=0,d.onLoad(a,d)),d[c]&&d[c]()))return 1;return 0};a.wb=function(){var c=Math.floor(1E13*Math.random()),b=a.visitorSampling,d=a.visitorSamplingGroup,d="s_vsn_"+(a.visitorNamespace?a.visitorNamespace:a.account)+(d?"_"+d:""),f=a.cookieRead(d);if(b){f&&(f=parseInt(f));if(!f){if(!a.cookieWrite(d,c))return 0;f=c}if(f%1E4>v)return 0}return 1};a.Q=
function(c,b){var d,f,e,g,m,k;for(d=0;2>d;d++)for(f=0<d?a.wa:a.g,e=0;e<f.length;e++)if(g=f[e],(m=c[g])||c["!"+g]){if(!b&&("contextData"==g||"retrieveLightData"==g)&&a[g])for(k in a[g])m[k]||(m[k]=a[g][k]);a[g]=m}};a.Qa=function(c,b){var d,f,e,g;for(d=0;2>d;d++)for(f=0<d?a.wa:a.g,e=0;e<f.length;e++)g=f[e],c[g]=a[g],b||c[g]||(c["!"+g]=1)};a.ob=function(a){var b,d,f,e,g,k=0,p,n="",q="";if(a&&255<a.length&&(b=""+a,d=b.indexOf("?"),0<d&&(p=b.substring(d+1),b=b.substring(0,d),e=b.toLowerCase(),f=0,"http://"==
e.substring(0,7)?f+=7:"https://"==e.substring(0,8)&&(f+=8),d=e.indexOf("/",f),0<d&&(e=e.substring(f,d),g=b.substring(d),b=b.substring(0,d),0<=e.indexOf("google")?k=",q,ie,start,search_key,word,kw,cd,":0<=e.indexOf("yahoo.co")&&(k=",p,ei,"),k&&p)))){if((a=p.split("&"))&&1<a.length){for(f=0;f<a.length;f++)e=a[f],d=e.indexOf("="),0<d&&0<=k.indexOf(","+e.substring(0,d)+",")?n+=(n?"&":"")+e:q+=(q?"&":"")+e;n&&q?p=n+"&"+q:q=""}d=253-(p.length-q.length)-b.length;a=b+(0<d?g.substring(0,d):"")+"?"+p}return a};
a.Wa=function(c){var b=a.d.visibilityState,d=["webkitvisibilitychange","visibilitychange"];b||(b=a.d.webkitVisibilityState);if(b&&"prerender"==b){if(c)for(b=0;b<d.length;b++)a.d.addEventListener(d[b],function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&c()});return!1}return!0};a.da=!1;a.I=!1;a.eb=function(){a.I=!0;a.j()};a.ba=!1;a.U=!1;a.$a=function(c){a.marketingCloudVisitorID=c;a.U=!0;a.j()};a.ea=!1;a.V=!1;a.fb=function(c){a.visitorOptedOut=c;a.V=!0;a.j()};a.Y=!1;
a.R=!1;a.Sa=function(c){a.analyticsVisitorID=c;a.R=!0;a.j()};a.aa=!1;a.T=!1;a.Ua=function(c){a.audienceManagerLocationHint=c;a.T=!0;a.j()};a.Z=!1;a.S=!1;a.Ta=function(c){a.audienceManagerBlob=c;a.S=!0;a.j()};a.Va=function(c){a.maxDelay||(a.maxDelay=250);return a.p("_d")?(c&&setTimeout(function(){c()},a.maxDelay),!1):!0};a.ca=!1;a.H=!1;a.va=function(){a.H=!0;a.j()};a.isReadyToTrack=function(){var c=!0,b=a.visitor,d,f,e;a.da||a.I||(a.Wa(a.eb)?a.I=!0:a.da=!0);if(a.da&&!a.I)return!1;b&&b.isAllowed()&&
(a.ba||a.marketingCloudVisitorID||!b.getMarketingCloudVisitorID||(a.ba=!0,a.marketingCloudVisitorID=b.getMarketingCloudVisitorID([a,a.$a]),a.marketingCloudVisitorID&&(a.U=!0)),a.ea||a.visitorOptedOut||!b.isOptedOut||(a.ea=!0,a.visitorOptedOut=b.isOptedOut([a,a.fb]),a.visitorOptedOut!=q&&(a.V=!0)),a.Y||a.analyticsVisitorID||!b.getAnalyticsVisitorID||(a.Y=!0,a.analyticsVisitorID=b.getAnalyticsVisitorID([a,a.Sa]),a.analyticsVisitorID&&(a.R=!0)),a.aa||a.audienceManagerLocationHint||!b.getAudienceManagerLocationHint||
(a.aa=!0,a.audienceManagerLocationHint=b.getAudienceManagerLocationHint([a,a.Ua]),a.audienceManagerLocationHint&&(a.T=!0)),a.Z||a.audienceManagerBlob||!b.getAudienceManagerBlob||(a.Z=!0,a.audienceManagerBlob=b.getAudienceManagerBlob([a,a.Ta]),a.audienceManagerBlob&&(a.S=!0)),c=a.ba&&!a.U&&!a.marketingCloudVisitorID,b=a.Y&&!a.R&&!a.analyticsVisitorID,d=a.aa&&!a.T&&!a.audienceManagerLocationHint,f=a.Z&&!a.S&&!a.audienceManagerBlob,e=a.ea&&!a.V,c=c||b||d||f||e?!1:!0);a.ca||a.H||(a.Va(a.va)?a.H=!0:a.ca=
!0);a.ca&&!a.H&&(c=!1);return c};a.o=q;a.u=0;a.callbackWhenReadyToTrack=function(c,b,d){var f;f={};f.jb=c;f.ib=b;f.gb=d;a.o==q&&(a.o=[]);a.o.push(f);0==a.u&&(a.u=setInterval(a.j,100))};a.j=function(){var c;if(a.isReadyToTrack()&&(a.cb(),a.o!=q))for(;0<a.o.length;)c=a.o.shift(),c.ib.apply(c.jb,c.gb)};a.cb=function(){a.u&&(clearInterval(a.u),a.u=0)};a.Ya=function(c){var b,d,f=q,e=q;if(!a.isReadyToTrack()){b=[];if(c!=q)for(d in f={},c)f[d]=c[d];e={};a.Qa(e,!0);b.push(f);b.push(e);a.callbackWhenReadyToTrack(a,
a.track,b);return!0}return!1};a.qb=function(){var c=a.cookieRead("s_fid"),b="",d="",f;f=8;var e=4;if(!c||0>c.indexOf("-")){for(c=0;16>c;c++)f=Math.floor(Math.random()*f),b+="0123456789ABCDEF".substring(f,f+1),f=Math.floor(Math.random()*e),d+="0123456789ABCDEF".substring(f,f+1),f=e=16;c=b+"-"+d}a.cookieWrite("s_fid",c,1)||(c=0);return c};a.t=a.track=function(c,b){var d,f=new Date,e="s"+Math.floor(f.getTime()/108E5)%10+Math.floor(1E13*Math.random()),g=f.getYear(),g="t="+a.escape(f.getDate()+"/"+f.getMonth()+
"/"+(1900>g?g+1900:g)+" "+f.getHours()+":"+f.getMinutes()+":"+f.getSeconds()+" "+f.getDay()+" "+f.getTimezoneOffset());a.visitor&&(a.visitor.getAuthState&&(a.authState=a.visitor.getAuthState()),!a.supplementalDataID&&a.visitor.getSupplementalDataID&&(a.supplementalDataID=a.visitor.getSupplementalDataID("AppMeasurement:"+a._in,a.expectSupplementalData?!1:!0)));a.p("_s");a.Ya(c)||(b&&a.Q(b),c&&(d={},a.Qa(d,0),a.Q(c)),a.wb()&&!a.visitorOptedOut&&(a.analyticsVisitorID||a.marketingCloudVisitorID||(a.fid=
a.qb()),a.Bb(),a.usePlugins&&a.doPlugins&&a.doPlugins(a),a.account&&(a.abort||(a.trackOffline&&!a.timestamp&&(a.timestamp=Math.floor(f.getTime()/1E3)),f=k.location,a.pageURL||(a.pageURL=f.href?f.href:f),a.referrer||a.Ra||(a.referrer=r.document.referrer),a.Ra=1,a.referrer=a.ob(a.referrer),a.p("_g")),a.tb()&&!a.abort&&(a.ub(),g+=a.sb(),a.Ab(e,g),a.p("_t"),a.referrer=""))),c&&a.Q(d,1));a.abort=a.supplementalDataID=a.timestamp=a.pageURLRest=a.linkObject=a.clickObject=a.linkURL=a.linkName=a.linkType=k.s_objectID=
a.pe=a.pev1=a.pev2=a.pev3=a.e=a.lightProfileID=0};a.tl=a.trackLink=function(c,b,d,f,e){a.linkObject=c;a.linkType=b;a.linkName=d;e&&(a.l=c,a.A=e);return a.track(f)};a.trackLight=function(c,b,d,f){a.lightProfileID=c;a.lightStoreForSeconds=b;a.lightIncrementBy=d;return a.track(f)};a.clearVars=function(){var c,b;for(c=0;c<a.g.length;c++)if(b=a.g[c],"prop"==b.substring(0,4)||"eVar"==b.substring(0,4)||"hier"==b.substring(0,4)||"list"==b.substring(0,4)||"channel"==b||"events"==b||"eventList"==b||"products"==
b||"productList"==b||"purchaseID"==b||"transactionID"==b||"state"==b||"zip"==b||"campaign"==b)a[b]=void 0};a.tagContainerMarker="";a.Ab=function(c,b){var d,f=a.trackingServer;d="";var e=a.dc,g="sc.",k=a.visitorNamespace;f?a.trackingServerSecure&&a.ssl&&(f=a.trackingServerSecure):(k||(k=a.account,f=k.indexOf(","),0<=f&&(k=k.substring(0,f)),k=k.replace(/[^A-Za-z0-9]/g,"")),d||(d="2o7.net"),e=e?(""+e).toLowerCase():"d1","2o7.net"==d&&("d1"==e?e="112":"d2"==e&&(e="122"),g=""),f=k+"."+e+"."+g+d);d=a.ssl?
"https://":"http://";e=a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks;d+=f+"/b/ss/"+a.account+"/"+(a.mobile?"5.":"")+(e?"10":"1")+"/JS-"+a.version+(a.Eb?"T":"")+(a.tagContainerMarker?"-"+a.tagContainerMarker:"")+"/"+c+"?AQB=1&ndh=1&pf=1&"+(e?"callback=s_c_il["+a._in+"].doPostbacks&et=1&":"")+b+"&AQE=1";a.mb(d);a.ja()};a.Pa=/{(%?)(.*?)(%?)}/;a.Ib=RegExp(a.Pa.source,"g");a.nb=function(c){if("object"==typeof c.dests)for(var b=0;b<c.dests.length;++b)if(o=c.dests[b],"string"==
typeof o.c&&"aa."==o.id.substr(0,3))for(var d=o.c.match(a.Ib),b=0;b<d.length;++b){match=d[b];var f=match.match(a.Pa),e="";"%"==f[1]&&"timezone_offset"==f[2]?e=(new Date).getTimezoneOffset():"%"==f[1]&&"timestampz"==f[2]&&(e=a.rb());o.c=o.c.replace(match,a.escape(e))}};a.rb=function(){var c=new Date,b=new Date(6E4*Math.abs(c.getTimezoneOffset()));return a.k(4,c.getFullYear())+"-"+a.k(2,c.getMonth()+1)+"-"+a.k(2,c.getDate())+"T"+a.k(2,c.getHours())+":"+a.k(2,c.getMinutes())+":"+a.k(2,c.getSeconds())+
(0<c.getTimezoneOffset()?"-":"+")+a.k(2,b.getUTCHours())+":"+a.k(2,b.getUTCMinutes())};a.k=function(a,b){return(Array(a+1).join(0)+b).slice(-a)};a.ra={};a.doPostbacks=function(c){if("object"==typeof c)if(a.nb(c),"object"==typeof a.AudienceManagement&&"function"==typeof a.AudienceManagement.isReady&&a.AudienceManagement.isReady()&&"function"==typeof a.AudienceManagement.passData)a.AudienceManagement.passData(c);else if("object"==typeof c&&"object"==typeof c.dests)for(var b=0;b<c.dests.length;++b)dest=
c.dests[b],"object"==typeof dest&&"string"==typeof dest.c&&"string"==typeof dest.id&&"aa."==dest.id.substr(0,3)&&(a.ra[dest.id]=new Image,a.ra[dest.id].alt="",a.ra[dest.id].src=dest.c)};a.mb=function(c){a.i||a.vb();a.i.push(c);a.la=a.C();a.Na()};a.vb=function(){a.i=a.xb();a.i||(a.i=[])};a.xb=function(){var c,b;if(a.qa()){try{(b=k.localStorage.getItem(a.oa()))&&(c=k.JSON.parse(b))}catch(d){}return c}};a.qa=function(){var c=!0;a.trackOffline&&a.offlineFilename&&k.localStorage&&k.JSON||(c=!1);return c};
a.Ea=function(){var c=0;a.i&&(c=a.i.length);a.q&&c++;return c};a.ja=function(){if(a.q&&(a.B&&a.B.complete&&a.B.F&&a.B.ua(),a.q))return;a.Fa=q;if(a.pa)a.la>a.N&&a.La(a.i),a.ta(500);else{var c=a.hb();if(0<c)a.ta(c);else if(c=a.Ba())a.q=1,a.zb(c),a.Db(c)}};a.ta=function(c){a.Fa||(c||(c=0),a.Fa=setTimeout(a.ja,c))};a.hb=function(){var c;if(!a.trackOffline||0>=a.offlineThrottleDelay)return 0;c=a.C()-a.Ka;return a.offlineThrottleDelay<c?0:a.offlineThrottleDelay-c};a.Ba=function(){if(0<a.i.length)return a.i.shift()};
a.zb=function(c){if(a.debugTracking){var b="AppMeasurement Debug: "+c;c=c.split("&");var d;for(d=0;d<c.length;d++)b+="\n\t"+a.unescape(c[d]);a.yb(b)}};a.Za=function(){return a.marketingCloudVisitorID||a.analyticsVisitorID};a.X=!1;var s;try{s=JSON.parse('{"x":"y"}')}catch(x){s=null}s&&"y"==s.x?(a.X=!0,a.W=function(a){return JSON.parse(a)}):k.$&&k.$.parseJSON?(a.W=function(a){return k.$.parseJSON(a)},a.X=!0):a.W=function(){return null};a.Db=function(c){var b,d,f;a.Za()&&2047<c.length&&("undefined"!=
typeof XMLHttpRequest&&(b=new XMLHttpRequest,"withCredentials"in b?d=1:b=0),b||"undefined"==typeof XDomainRequest||(b=new XDomainRequest,d=2),b&&(a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks)&&(a.X?b.xa=!0:b=0));!b&&a.Oa&&(c=c.substring(0,2047));!b&&a.d.createElement&&(0!=a.usePostbacks||a.AudienceManagement&&a.AudienceManagement.isReady())&&(b=a.d.createElement("SCRIPT"))&&"async"in b&&((f=(f=a.d.getElementsByTagName("HEAD"))&&f[0]?f[0]:a.d.body)?(b.type="text/javascript",
b.setAttribute("async","async"),d=3):b=0);b||(b=new Image,b.alt="",b.abort||"undefined"===typeof k.InstallTrigger||(b.abort=function(){b.src=q}));b.za=function(){try{b.F&&(clearTimeout(b.F),b.F=0)}catch(a){}};b.onload=b.ua=function(){b.za();a.lb();a.fa();a.q=0;a.ja();if(b.xa){b.xa=!1;try{a.doPostbacks(a.W(b.responseText))}catch(c){}}};b.onabort=b.onerror=b.Ca=function(){b.za();(a.trackOffline||a.pa)&&a.q&&a.i.unshift(a.kb);a.q=0;a.la>a.N&&a.La(a.i);a.fa();a.ta(500)};b.onreadystatechange=function(){4==
b.readyState&&(200==b.status?b.ua():b.Ca())};a.Ka=a.C();if(1==d||2==d){var e=c.indexOf("?");f=c.substring(0,e);e=c.substring(e+1);e=e.replace(/&callback=[a-zA-Z0-9_.\[\]]+/,"");1==d?(b.open("POST",f,!0),b.send(e)):2==d&&(b.open("POST",f),b.send(e))}else if(b.src=c,3==d){if(a.Ia)try{f.removeChild(a.Ia)}catch(g){}f.firstChild?f.insertBefore(b,f.firstChild):f.appendChild(b);a.Ia=a.B}b.F=setTimeout(function(){b.F&&(b.complete?b.ua():(a.trackOffline&&b.abort&&b.abort(),b.Ca()))},5E3);a.kb=c;a.B=k["s_i_"+
a.replace(a.account,",","_")]=b;if(a.useForcedLinkTracking&&a.J||a.A)a.forcedLinkTrackingTimeout||(a.forcedLinkTrackingTimeout=250),a.ga=setTimeout(a.fa,a.forcedLinkTrackingTimeout)};a.lb=function(){if(a.qa()&&!(a.Ja>a.N))try{k.localStorage.removeItem(a.oa()),a.Ja=a.C()}catch(c){}};a.La=function(c){if(a.qa()){a.Na();try{k.localStorage.setItem(a.oa(),k.JSON.stringify(c)),a.N=a.C()}catch(b){}}};a.Na=function(){if(a.trackOffline){if(!a.offlineLimit||0>=a.offlineLimit)a.offlineLimit=10;for(;a.i.length>
a.offlineLimit;)a.Ba()}};a.forceOffline=function(){a.pa=!0};a.forceOnline=function(){a.pa=!1};a.oa=function(){return a.offlineFilename+"-"+a.visitorNamespace+a.account};a.C=function(){return(new Date).getTime()};a.Ga=function(a){a=a.toLowerCase();return 0!=a.indexOf("#")&&0!=a.indexOf("about:")&&0!=a.indexOf("opera:")&&0!=a.indexOf("javascript:")?!0:!1};a.setTagContainer=function(c){var b,d,f;a.Eb=c;for(b=0;b<a._il.length;b++)if((d=a._il[b])&&"s_l"==d._c&&d.tagContainerName==c){a.Q(d);if(d.lmq)for(b=
0;b<d.lmq.length;b++)f=d.lmq[b],a.loadModule(f.n);if(d.ml)for(f in d.ml)if(a[f])for(b in c=a[f],f=d.ml[f],f)!Object.prototype[b]&&("function"!=typeof f[b]||0>(""+f[b]).indexOf("s_c_il"))&&(c[b]=f[b]);if(d.mmq)for(b=0;b<d.mmq.length;b++)f=d.mmq[b],a[f.m]&&(c=a[f.m],c[f.f]&&"function"==typeof c[f.f]&&(f.a?c[f.f].apply(c,f.a):c[f.f].apply(c)));if(d.tq)for(b=0;b<d.tq.length;b++)a.track(d.tq[b]);d.s=a;break}};a.Util={urlEncode:a.escape,urlDecode:a.unescape,cookieRead:a.cookieRead,cookieWrite:a.cookieWrite,
getQueryParam:function(c,b,d){var f;b||(b=a.pageURL?a.pageURL:k.location);d||(d="&");return c&&b&&(b=""+b,f=b.indexOf("?"),0<=f&&(b=d+b.substring(f+1)+d,f=b.indexOf(d+c+"="),0<=f&&(b=b.substring(f+d.length+c.length+1),f=b.indexOf(d),0<=f&&(b=b.substring(0,f)),0<b.length)))?a.unescape(b):""}};a.G="supplementalDataID timestamp dynamicVariablePrefix visitorID marketingCloudVisitorID analyticsVisitorID audienceManagerLocationHint authState fid vmk visitorMigrationKey visitorMigrationServer visitorMigrationServerSecure charSet visitorNamespace cookieDomainPeriods fpCookieDomainPeriods cookieLifetime pageName pageURL referrer contextData currencyCode lightProfileID lightStoreForSeconds lightIncrementBy retrieveLightProfiles deleteLightProfiles retrieveLightData".split(" ");
a.g=a.G.concat("purchaseID variableProvider channel server pageType transactionID campaign state zip events events2 products audienceManagerBlob tnt".split(" "));a.ma="timestamp charSet visitorNamespace cookieDomainPeriods cookieLifetime contextData lightProfileID lightStoreForSeconds lightIncrementBy".split(" ");a.O=a.ma.slice(0);a.wa="account allAccounts debugTracking visitor visitorOptedOut trackOffline offlineLimit offlineThrottleDelay offlineFilename usePlugins doPlugins configURL visitorSampling visitorSamplingGroup linkObject clickObject linkURL linkName linkType trackDownloadLinks trackExternalLinks trackClickMap trackInlineStats linkLeaveQueryString linkTrackVars linkTrackEvents linkDownloadFileTypes linkExternalFilters linkInternalFilters useForcedLinkTracking forcedLinkTrackingTimeout trackingServer trackingServerSecure ssl abort mobile dc lightTrackVars maxDelay expectSupplementalData usePostbacks AudienceManagement".split(" ");
for(n=0;250>=n;n++)76>n&&(a.g.push("prop"+n),a.O.push("prop"+n)),a.g.push("eVar"+n),a.O.push("eVar"+n),6>n&&a.g.push("hier"+n),4>n&&a.g.push("list"+n);n="pe pev1 pev2 pev3 latitude longitude resolution colorDepth javascriptVersion javaEnabled cookiesEnabled browserWidth browserHeight connectionType homepage pageURLRest".split(" ");a.g=a.g.concat(n);a.G=a.G.concat(n);a.ssl=0<=k.location.protocol.toLowerCase().indexOf("https");a.charSet="UTF-8";a.contextData={};a.offlineThrottleDelay=0;a.offlineFilename=
"AppMeasurement.offline";a.Ka=0;a.la=0;a.N=0;a.Ja=0;a.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";a.w=k;a.d=k.document;try{if(a.Oa=!1,navigator){var y=navigator.userAgent;if("Microsoft Internet Explorer"==navigator.appName||0<=y.indexOf("MSIE ")||0<=y.indexOf("Trident/")&&0<=y.indexOf("Windows NT 6"))a.Oa=!0}}catch(z){}a.fa=function(){a.ga&&(k.clearTimeout(a.ga),a.ga=q);a.l&&a.J&&a.l.dispatchEvent(a.J);a.A&&("function"==typeof a.A?a.A():a.l&&a.l.href&&(a.d.location=
a.l.href));a.l=a.J=a.A=0};a.Ma=function(){a.b=a.d.body;a.b?(a.v=function(c){var b,d,f,e,g;if(!(a.d&&a.d.getElementById("cppXYctnr")||c&&c["s_fe_"+a._in])){if(a.ya)if(a.useForcedLinkTracking)a.b.removeEventListener("click",a.v,!1);else{a.b.removeEventListener("click",a.v,!0);a.ya=a.useForcedLinkTracking=0;return}else a.useForcedLinkTracking=0;a.clickObject=c.srcElement?c.srcElement:c.target;try{if(!a.clickObject||a.M&&a.M==a.clickObject||!(a.clickObject.tagName||a.clickObject.parentElement||a.clickObject.parentNode))a.clickObject=
0;else{var m=a.M=a.clickObject;a.ka&&(clearTimeout(a.ka),a.ka=0);a.ka=setTimeout(function(){a.M==m&&(a.M=0)},1E4);f=a.Ea();a.track();if(f<a.Ea()&&a.useForcedLinkTracking&&c.target){for(e=c.target;e&&e!=a.b&&"A"!=e.tagName.toUpperCase()&&"AREA"!=e.tagName.toUpperCase();)e=e.parentNode;if(e&&(g=e.href,a.Ga(g)||(g=0),d=e.target,c.target.dispatchEvent&&g&&(!d||"_self"==d||"_top"==d||"_parent"==d||k.name&&d==k.name))){try{b=a.d.createEvent("MouseEvents")}catch(n){b=new k.MouseEvent}if(b){try{b.initMouseEvent("click",
c.bubbles,c.cancelable,c.view,c.detail,c.screenX,c.screenY,c.clientX,c.clientY,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.button,c.relatedTarget)}catch(q){b=0}b&&(b["s_fe_"+a._in]=b.s_fe=1,c.stopPropagation(),c.stopImmediatePropagation&&c.stopImmediatePropagation(),c.preventDefault(),a.l=c.target,a.J=b)}}}}}catch(r){a.clickObject=0}}},a.b&&a.b.attachEvent?a.b.attachEvent("onclick",a.v):a.b&&a.b.addEventListener&&(navigator&&(0<=navigator.userAgent.indexOf("WebKit")&&a.d.createEvent||0<=navigator.userAgent.indexOf("Firefox/2")&&
k.MouseEvent)&&(a.ya=1,a.useForcedLinkTracking=1,a.b.addEventListener("click",a.v,!0)),a.b.addEventListener("click",a.v,!1))):setTimeout(a.Ma,30)};a.Ma();a.loadModule("ActivityMap")}
function s_gi(a){var k,q=window.s_c_il,r,n,t=a.split(","),u,s,x=0;if(q)for(r=0;!x&&r<q.length;){k=q[r];if("s_c"==k._c&&(k.account||k.oun))if(k.account&&k.account==a)x=1;else for(n=k.account?k.account:k.oun,n=k.allAccounts?k.allAccounts:n.split(","),u=0;u<t.length;u++)for(s=0;s<n.length;s++)t[u]==n[s]&&(x=1);r++}x||(k=new AppMeasurement);k.setAccount?k.setAccount(a):k.sa&&k.sa(a);return k}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
function s_pgicq(){var a=window,k=a.s_giq,q,r,n;if(k)for(q=0;q<k.length;q++)r=k[q],n=s_gi(r.oun),n.setAccount(r.un),n.setTagContainer(r.tagContainerName);a.s_giq=0}s_pgicq();

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
 * Plugin: Days since last Visit 1.0.H 
 */
s.getDaysSinceLastVisit=new Function(""
+"var s=this,e=new Date(),cval,ct=e.getTime(),c='s_lastvisit',day=24*"
+"60*60*1000;e.setTime(ct+3*365*day);cval=s.c_r(c);if(!cval){s.c_w(c,"
+"ct,e);return 'First page view or cookies not supported';}else{var d"
+"=ct-cval;if(d>30*60*1000){if(d>30*day){s.c_w(c,ct,e);return 'More t"
+"han 30 days';}if(d<30*day+1 && d>7*day){s.c_w(c,ct,e);return 'More "
+"than 7 days';}if(d<7*day+1 && d>day){s.c_w(c,ct,e);return 'Less tha"
+"n 7 days';}if(d<day+1){s.c_w(c,ct,e);return 'Less than 1 day';}}els"
+"e return '';}");

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



