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
        searchParams: ['qt','q'],

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
        Adobe.set("eVar16","D=mid");  // save visitor ID 

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
            if (User.personID) {
                Adobe.set('prop8',User.personID);
            }
            Adobe.set('eVar10',"D=c8"); //dynamic prop8
            Adobe.set('eVar9','logged in');
        } else {
            Adobe.set('prop8','guest');
            Adobe.set('eVar10',"D=c8"); //dynamic prop8
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
                    User.clearReferrerId();
                }
                if (User.linkType) {
                    Adobe.set('eVar37',User.linkType);
                    User.clearLinkType();
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
        if (url) msg = ' : '+Util.filename(url);
        if (lineNumber > 0) msg = msg + ':' + lineNumber
        Analytics._postSave(function() {
            msg = 'jserror'+ msg;
            Analytics.error(msg,msg + ' : ' + document.location.href  + " : " + errorMsg + " on " + Util.getBrowser());
        });
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
            t = t.replace('search-result','');
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

/*
 ============== DO NOT ALTER ANYTHING ABOVE THIS LINE ! ===============
*/

if (!window.s) {

/* SiteCatalyst code version: H.27.5.
Copyright 1996-2015 Adobe, Inc. All Rights Reserved
More info available at http://www.omniture.com */

/************* DO NOT ALTER ANYTHING BELOW THIS LINE ! **************/
var s_code='',s_objectID;function s_gi(un,pg,ss){var c="s.version='H.27.5';s.an=s_an;s.logDebug=function(m){var s=this,tcf=new Function('var e;try{console.log(\"'+s.rep(s.rep(s.rep(m,\"\\\\\",\"\\\\"
+"\\\\\"),\"\\n\",\"\\\\n\"),\"\\\"\",\"\\\\\\\"\")+'\");}catch(e){}');tcf()};s.cls=function(x,c){var i,y='';if(!c)c=this.an;for(i=0;i<x.length;i++){n=x.substring(i,i+1);if(c.indexOf(n)>=0)y+=n}retur"
+"n y};s.fl=function(x,l){return x?(''+x).substring(0,l):x};s.co=function(o){return o};s.num=function(x){x=''+x;for(var p=0;p<x.length;p++)if(('0123456789').indexOf(x.substring(p,p+1))<0)return 0;ret"
+"urn 1};s.rep=s_rep;s.sp=s_sp;s.jn=s_jn;s.ape=function(x){var s=this,h='0123456789ABCDEF',f=\"+~!*()'\",i,c=s.charSet,n,l,e,y='';c=c?c.toUpperCase():'';if(x){x=''+x;if(s.em==3){x=encodeURIComponent("
+"x);for(i=0;i<f.length;i++) {n=f.substring(i,i+1);if(x.indexOf(n)>=0)x=s.rep(x,n,\"%\"+n.charCodeAt(0).toString(16).toUpperCase())}}else if(c=='AUTO'&&('').charCodeAt){for(i=0;i<x.length;i++){c=x.su"
+"bstring(i,i+1);n=x.charCodeAt(i);if(n>127){l=0;e='';while(n||l<4){e=h.substring(n%16,n%16+1)+e;n=(n-n%16)/16;l++}y+='%u'+e}else if(c=='+')y+='%2B';else y+=escape(c)}x=y}else x=s.rep(escape(''+x),'+"
+"','%2B');if(c&&c!='AUTO'&&s.em==1&&x.indexOf('%u')<0&&x.indexOf('%U')<0){i=x.indexOf('%');while(i>=0){i++;if(h.substring(8).indexOf(x.substring(i,i+1).toUpperCase())>=0)return x.substring(0,i)+'u00"
+"'+x.substring(i);i=x.indexOf('%',i)}}}return x};s.epa=function(x){var s=this,y,tcf;if(x){x=s.rep(''+x,'+',' ');if(s.em==3){tcf=new Function('x','var y,e;try{y=decodeURIComponent(x)}catch(e){y=unesc"
+"ape(x)}return y');return tcf(x)}else return unescape(x)}return y};s.pt=function(x,d,f,a){var s=this,t=x,z=0,y,r;while(t){y=t.indexOf(d);y=y<0?t.length:y;t=t.substring(0,y);r=s[f](t,a);if(r)return r"
+";z+=y+d.length;t=x.substring(z,x.length);t=z<x.length?t:''}return ''};s.isf=function(t,a){var c=a.indexOf(':');if(c>=0)a=a.substring(0,c);c=a.indexOf('=');if(c>=0)a=a.substring(0,c);if(t.substring("
+"0,2)=='s_')t=t.substring(2);return (t!=''&&t==a)};s.fsf=function(t,a){var s=this;if(s.pt(a,',','isf',t))s.fsg+=(s.fsg!=''?',':'')+t;return 0};s.fs=function(x,f){var s=this;s.fsg='';s.pt(x,',','fsf'"
+",f);return s.fsg};s.mpc=function(m,a){var s=this,c,l,n,v;v=s.d.visibilityState;if(!v)v=s.d.webkitVisibilityState;if(v&&v=='prerender'){if(!s.mpq){s.mpq=new Array;l=s.sp('webkitvisibilitychange,visi"
+"bilitychange',',');for(n=0;n<l.length;n++){s.d.addEventListener(l[n],new Function('var s=s_c_il['+s._in+'],c,v;v=s.d.visibilityState;if(!v)v=s.d.webkitVisibilityState;if(s.mpq&&v==\"visible\"){whil"
+"e(s.mpq.length>0){c=s.mpq.shift();s[c.m].apply(s,c.a)}s.mpq=0}'),false)}}c=new Object;c.m=m;c.a=a;s.mpq.push(c);return 1}return 0};s.si=function(){var s=this,i,k,v,c=s_gi+'var s=s_gi(\"'+s.oun+'\")"
+";s.sa(\"'+s.un+'\");';for(i=0;i<s.va_g.length;i++){k=s.va_g[i];v=s[k];if(v!=undefined){if(typeof(v)!='number')c+='s.'+k+'=\"'+s_fe(v)+'\";';else c+='s.'+k+'='+v+';'}}c+=\"s.lnk=s.eo=s.linkName=s.li"
+"nkType=s.wd.s_objectID=s.ppu=s.pe=s.pev1=s.pev2=s.pev3='';\";return c};s.c_d='';s.c_gdf=function(t,a){var s=this;if(!s.num(t))return 1;return 0};s.c_gd=function(){var s=this,d=s.wd.location.hostnam"
+"e,n=s.fpCookieDomainPeriods,p;if(!n)n=s.cookieDomainPeriods;if(d&&!s.c_d){n=n?parseInt(n):2;n=n>2?n:2;p=d.lastIndexOf('.');if(p>=0){while(p>=0&&n>1){p=d.lastIndexOf('.',p-1);n--}s.c_d=p>0&&s.pt(d,'"
+".','c_gdf',0)?d.substring(p):d}}return s.c_d};s.c_r=function(k){var s=this;k=s.ape(k);var c=' '+s.d.cookie,i=c.indexOf(' '+k+'='),e=i<0?i:c.indexOf(';',i),v=i<0?'':s.epa(c.substring(i+2+k.length,e<"
+"0?c.length:e));return v!='[[B]]'?v:''};s.c_w=function(k,v,e){var s=this,d=s.c_gd(),l=s.cookieLifetime,t;v=''+v;l=l?(''+l).toUpperCase():'';if(e&&l!='SESSION'&&l!='NONE'){t=(v!=''?parseInt(l?l:0):-6"
+"0);if(t){e=new Date;e.setTime(e.getTime()+(t*1000))}}if(k&&l!='NONE'){s.d.cookie=k+'='+s.ape(v!=''?v:'[[B]]')+'; path=/;'+(e&&l!='SESSION'?' expires='+e.toGMTString()+';':'')+(d?' domain='+d+';':''"
+");return s.c_r(k)==v}return 0};s.eh=function(o,e,r,f){var s=this,b='s_'+e+'_'+s._in,n=-1,l,i,x;if(!s.ehl)s.ehl=new Array;l=s.ehl;for(i=0;i<l.length&&n<0;i++){if(l[i].o==o&&l[i].e==e)n=i}if(n<0){n=i"
+";l[n]=new Object}x=l[n];x.o=o;x.e=e;f=r?x.b:f;if(r||f){x.b=r?0:o[e];x.o[e]=f}if(x.b){x.o[b]=x.b;return b}return 0};s.cet=function(f,a,t,o,b){var s=this,r,tcf;if(s.apv>=5&&(!s.isopera||s.apv>=7)){tc"
+"f=new Function('s','f','a','t','var e,r;try{r=s[f](a)}catch(e){r=s[t](e)}return r');r=tcf(s,f,a,t)}else{if(s.ismac&&s.u.indexOf('MSIE 4')>=0)r=s[b](a);else{s.eh(s.wd,'onerror',0,o);r=s[f](a);s.eh(s"
+".wd,'onerror',1)}}return r};s.gtfset=function(e){var s=this;return s.tfs};s.gtfsoe=new Function('e','var s=s_c_il['+s._in+'],c;s.eh(window,\"onerror\",1);s.etfs=1;c=s.t();if(c)s.d.write(c);s.etfs=0"
+";return true');s.gtfsfb=function(a){return window};s.gtfsf=function(w){var s=this,p=w.parent,l=w.location;s.tfs=w;if(p&&p.location!=l&&p.location.host==l.host){s.tfs=p;return s.gtfsf(s.tfs)}return "
+"s.tfs};s.gtfs=function(){var s=this;if(!s.tfs){s.tfs=s.wd;if(!s.etfs)s.tfs=s.cet('gtfsf',s.tfs,'gtfset',s.gtfsoe,'gtfsfb')}return s.tfs};s.mrq=function(u){var s=this,l=s.rl[u],n,r;s.rl[u]=0;if(l)fo"
+"r(n=0;n<l.length;n++){r=l[n];s.mr(0,0,r.r,r.t,r.u)}};s.flushBufferedRequests=function(){};s.tagContainerMarker='';s.mr=function(sess,q,rs,ta,u){var s=this,dc=s.dc,t1=s.trackingServer,t2=s.trackingS"
+"erverSecure,tb=s.trackingServerBase,p='.sc',ns=s.visitorNamespace,un=s.cls(u?u:(ns?ns:s.fun)),r=new Object,l,imn='s_i_'+s._in+'_'+un,im,b,e;if(!rs){if(t1){if(t2&&s.ssl)t1=t2}else{if(!tb)tb='2o7.net"
+"';if(dc)dc=(''+dc).toLowerCase();else dc='d1';if(tb=='2o7.net'){if(dc=='d1')dc='112';else if(dc=='d2')dc='122';p=''}t1=un+'.'+dc+'.'+p+tb}rs='http'+(s.ssl?'s':'')+'://'+t1+'/b/ss/'+s.un+'/'+(s.mobi"
+"le?'5.1':'1')+'/'+s.version+(s.tcn?'T':'')+(s.tagContainerMarker?\"-\"+s.tagContainerMarker:\"\")+'/'+sess+'?AQB=1&ndh=1'+(q?q:'')+'&AQE=1';if(s.isie&&!s.ismac)rs=s.fl(rs,2047)}if(s.d.images&&s.apv"
+">=3&&(!s.isopera||s.apv>=7)&&(s.ns6<0||s.apv>=6.1)){if(!s.rc)s.rc=new Object;if(!s.rc[un]){s.rc[un]=1;if(!s.rl)s.rl=new Object;s.rl[un]=new Array;setTimeout('if(window.s_c_il)window.s_c_il['+s._in+"
+"'].mrq(\"'+un+'\")',750)}else{l=s.rl[un];if(l){r.t=ta;r.u=un;r.r=rs;l[l.length]=r;return ''}imn+='_'+s.rc[un];s.rc[un]++}if(s.debugTracking){var d='AppMeasurement Debug: '+rs,dl=s.sp(rs,'&'),dln;fo"
+"r(dln=0;dln<dl.length;dln++)d+=\"\\n\\t\"+s.epa(dl[dln]);s.logDebug(d)}im=s.wd[imn];if(!im)im=s.wd[imn]=new Image;im.alt=\"\";im.s_l=0;im.onload=im.onerror=new Function('e','this.s_l=1;var wd=windo"
+"w,s;if(wd.s_c_il){s=wd.s_c_il['+s._in+'];s.bcr();s.mrq(\"'+un+'\");s.nrs--;if(!s.nrs)s.m_m(\"rr\")}');if(!s.nrs){s.nrs=1;s.m_m('rs')}else s.nrs++;im.src=rs;if(s.useForcedLinkTracking||s.bcf){if(!s."
+"forcedLinkTrackingTimeout)s.forcedLinkTrackingTimeout=250;setTimeout('if(window.s_c_il)window.s_c_il['+s._in+'].bcr()',s.forcedLinkTrackingTimeout);}else if((s.lnk||s.eo)&&(!ta||ta=='_self'||ta=='_"
+"top'||ta=='_parent'||(s.wd.name&&ta==s.wd.name))){b=e=new Date;while(!im.s_l&&e.getTime()-b.getTime()<500)e=new Date}return ''}return '<im'+'g sr'+'c=\"'+rs+'\" width=1 height=1 border=0 alt=\"\">'"
+"};s.gg=function(v){var s=this;if(!s.wd['s_'+v])s.wd['s_'+v]='';return s.wd['s_'+v]};s.glf=function(t,a){if(t.substring(0,2)=='s_')t=t.substring(2);var s=this,v=s.gg(t);if(v)s[t]=v};s.gl=function(v)"
+"{var s=this;if(s.pg)s.pt(v,',','glf',0)};s.rf=function(x){var s=this,y,i,j,h,p,l=0,q,a,b='',c='',t;if(x&&x.length>255){y=''+x;i=y.indexOf('?');if(i>0){q=y.substring(i+1);y=y.substring(0,i);h=y.toLo"
+"werCase();j=0;if(h.substring(0,7)=='http://')j+=7;else if(h.substring(0,8)=='https://')j+=8;i=h.indexOf(\"/\",j);if(i>0){h=h.substring(j,i);p=y.substring(i);y=y.substring(0,i);if(h.indexOf('google'"
+")>=0)l=',q,ie,start,search_key,word,kw,cd,';else if(h.indexOf('yahoo.co')>=0)l=',p,ei,';if(l&&q){a=s.sp(q,'&');if(a&&a.length>1){for(j=0;j<a.length;j++){t=a[j];i=t.indexOf('=');if(i>0&&l.indexOf(',"
+"'+t.substring(0,i)+',')>=0)b+=(b?'&':'')+t;else c+=(c?'&':'')+t}if(b&&c)q=b+'&'+c;else c=''}i=253-(q.length-c.length)-y.length;x=y+(i>0?p.substring(0,i):'')+'?'+q}}}}return x};s.s2q=function(k,v,vf"
+",vfp,f){var s=this,qs='',sk,sv,sp,ss,nke,nk,nf,nfl=0,nfn,nfm;if(k==\"contextData\")k=\"c\";if(v){for(sk in v)if((!f||sk.substring(0,f.length)==f)&&v[sk]&&(!vf||vf.indexOf(','+(vfp?vfp+'.':'')+sk+',"
+"')>=0)&&(!Object||!Object.prototype||!Object.prototype[sk])){nfm=0;if(nfl)for(nfn=0;nfn<nfl.length;nfn++)if(sk.substring(0,nfl[nfn].length)==nfl[nfn])nfm=1;if(!nfm){if(qs=='')qs+='&'+k+'.';sv=v[sk]"
+";if(f)sk=sk.substring(f.length);if(sk.length>0){nke=sk.indexOf('.');if(nke>0){nk=sk.substring(0,nke);nf=(f?f:'')+nk+'.';if(!nfl)nfl=new Array;nfl[nfl.length]=nf;qs+=s.s2q(nk,v,vf,vfp,nf)}else{if(ty"
+"peof(sv)=='boolean'){if(sv)sv='true';else sv='false'}if(sv){if(vfp=='retrieveLightData'&&f.indexOf('.contextData.')<0){sp=sk.substring(0,4);ss=sk.substring(4);if(sk=='transactionID')sk='xact';else "
+"if(sk=='channel')sk='ch';else if(sk=='campaign')sk='v0';else if(s.num(ss)){if(sp=='prop')sk='c'+ss;else if(sp=='eVar')sk='v'+ss;else if(sp=='list')sk='l'+ss;else if(sp=='hier'){sk='h'+ss;sv=sv.subs"
+"tring(0,255)}}}qs+='&'+s.ape(sk)+'='+s.ape(sv)}}}}}if(qs!='')qs+='&.'+k}return qs};s.hav=function(){var s=this,qs='',l,fv='',fe='',mn,i,e;if(s.lightProfileID){l=s.va_m;fv=s.lightTrackVars;if(fv)fv="
+"','+fv+','+s.vl_mr+','}else{l=s.va_t;if(s.pe||s.linkType){fv=s.linkTrackVars;fe=s.linkTrackEvents;if(s.pe){mn=s.pe.substring(0,1).toUpperCase()+s.pe.substring(1);if(s[mn]){fv=s[mn].trackVars;fe=s[m"
+"n].trackEvents}}}if(fv)fv=','+fv+','+s.vl_l+','+s.vl_l2;if(fe){fe=','+fe+',';if(fv)fv+=',events,'}if (s.events2)e=(e?',':'')+s.events2}for(i=0;i<l.length;i++){var k=l[i],v=s[k],b=k.substring(0,4),x"
+"=k.substring(4),n=parseInt(x),q=k;if(!v)if(k=='events'&&e){v=e;e=''}if(v&&(!fv||fv.indexOf(','+k+',')>=0)&&k!='linkName'&&k!='linkType'){if(k=='supplementalDataID')q='sdid';else if(k=='timestamp')q"
+"='ts';else if(k=='dynamicVariablePrefix')q='D';else if(k=='visitorID')q='vid';else if(k=='marketingCloudVisitorID')q='mid';else if(k=='analyticsVisitorID')q='aid';else if(k=='audienceManagerLocatio"
+"nHint')q='aamlh';else if(k=='audienceManagerBlob')q='aamb';else if(k=='authState')q='as';else if(k=='pageURL'){q='g';if(v.length>255){s.pageURLRest=v.substring(255);v=v.substring(0,255);}}else if(k"
+"=='pageURLRest')q='-g';else if(k=='referrer'){q='r';v=s.fl(s.rf(v),255)}else if(k=='vmk'||k=='visitorMigrationKey')q='vmt';else if(k=='visitorMigrationServer'){q='vmf';if(s.ssl&&s.visitorMigrationS"
+"erverSecure)v=''}else if(k=='visitorMigrationServerSecure'){q='vmf';if(!s.ssl&&s.visitorMigrationServer)v=''}else if(k=='charSet'){q='ce';if(v.toUpperCase()=='AUTO')v='ISO8859-1';else if(s.em==2||s"
+".em==3)v='UTF-8'}else if(k=='visitorNamespace')q='ns';else if(k=='cookieDomainPeriods')q='cdp';else if(k=='cookieLifetime')q='cl';else if(k=='variableProvider')q='vvp';else if(k=='currencyCode')q='"
+"cc';else if(k=='channel')q='ch';else if(k=='transactionID')q='xact';else if(k=='campaign')q='v0';else if(k=='resolution')q='s';else if(k=='colorDepth')q='c';else if(k=='javascriptVersion')q='j';els"
+"e if(k=='javaEnabled')q='v';else if(k=='cookiesEnabled')q='k';else if(k=='browserWidth')q='bw';else if(k=='browserHeight')q='bh';else if(k=='connectionType')q='ct';else if(k=='homepage')q='hp';else"
+" if(k=='plugins')q='p';else if(k=='events'){if(e)v+=(v?',':'')+e;if(fe)v=s.fs(v,fe)}else if(k=='events2')v='';else if(k=='contextData'){qs+=s.s2q('c',s[k],fv,k,0);v=''}else if(k=='lightProfileID')q"
+"='mtp';else if(k=='lightStoreForSeconds'){q='mtss';if(!s.lightProfileID)v=''}else if(k=='lightIncrementBy'){q='mti';if(!s.lightProfileID)v=''}else if(k=='retrieveLightProfiles')q='mtsr';else if(k=="
+"'deleteLightProfiles')q='mtsd';else if(k=='retrieveLightData'){if(s.retrieveLightProfiles)qs+=s.s2q('mts',s[k],fv,k,0);v=''}else if(s.num(x)){if(b=='prop')q='c'+n;else if(b=='eVar')q='v'+n;else if("
+"b=='list')q='l'+n;else if(b=='hier'){q='h'+n;v=s.fl(v,255)}}if(v)qs+='&'+s.ape(q)+'='+(k.substring(0,3)!='pev'?s.ape(v):v)}}return qs};s.ltdf=function(t,h){t=t?t.toLowerCase():'';h=h?h.toLowerCase("
+"):'';var qi=h.indexOf('?'),hi=h.indexOf('#');if(qi>=0){if(hi>=0&&hi<qi)qi=hi;}else qi=hi;h=qi>=0?h.substring(0,qi):h;if(t&&h.substring(h.length-(t.length+1))=='.'+t)return 1;return 0};s.ltef=functi"
+"on(t,h){t=t?t.toLowerCase():'';h=h?h.toLowerCase():'';if(t&&h.indexOf(t)>=0)return 1;return 0};s.lt=function(h){var s=this,lft=s.linkDownloadFileTypes,lef=s.linkExternalFilters,lif=s.linkInternalFi"
+"lters;lif=lif?lif:s.wd.location.hostname;h=h.toLowerCase();if(s.trackDownloadLinks&&lft&&s.pt(lft,',','ltdf',h))return 'd';if(s.trackExternalLinks&&h.indexOf('#')!=0&&h.indexOf('about:')!=0&&h.inde"
+"xOf('javascript:')!=0&&(lef||lif)&&(!lef||s.pt(lef,',','ltef',h))&&(!lif||!s.pt(lif,',','ltef',h)))return 'e';return ''};s.lc=new Function('e','var s=s_c_il['+s._in+'],b=s.eh(this,\"onclick\");s.ln"
+"k=this;s.t();s.lnk=0;if(b)return this[b](e);return true');s.bcr=function(){var s=this;if(s.bct&&s.bce)s.bct.dispatchEvent(s.bce);if(s.bcf){if(typeof(s.bcf)=='function')s.bcf();else if(s.bct&&s.bct."
+"href)s.d.location=s.bct.href}s.bct=s.bce=s.bcf=0};s.bc=new Function('e','if(e&&e.s_fe)return;var s=s_c_il['+s._in+'],f,tcf,t,n,nrs,a,h;if(s.d&&s.d.all&&s.d.all.cppXYctnr)return;if(!s.bbc)s.useForce"
+"dLinkTracking=0;else if(!s.useForcedLinkTracking){s.b.removeEventListener(\"click\",s.bc,true);s.bbc=s.useForcedLinkTracking=0;return}else s.b.removeEventListener(\"click\",s.bc,false);s.eo=e.srcEl"
+"ement?e.srcElement:e.target;nrs=s.nrs;s.t();s.eo=0;if(s.nrs>nrs&&s.useForcedLinkTracking&&e.target){a=e.target;while(a&&a!=s.b&&a.tagName.toUpperCase()!=\"A\"&&a.tagName.toUpperCase()!=\"AREA\")a=a"
+".parentNode;if(a){h=a.href;if(h.indexOf(\"#\")==0||h.indexOf(\"about:\")==0||h.indexOf(\"javascript:\")==0)h=0;t=a.target;if(e.target.dispatchEvent&&h&&(!t||t==\"_self\"||t==\"_top\"||t==\"_parent"
+"\"||(s.wd.name&&t==s.wd.name))){tcf=new Function(\"s\",\"var x;try{n=s.d.createEvent(\\\\\"MouseEvents\\\\\")}catch(x){n=new MouseEvent}return n\");n=tcf(s);if(n){tcf=new Function(\"n\",\"e\",\"var"
+" x;try{n.initMouseEvent(\\\\\"click\\\\\",e.bubbles,e.cancelable,e.view,e.detail,e.screenX,e.screenY,e.clientX,e.clientY,e.ctrlKey,e.altKey,e.shiftKey,e.metaKey,e.button,e.relatedTarget)}catch(x){n"
+"=0}return n\");n=tcf(n,e);if(n){n.s_fe=1;e.stopPropagation();if (e.stopImmediatePropagation) {e.stopImmediatePropagation();}e.preventDefault();s.bct=e.target;s.bce=n}}}}}');s.oh=function(o){var s=t"
+"his,l=s.wd.location,h=o.href?o.href:'',i,j,k,p;i=h.indexOf(':');j=h.indexOf('?');k=h.indexOf('/');if(h&&(i<0||(j>=0&&i>j)||(k>=0&&i>k))){p=o.protocol&&o.protocol.length>1?o.protocol:(l.protocol?l.p"
+"rotocol:'');i=l.pathname.lastIndexOf('/');h=(p?p+'//':'')+(o.host?o.host:(l.host?l.host:''))+(h.substring(0,1)!='/'?l.pathname.substring(0,i<0?0:i)+'/':'')+h}return h};s.ot=function(o){var t=o.tagN"
+"ame;if(o.tagUrn||(o.scopeName&&o.scopeName.toUpperCase()!='HTML'))return '';t=t&&t.toUpperCase?t.toUpperCase():'';if(t=='SHAPE')t='';if(t){if((t=='INPUT'||t=='BUTTON')&&o.type&&o.type.toUpperCase)t"
+"=o.type.toUpperCase();else if(!t&&o.href)t='A';}return t};s.oid=function(o){var s=this,t=s.ot(o),p,c,n='',x=0;if(t&&!o.s_oid){p=o.protocol;c=o.onclick;if(o.href&&(t=='A'||t=='AREA')&&(!c||!p||p.toL"
+"owerCase().indexOf('javascript')<0))n=s.oh(o);else if(c){n=s.rep(s.rep(s.rep(s.rep(''+c,\"\\r\",''),\"\\n\",''),\"\\t\",''),' ','');x=2}else if(t=='INPUT'||t=='SUBMIT'){if(o.value)n=o.value;else if"
+"(o.innerText)n=o.innerText;else if(o.textContent)n=o.textContent;x=3}else if(o.src&&t=='IMAGE')n=o.src;if(n){o.s_oid=s.fl(n,100);o.s_oidt=x}}return o.s_oid};s.rqf=function(t,un){var s=this,e=t.inde"
+"xOf('='),u=e>=0?t.substring(0,e):'',q=e>=0?s.epa(t.substring(e+1)):'';if(u&&q&&(','+u+',').indexOf(','+un+',')>=0){if(u!=s.un&&s.un.indexOf(',')>=0)q='&u='+u+q+'&u=0';return q}return ''};s.rq=funct"
+"ion(un){if(!un)un=this.un;var s=this,c=un.indexOf(','),v=s.c_r('s_sq'),q='';if(c<0)return s.pt(v,'&','rqf',un);return s.pt(un,',','rq',0)};s.sqp=function(t,a){var s=this,e=t.indexOf('='),q=e<0?'':s"
+".epa(t.substring(e+1));s.sqq[q]='';if(e>=0)s.pt(t.substring(0,e),',','sqs',q);return 0};s.sqs=function(un,q){var s=this;s.squ[un]=q;return 0};s.sq=function(q){var s=this,k='s_sq',v=s.c_r(k),x,c=0;s"
+".sqq=new Object;s.squ=new Object;s.sqq[q]='';s.pt(v,'&','sqp',0);s.pt(s.un,',','sqs',q);v='';for(x in s.squ)if(x&&(!Object||!Object.prototype||!Object.prototype[x]))s.sqq[s.squ[x]]+=(s.sqq[s.squ[x]"
+"]?',':'')+x;for(x in s.sqq)if(x&&(!Object||!Object.prototype||!Object.prototype[x])&&s.sqq[x]&&(x==q||c<2)){v+=(v?'&':'')+s.sqq[x]+'='+s.ape(x);c++}return s.c_w(k,v,0)};s.wdl=new Function('e','var "
+"s=s_c_il['+s._in+'],r=true,b=s.eh(s.wd,\"onload\"),i,o,oc;if(b)r=this[b](e);for(i=0;i<s.d.links.length;i++){o=s.d.links[i];oc=o.onclick?\"\"+o.onclick:\"\";if((oc.indexOf(\"s_gs(\")<0||oc.indexOf("
+"\".s_oc(\")>=0)&&oc.indexOf(\".tl(\")<0)s.eh(o,\"onclick\",0,s.lc);}return r');s.wds=function(){var s=this;if(s.apv>3&&(!s.isie||!s.ismac||s.apv>=5)){if(s.b&&s.b.attachEvent)s.b.attachEvent('onclic"
+"k',s.bc);else if(s.b&&s.b.addEventListener){if(s.n&&((s.n.userAgent.indexOf('WebKit')>=0&&s.d.createEvent)||(s.n.userAgent.indexOf('Firefox/2')>=0&&s.wd.MouseEvent))){s.bbc=1;s.useForcedLinkTrackin"
+"g=1;s.b.addEventListener('click',s.bc,true)}s.b.addEventListener('click',s.bc,false)}else s.eh(s.wd,'onload',0,s.wdl)}};s.vs=function(x){var s=this,v=s.visitorSampling,g=s.visitorSamplingGroup,k='s"
+"_vsn_'+s.un+(g?'_'+g:''),n=s.c_r(k),e=new Date,y=e.getYear();e.setYear(y+10+(y<1900?1900:0));if(v){v*=100;if(!n){if(!s.c_w(k,x,e))return 0;n=x}if(n%10000>v)return 0}return 1};s.dyasmf=function(t,m)"
+"{if(t&&m&&m.indexOf(t)>=0)return 1;return 0};s.dyasf=function(t,m){var s=this,i=t?t.indexOf('='):-1,n,x;if(i>=0&&m){var n=t.substring(0,i),x=t.substring(i+1);if(s.pt(x,',','dyasmf',m))return n}retu"
+"rn 0};s.uns=function(){var s=this,x=s.dynamicAccountSelection,l=s.dynamicAccountList,m=s.dynamicAccountMatch,n,i;s.un=s.un.toLowerCase();if(x&&l){if(!m)m=s.wd.location.host;if(!m.toLowerCase)m=''+m"
+";l=l.toLowerCase();m=m.toLowerCase();n=s.pt(l,';','dyasf',m);if(n)s.un=n}i=s.un.indexOf(',');s.fun=i<0?s.un:s.un.substring(0,i)};s.sa=function(un){var s=this;if(s.un&&s.mpc('sa',arguments))return;s"
+".un=un;if(!s.oun)s.oun=un;else if((','+s.oun+',').indexOf(','+un+',')<0)s.oun+=','+un;s.uns()};s.m_i=function(n,a){var s=this,m,f=n.substring(0,1),r,l,i;if(!s.m_l)s.m_l=new Object;if(!s.m_nl)s.m_nl"
+"=new Array;m=s.m_l[n];if(!a&&m&&m._e&&!m._i)s.m_a(n);if(!m){m=new Object,m._c='s_m';m._in=s.wd.s_c_in;m._il=s._il;m._il[m._in]=m;s.wd.s_c_in++;m.s=s;m._n=n;m._l=new Array('_c','_in','_il','_i','_e'"
+",'_d','_dl','s','n','_r','_g','_g1','_t','_t1','_x','_x1','_rs','_rr','_l');s.m_l[n]=m;s.m_nl[s.m_nl.length]=n}else if(m._r&&!m._m){r=m._r;r._m=m;l=m._l;for(i=0;i<l.length;i++)if(m[l[i]])r[l[i]]=m["
+"l[i]];r._il[r._in]=r;m=s.m_l[n]=r}if(f==f.toUpperCase())s[n]=m;return m};s.m_a=new Function('n','g','e','if(!g)g=\"m_\"+n;var s=s_c_il['+s._in+'],c=s[g+\"_c\"],m,x,f=0;if(s.mpc(\"m_a\",arguments))r"
+"eturn;if(!c)c=s.wd[\"s_\"+g+\"_c\"];if(c&&s_d)s[g]=new Function(\"s\",s_ft(s_d(c)));x=s[g];if(!x)x=s.wd[\\'s_\\'+g];if(!x)x=s.wd[g];m=s.m_i(n,1);if(x&&(!m._i||g!=\"m_\"+n)){m._i=f=1;if((\"\"+x).ind"
+"exOf(\"function\")>=0)x(s);else s.m_m(\"x\",n,x,e)}m=s.m_i(n,1);if(m._dl)m._dl=m._d=0;s.dlt();return f');s.m_m=function(t,n,d,e){t='_'+t;var s=this,i,x,m,f='_'+t,r=0,u;if(s.m_l&&s.m_nl)for(i=0;i<s."
+"m_nl.length;i++){x=s.m_nl[i];if(!n||x==n){m=s.m_i(x);u=m[t];if(u){if((''+u).indexOf('function')>=0){if(d&&e)u=m[t](d,e);else if(d)u=m[t](d);else u=m[t]()}}if(u)r=1;u=m[t+1];if(u&&!m[f]){if((''+u).i"
+"ndexOf('function')>=0){if(d&&e)u=m[t+1](d,e);else if(d)u=m[t+1](d);else u=m[t+1]()}}m[f]=1;if(u)r=1}}return r};s.m_ll=function(){var s=this,g=s.m_dl,i,o;if(g)for(i=0;i<g.length;i++){o=g[i];if(o)s.l"
+"oadModule(o.n,o.u,o.d,o.l,o.e,1);g[i]=0}};s.loadModule=function(n,u,d,l,e,ln){var s=this,m=0,i,g,o=0,f1,f2,c=s.h?s.h:s.b,b,tcf;if(n){i=n.indexOf(':');if(i>=0){g=n.substring(i+1);n=n.substring(0,i)}"
+"else g=\"m_\"+n;m=s.m_i(n)}if((l||(n&&!s.m_a(n,g)))&&u&&s.d&&c&&s.d.createElement){if(d){m._d=1;m._dl=1}if(ln){if(s.ssl)u=s.rep(u,'http:','https:');i='s_s:'+s._in+':'+n+':'+g;b='var s=s_c_il['+s._i"
+"n+'],o=s.d.getElementById(\"'+i+'\");if(s&&o){if(!o.l&&s.wd.'+g+'){o.l=1;if(o.i)clearTimeout(o.i);o.i=0;s.m_a(\"'+n+'\",\"'+g+'\"'+(e?',\"'+e+'\"':'')+')}';f2=b+'o.c++;if(!s.maxDelay)s.maxDelay=250"
+";if(!o.l&&o.c<(s.maxDelay*2)/100)o.i=setTimeout(o.f2,100)}';f1=new Function('e',b+'}');tcf=new Function('s','c','i','u','f1','f2','var e,o=0;try{o=s.d.createElement(\"script\");if(o){o.type=\"text/"
+"javascript\";'+(n?'o.id=i;o.defer=true;o.onload=o.onreadystatechange=f1;o.f2=f2;o.l=0;':'')+'o.src=u;c.appendChild(o);'+(n?'o.c=0;o.i=setTimeout(f2,100)':'')+'}}catch(e){o=0}return o');o=tcf(s,c,i,"
+"u,f1,f2)}else{o=new Object;o.n=n+':'+g;o.u=u;o.d=d;o.l=l;o.e=e;g=s.m_dl;if(!g)g=s.m_dl=new Array;i=0;while(i<g.length&&g[i])i++;g[i]=o}}else if(n){m=s.m_i(n);m._e=1}return m};s.voa=function(vo,r){v"
+"ar s=this,l=s.va_g,i,k,v,x;for(i=0;i<l.length;i++){k=l[i];v=vo[k];if(v||vo['!'+k]){if(!r&&(k==\"contextData\"||k==\"retrieveLightData\")&&s[k])for(x in s[k])if(!v[x])v[x]=s[k][x];s[k]=v}}};s.vob=fu"
+"nction(vo,onlySet){var s=this,l=s.va_g,i,k;for(i=0;i<l.length;i++){k=l[i];vo[k]=s[k];if(!onlySet&&!vo[k])vo['!'+k]=1}};s.dlt=new Function('var s=s_c_il['+s._in+'],d=new Date,i,vo,f=0;if(s.dll)for(i"
+"=0;i<s.dll.length;i++){vo=s.dll[i];if(vo){if(!s.m_m(\"d\")||d.getTime()-vo._t>=s.maxDelay){s.dll[i]=0;s.t(vo)}else f=1}}if(s.dli)clearTimeout(s.dli);s.dli=0;if(f){if(!s.dli)s.dli=setTimeout(s.dlt,s"
+".maxDelay)}else s.dll=0');s.dl=function(vo){var s=this,d=new Date;if(!vo)vo=new Object;s.vob(vo);vo._t=d.getTime();if(!s.dll)s.dll=new Array;s.dll[s.dll.length]=vo;if(!s.maxDelay)s.maxDelay=250;s.d"
+"lt()};s._waitingForMarketingCloudVisitorID = false;s._doneWaitingForMarketingCloudVisitorID = false;s._marketingCloudVisitorIDCallback=function(marketingCloudVisitorID) {var s=this;s.marketingCloud"
+"VisitorID = marketingCloudVisitorID;s._doneWaitingForMarketingCloudVisitorID = true;s._callbackWhenReadyToTrackCheck();};s._waitingForAnalyticsVisitorID = false;s._doneWaitingForAnalyticsVisitorID "
+"= false;s._analyticsVisitorIDCallback=function(analyticsVisitorID) {var s=this;s.analyticsVisitorID = analyticsVisitorID;s._doneWaitingForAnalyticsVisitorID = true;s._callbackWhenReadyToTrackCheck("
+");};s._waitingForAudienceManagerLocationHint = false;s._doneWaitingForAudienceManagerLocationHint = false;s._audienceManagerLocationHintCallback=function(audienceManagerLocationHint) {var s=this;s."
+"audienceManagerLocationHint = audienceManagerLocationHint;s._doneWaitingForAudienceManagerLocationHint = true;s._callbackWhenReadyToTrackCheck();};s._waitingForAudienceManagerBlob = false;s._doneWa"
+"itingForAudienceManagerBlob = false;s._audienceManagerBlobCallback=function(audienceManagerBlob) {var s=this;s.audienceManagerBlob = audienceManagerBlob;s._doneWaitingForAudienceManagerBlob = true;"
+"s._callbackWhenReadyToTrackCheck();};s.isReadyToTrack=function() {var s=this,readyToTrack = true,visitor = s.visitor;if ((visitor) && (visitor.isAllowed())) {if ((!s._waitingForMarketingCloudVisito"
+"rID) && (!s.marketingCloudVisitorID) && (visitor.getMarketingCloudVisitorID)) {s._waitingForMarketingCloudVisitorID = true;s.marketingCloudVisitorID = visitor.getMarketingCloudVisitorID([s,s._marke"
+"tingCloudVisitorIDCallback]);if (s.marketingCloudVisitorID) {s._doneWaitingForMarketingCloudVisitorID = true;}}if ((!s._waitingForAnalyticsVisitorID) && (!s.analyticsVisitorID) && (visitor.getAnaly"
+"ticsVisitorID)) {s._waitingForAnalyticsVisitorID = true;s.analyticsVisitorID = visitor.getAnalyticsVisitorID([s,s._analyticsVisitorIDCallback]);if (s.analyticsVisitorID) {s._doneWaitingForAnalytics"
+"VisitorID = true;}}if ((!s._waitingForAudienceManagerLocationHint) && (!s.audienceManagerLocationHint) && (visitor.getAudienceManagerLocationHint)) {s._waitingForAudienceManagerLocationHint = true;"
+"s.audienceManagerLocationHint = visitor.getAudienceManagerLocationHint([s,s._audienceManagerLocationHintCallback]);if (s.audienceManagerLocationHint) {s._doneWaitingForAudienceManagerLocationHint ="
+" true;}}if ((!s._waitingForAudienceManagerBlob) && (!s.audienceManagerBlob) && (visitor.getAudienceManagerBlob)) {s._waitingForAudienceManagerBlob = true;s.audienceManagerBlob = visitor.getAudience"
+"ManagerBlob([s,s._audienceManagerBlobCallback]);if (s.audienceManagerBlob) {s._doneWaitingForAudienceManagerBlob = true;}}if (((s._waitingForMarketingCloudVisitorID)     && (!s._doneWaitingForMarke"
+"tingCloudVisitorID)     && (!s.marketingCloudVisitorID)) ||((s._waitingForAnalyticsVisitorID)          && (!s._doneWaitingForAnalyticsVisitorID)          && (!s.analyticsVisitorID)) ||((s._waitingF"
+"orAudienceManagerLocationHint) && (!s._doneWaitingForAudienceManagerLocationHint) && (!s.audienceManagerLocationHint)) ||((s._waitingForAudienceManagerBlob)         && (!s._doneWaitingForAudienceMa"
+"nagerBlob)         && (!s.audienceManagerBlob))) {readyToTrack = false;}}return readyToTrack;};s._callbackWhenReadyToTrackQueue = null;s._callbackWhenReadyToTrackInterval = 0;s.callbackWhenReadyToT"
+"rack=function(callbackThis,callback,args) {var s=this,callbackInfo;callbackInfo = {};callbackInfo.callbackThis = callbackThis;callbackInfo.callback     = callback;callbackInfo.args         = args;i"
+"f (s._callbackWhenReadyToTrackQueue == null) {s._callbackWhenReadyToTrackQueue = [];}s._callbackWhenReadyToTrackQueue.push(callbackInfo);if (s._callbackWhenReadyToTrackInterval == 0) {s._callbackWh"
+"enReadyToTrackInterval = setInterval(s._callbackWhenReadyToTrackCheck,100);}};s._callbackWhenReadyToTrackCheck=new Function('var s=s_c_il['+s._in+'],callbackNum,callbackInfo;if (s.isReadyToTrack())"
+" {if (s._callbackWhenReadyToTrackInterval) {clearInterval(s._callbackWhenReadyToTrackInterval);s._callbackWhenReadyToTrackInterval = 0;}if (s._callbackWhenReadyToTrackQueue != null) {while (s._call"
+"backWhenReadyToTrackQueue.length > 0) {callbackInfo = s._callbackWhenReadyToTrackQueue.shift();callbackInfo.callback.apply(callbackInfo.callbackThis,callbackInfo.args);}}}');s._handleNotReadyToTrac"
+"k=function(variableOverrides) {var s=this,args,varKey,variableOverridesCopy = null,setVariables = null;if (!s.isReadyToTrack()) {args = [];if (variableOverrides != null) {variableOverridesCopy = {}"
+";for (varKey in variableOverrides) {variableOverridesCopy[varKey] = variableOverrides[varKey];}}setVariables = {};s.vob(setVariables,true);args.push(variableOverridesCopy);args.push(setVariables);s"
+".callbackWhenReadyToTrack(s,s.track,args);return true;}return false;};s.gfid=function(){var s=this,d='0123456789ABCDEF',k='s_fid',fid=s.c_r(k),h='',l='',i,j,m=8,n=4,e=new Date,y;if(!fid||fid.indexO"
+"f('-')<0){for(i=0;i<16;i++){j=Math.floor(Math.random()*m);h+=d.substring(j,j+1);j=Math.floor(Math.random()*n);l+=d.substring(j,j+1);m=n=16}fid=h+'-'+l;}y=e.getYear();e.setYear(y+2+(y<1900?1900:0));"
+"if(!s.c_w(k,fid,e))fid=0;return fid};s.track=s.t=function(vo,setVariables){var s=this,notReadyToTrack,trk=1,tm=new Date,sed=Math&&Math.random?Math.floor(Math.random()*10000000000000):tm.getTime(),s"
+"ess='s'+Math.floor(tm.getTime()/10800000)%10+sed,y=tm.getYear(),vt=tm.getDate()+'/'+tm.getMonth()+'/'+(y<1900?y+1900:y)+' '+tm.getHours()+':'+tm.getMinutes()+':'+tm.getSeconds()+' '+tm.getDay()+' '"
+"+tm.getTimezoneOffset(),tcf,tfs=s.gtfs(),ta=-1,q='',qs='',code='',vb=new Object;if (s.visitor) {if (s.visitor.getAuthState) {s.authState = s.visitor.getAuthState();}if ((!s.supplementalDataID) && ("
+"s.visitor.getSupplementalDataID)) {s.supplementalDataID = s.visitor.getSupplementalDataID(\"AppMeasurement:\" + s._in,(s.expectSupplementalData ? false : true));}}if(s.mpc('t',arguments))return;s.g"
+"l(s.vl_g);s.uns();s.m_ll();notReadyToTrack = s._handleNotReadyToTrack(vo);if (!notReadyToTrack) {if (setVariables) {s.voa(setVariables);}if(!s.td){var tl=tfs.location,a,o,i,x='',c='',v='',p='',bw='"
+"',bh='',j='1.0',k=s.c_w('s_cc','true',0)?'Y':'N',hp='',ct='',pn=0,ps;if(String&&String.prototype){j='1.1';if(j.match){j='1.2';if(tm.setUTCDate){j='1.3';if(s.isie&&s.ismac&&s.apv>=5)j='1.4';if(pn.to"
+"Precision){j='1.5';a=new Array;if(a.forEach){j='1.6';i=0;o=new Object;tcf=new Function('o','var e,i=0;try{i=new Iterator(o)}catch(e){}return i');i=tcf(o);if(i&&i.next){j='1.7';if(a.reduce){j='1.8';"
+"if(j.trim){j='1.8.1';if(Date.parse){j='1.8.2';if(Object.create)j='1.8.5'}}}}}}}}}if(s.apv>=4)x=screen.width+'x'+screen.height;if(s.isns||s.isopera){if(s.apv>=3){v=s.n.javaEnabled()?'Y':'N';if(s.apv"
+">=4){c=screen.pixelDepth;bw=s.wd.innerWidth;bh=s.wd.innerHeight}}s.pl=s.n.plugins}else if(s.isie){if(s.apv>=4){v=s.n.javaEnabled()?'Y':'N';c=screen.colorDepth;if(s.apv>=5){bw=s.d.documentElement.of"
+"fsetWidth;bh=s.d.documentElement.offsetHeight;if(!s.ismac&&s.b){tcf=new Function('s','tl','var e,hp=0;try{s.b.addBehavior(\"#default#homePage\");hp=s.b.isHomePage(tl)?\"Y\":\"N\"}catch(e){}return h"
+"p');hp=tcf(s,tl);tcf=new Function('s','var e,ct=0;try{s.b.addBehavior(\"#default#clientCaps\");ct=s.b.connectionType}catch(e){}return ct');ct=tcf(s)}}}else r=''}if(s.pl)while(pn<s.pl.length&&pn<30)"
+"{ps=s.fl(s.pl[pn].name,100)+';';if(p.indexOf(ps)<0)p+=ps;pn++}s.resolution=x;s.colorDepth=c;s.javascriptVersion=j;s.javaEnabled=v;s.cookiesEnabled=k;s.browserWidth=bw;s.browserHeight=bh;s.connectio"
+"nType=ct;s.homepage=hp;s.plugins=p;s.td=1}if(vo){s.vob(vb);s.voa(vo)}if(!s.analyticsVisitorID&&!s.marketingCloudVisitorID)s.fid=s.gfid();if((vo&&vo._t)||!s.m_m('d')){if(s.usePlugins)s.doPlugins(s);"
+"if(!s.abort){var l=s.wd.location,r=tfs.document.referrer;if(!s.pageURL)s.pageURL=l.href?l.href:l;if(!s.referrer&&!s._1_referrer)s.referrer=r;s._1_referrer=1;s.m_m('g');if(s.lnk||s.eo){var o=s.eo?s."
+"eo:s.lnk,p=s.pageName,w=1,t=s.ot(o),n=s.oid(o),x=o.s_oidt,h,l,i,oc;if(s.eo&&o==s.eo){while(o&&!n&&t!='BODY'){o=o.parentElement?o.parentElement:o.parentNode;if(o){t=s.ot(o);n=s.oid(o);x=o.s_oidt}}if"
+"(!n||t=='BODY')o='';if(o){oc=o.onclick?''+o.onclick:'';if((oc.indexOf('s_gs(')>=0&&oc.indexOf('.s_oc(')<0)||oc.indexOf('.tl(')>=0)o=0}}if(o){if(n)ta=o.target;h=s.oh(o);i=h.indexOf('?');h=s.linkLeav"
+"eQueryString||i<0?h:h.substring(0,i);l=s.linkName;t=s.linkType?s.linkType.toLowerCase():s.lt(h);if(t&&(h||l)){s.pe='lnk_'+(t=='d'||t=='e'?t:'o');s.pev1=(h?s.ape(h):'');s.pev2=(l?s.ape(l):'')}else t"
+"rk=0;if(s.trackInlineStats){if(!p){p=s.pageURL;w=0}t=s.ot(o);i=o.sourceIndex;if(o.dataset&&o.dataset.sObjectId){s.wd.s_objectID=o.dataset.sObjectId;}else if(o.getAttribute&&o.getAttribute('data-s-o"
+"bject-id')){s.wd.s_objectID=o.getAttribute('data-s-object-id');}else if(s.useForcedLinkTracking){s.wd.s_objectID='';oc=o.onclick?''+o.onclick:'';if(oc){var ocb=oc.indexOf('s_objectID'),oce,ocq,ocx;"
+"if(ocb>=0){ocb+=10;while(ocb<oc.length&&(\"= \\t\\r\\n\").indexOf(oc.charAt(ocb))>=0)ocb++;if(ocb<oc.length){oce=ocb;ocq=ocx=0;while(oce<oc.length&&(oc.charAt(oce)!=';'||ocq)){if(ocq){if(oc.charAt("
+"oce)==ocq&&!ocx)ocq=0;else if(oc.charAt(oce)==\"\\\\\")ocx=!ocx;else ocx=0;}else{ocq=oc.charAt(oce);if(ocq!='\"'&&ocq!=\"'\")ocq=0}oce++;}oc=oc.substring(ocb,oce);if(oc){o.s_soid=new Function('s','"
+"var e;try{s.wd.s_objectID='+oc+'}catch(e){}');o.s_soid(s)}}}}}if(s.gg('objectID')){n=s.gg('objectID');x=1;i=1}if(p&&n&&t)qs='&pid='+s.ape(s.fl(p,255))+(w?'&pidt='+w:'')+'&oid='+s.ape(s.fl(n,100))+("
+"x?'&oidt='+x:'')+'&ot='+s.ape(t)+(i?'&oi='+i:'')}}else trk=0}if(trk||qs){s.sampled=s.vs(sed);if(trk){if(s.sampled)code=s.mr(sess,(vt?'&t='+s.ape(vt):'')+s.hav()+q+(qs?qs:s.rq()),0,ta);qs='';s.m_m('"
+"t');if(s.p_r)s.p_r();s.referrer=s.lightProfileID=s.retrieveLightProfiles=s.deleteLightProfiles=''}s.sq(qs)}}}else s.dl(vo);if(vo)s.voa(vb,1);}s.abort=0;s.supplementalDataID=s.pageURLRest=s.lnk=s.eo"
+"=s.linkName=s.linkType=s.wd.s_objectID=s.ppu=s.pe=s.pev1=s.pev2=s.pev3='';if(s.pg)s.wd.s_lnk=s.wd.s_eo=s.wd.s_linkName=s.wd.s_linkType='';return code};s.trackLink=s.tl=function(o,t,n,vo,f){var s=th"
+"is;s.lnk=o;s.linkType=t;s.linkName=n;if(f){s.bct=o;s.bcf=f}s.t(vo)};s.trackLight=function(p,ss,i,vo){var s=this;s.lightProfileID=p;s.lightStoreForSeconds=ss;s.lightIncrementBy=i;s.t(vo)};s.setTagCo"
+"ntainer=function(n){var s=this,l=s.wd.s_c_il,i,t,x,y;s.tcn=n;if(l)for(i=0;i<l.length;i++){t=l[i];if(t&&t._c=='s_l'&&t.tagContainerName==n){s.voa(t);if(t.lmq)for(i=0;i<t.lmq.length;i++){x=t.lmq[i];y"
+"='m_'+x.n;if(!s[y]&&!s[y+'_c']){s[y]=t[y];s[y+'_c']=t[y+'_c']}s.loadModule(x.n,x.u,x.d)}if(t.ml)for(x in t.ml)if(s[x]){y=s[x];x=t.ml[x];for(i in x)if(!Object.prototype[i]){if(typeof(x[i])!='functio"
+"n'||(''+x[i]).indexOf('s_c_il')<0)y[i]=x[i]}}if(t.mmq)for(i=0;i<t.mmq.length;i++){x=t.mmq[i];if(s[x.m]){y=s[x.m];if(y[x.f]&&typeof(y[x.f])=='function'){if(x.a)y[x.f].apply(y,x.a);else y[x.f].apply("
+"y)}}}if(t.tq)for(i=0;i<t.tq.length;i++)s.t(t.tq[i]);t.s=s;return}}};s.wd=window;s.ssl=(s.wd.location.protocol.toLowerCase().indexOf('https')>=0);s.d=document;s.b=s.d.body;if(s.d.getElementsByTagNam"
+"e){s.h=s.d.getElementsByTagName('HEAD');if(s.h)s.h=s.h[0]}s.n=navigator;s.u=s.n.userAgent;s.ns6=s.u.indexOf('Netscape6/');var apn=s.n.appName,v=s.n.appVersion,ie=v.indexOf('MSIE '),o=s.u.indexOf('O"
+"pera '),i;if(v.indexOf('Opera')>=0||o>0)apn='Opera';s.isie=(apn=='Microsoft Internet Explorer');s.isns=(apn=='Netscape');s.isopera=(apn=='Opera');s.ismac=(s.u.indexOf('Mac')>=0);if(o>0)s.apv=parseF"
+"loat(s.u.substring(o+6));else if(ie>0){s.apv=parseInt(i=v.substring(ie+5));if(s.apv>3)s.apv=parseFloat(i)}else if(s.ns6>0)s.apv=parseFloat(s.u.substring(s.ns6+10));else s.apv=parseFloat(v);s.em=0;i"
+"f(s.em.toPrecision)s.em=3;else if(String.fromCharCode){i=escape(String.fromCharCode(256)).toUpperCase();s.em=(i=='%C4%80'?2:(i=='%U0100'?1:0))}if(s.oun)s.sa(s.oun);s.sa(un);s.vl_l='supplementalData"
+"ID,timestamp,dynamicVariablePrefix,visitorID,marketingCloudVisitorID,analyticsVisitorID,audienceManagerLocationHint,fid,vmk,visitorMigrationKey,visitorMigrationServer,visitorMigrationServerSecure,p"
+"pu,charSet,visitorNamespace,cookieDomainPeriods,cookieLifetime,pageName,pageURL,referrer,contextData,currencyCode,lightProfileID,lightStoreForSeconds,lightIncrementBy,retrieveLightProfiles,deleteLi"
+"ghtProfiles,retrieveLightData';s.va_l=s.sp(s.vl_l,',');s.vl_mr=s.vl_m='timestamp,charSet,visitorNamespace,cookieDomainPeriods,cookieLifetime,contextData,lightProfileID,lightStoreForSeconds,lightInc"
+"rementBy';s.vl_t=s.vl_l+',variableProvider,channel,server,pageType,transactionID,purchaseID,campaign,state,zip,events,events2,products,audienceManagerBlob,authState,linkName,linkType';var n;for(n=1"
+";n<=75;n++){s.vl_t+=',prop'+n+',eVar'+n;s.vl_m+=',prop'+n+',eVar'+n}for(n=1;n<=5;n++)s.vl_t+=',hier'+n;for(n=1;n<=3;n++)s.vl_t+=',list'+n;s.va_m=s.sp(s.vl_m,',');s.vl_l2=',tnt,pe,pev1,pev2,pev3,res"
+"olution,colorDepth,javascriptVersion,javaEnabled,cookiesEnabled,browserWidth,browserHeight,connectionType,homepage,pageURLRest,plugins';s.vl_t+=s.vl_l2;s.va_t=s.sp(s.vl_t,',');s.vl_g=s.vl_t+',track"
+"ingServer,trackingServerSecure,trackingServerBase,fpCookieDomainPeriods,disableBufferedRequests,mobile,visitorSampling,visitorSamplingGroup,dynamicAccountSelection,dynamicAccountList,dynamicAccount"
+"Match,trackDownloadLinks,trackExternalLinks,trackInlineStats,linkLeaveQueryString,linkDownloadFileTypes,linkExternalFilters,linkInternalFilters,linkTrackVars,linkTrackEvents,linkNames,lnk,eo,lightT"
+"rackVars,_1_referrer,un';s.va_g=s.sp(s.vl_g,',');s.pg=pg;s.gl(s.vl_g);s.contextData=new Object;s.retrieveLightData=new Object;if(!ss)s.wds();if(pg){s.wd.s_co=function(o){return o};s.wd.s_gs=functio"
+"n(un){s_gi(un,1,1).t()};s.wd.s_dc=function(un){s_gi(un,1).t()}}",
w=window,l=w.s_c_il,n=navigator,u=n.userAgent,v=n.appVersion,e=v.indexOf('MSIE '),m=u.indexOf('Netscape6/'),a,i,j,x,s;if(un){un=un.toLowerCase();if(l)for(j=0;j<2;j++)for(i=0;i<l.length;i++){s=l[i];x=s._c;if((!x||x=='s_c'||(j>0&&x=='s_l'))&&(s.oun==un||(s.fs&&s.sa&&s.fs(s.oun,un)))){if(s.sa)s.sa(un);if(x=='s_c')return s}else s=0}}w.s_an='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
w.s_sp=new Function("x","d","var a=new Array,i=0,j;if(x){if(x.split)a=x.split(d);else if(!d)for(i=0;i<x.length;i++)a[a.length]=x.substring(i,i+1);else while(i>=0){j=x.indexOf(d,i);a[a.length]=x.subst"
+"ring(i,j<0?x.length:j);i=j;if(i>=0)i+=d.length}}return a");
w.s_jn=new Function("a","d","var x='',i,j=a.length;if(a&&j>0){x=a[0];if(j>1){if(a.join)x=a.join(d);else for(i=1;i<j;i++)x+=d+a[i]}}return x");
w.s_rep=new Function("x","o","n","return s_jn(s_sp(x,o),n)");
w.s_d=new Function("x","var t='`^@$#',l=s_an,l2=new Object,x2,d,b=0,k,i=x.lastIndexOf('~~'),j,v,w;if(i>0){d=x.substring(0,i);x=x.substring(i+2);l=s_sp(l,'');for(i=0;i<62;i++)l2[l[i]]=i;t=s_sp(t,'');d"
+"=s_sp(d,'~');i=0;while(i<5){v=0;if(x.indexOf(t[i])>=0) {x2=s_sp(x,t[i]);for(j=1;j<x2.length;j++){k=x2[j].substring(0,1);w=t[i]+k;if(k!=' '){v=1;w=d[b+l2[k]]}x2[j]=w+x2[j].substring(1)}}if(v)x=s_jn("
+"x2,'');else{w=t[i]+' ';if(x.indexOf(w)>=0)x=s_rep(x,w,t[i]);i++;b+=62}}}return x");
w.s_fe=new Function("c","return s_rep(s_rep(s_rep(c,'\\\\','\\\\\\\\'),'\"','\\\\\"'),\"\\n\",\"\\\\n\")");
w.s_fa=new Function("f","var s=f.indexOf('(')+1,e=f.indexOf(')'),a='',c;while(s>=0&&s<e){c=f.substring(s,s+1);if(c==',')a+='\",\"';else if((\"\\n\\r\\t \").indexOf(c)<0)a+=c;s++}return a?'\"'+a+'\"':"
+"a");
w.s_ft=new Function("c","c+='';var s,e,o,a,d,q,f,h,x;s=c.indexOf('=function(');while(s>=0){s++;d=1;q='';x=0;f=c.substring(s);a=s_fa(f);e=o=c.indexOf('{',s);e++;while(d>0){h=c.substring(e,e+1);if(q){i"
+"f(h==q&&!x)q='';if(h=='\\\\')x=x?0:1;else x=0}else{if(h=='\"'||h==\"'\")q=h;if(h=='{')d++;if(h=='}')d--}if(d>0)e++}c=c.substring(0,s)+'new Function('+(a?a+',':'')+'\"'+s_fe(c.substring(o+1,e))+'\")"
+"'+c.substring(e+1);s=c.indexOf('=function(')}return c;");
c=s_d(c);if(e>0){a=parseInt(i=v.substring(e+5));if(a>3)a=parseFloat(i)}else if(m>0)a=parseFloat(u.substring(m+10));else a=parseFloat(v);if(a<5||v.indexOf('Opera')>=0||u.indexOf('Opera')>=0)c=s_ft(c);if(!s){s=new Object;if(!w.s_c_in){w.s_c_il=new Array;w.s_c_in=0}s._il=w.s_c_il;s._in=w.s_c_in;s._il[s._in]=s;w.s_c_in++;}s._c='s_c';(new Function("s","un","pg","ss",c))(s,un,pg,ss);return s}
function s_giqf(){var w=window,q=w.s_giq,i,t,s;if(q)for(i=0;i<q.length;i++){t=q[i];s=s_gi(t.oun);s.sa(t.un);s.setTagContainer(t.tagContainerName)}w.s_giq=0}s_giqf()


/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ============

 Adobe Visitor API for JavaScript version: 1.5.1
 Copyright 1996-2015 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
*/
function Visitor(m,s){if(!m)throw"Visitor requires Adobe Marketing Cloud Org ID";var a=this;a.version="1.5.1";var l=window,j=l.Visitor;l.s_c_in||(l.s_c_il=[],l.s_c_in=0);a._c="Visitor";a._il=l.s_c_il;a._in=l.s_c_in;a._il[a._in]=a;l.s_c_in++;var n=l.document,h=j.Na;h||(h=null);var x=j.Oa;x||(x=void 0);var i=j.la;i||(i=!0);var k=j.Ma;k||(k=!1);a.T=function(a){var c=0,b,e;if(a)for(b=0;b<a.length;b++)e=a.charCodeAt(b),c=(c<<5)-c+e,c&=c;return c};a.q=function(a){var c="0123456789",b="",e="",f,g=8,i=10,
h=10;if(1==a){c+="ABCDEF";for(a=0;16>a;a++)f=Math.floor(Math.random()*g),b+=c.substring(f,f+1),f=Math.floor(Math.random()*g),e+=c.substring(f,f+1),g=16;return b+"-"+e}for(a=0;19>a;a++)f=Math.floor(Math.random()*i),b+=c.substring(f,f+1),0==a&&9==f?i=3:(1==a||2==a)&&10!=i&&2>f?i=10:2<a&&(i=10),f=Math.floor(Math.random()*h),e+=c.substring(f,f+1),0==a&&9==f?h=3:(1==a||2==a)&&10!=h&&2>f?h=10:2<a&&(h=10);return b+e};a.oa=function(){var a;!a&&l.location&&(a=l.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a=
"";else{var c=a.split("."),b=c.length-1,e=b-1;1<b&&2>=c[b].length&&(2==c[b-1].length||0>",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,et,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,nz,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tr,tt,tv,tw,tz,ua,ug,uk,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,".indexOf(","+
c[b]+","))&&e--;if(0<e)for(a="";b>=e;)a=c[b]+(a?".":"")+a,b--}return a};a.cookieRead=function(a){var a=encodeURIComponent(a),c=(";"+n.cookie).split(" ").join(";"),b=c.indexOf(";"+a+"="),e=0>b?b:c.indexOf(";",b+1);return 0>b?"":decodeURIComponent(c.substring(b+2+a.length,0>e?c.length:e))};a.cookieWrite=function(d,c,b){var e=a.cookieLifetime,f,c=""+c,e=e?(""+e).toUpperCase():"";b&&"SESSION"!=e&&"NONE"!=e?(f=""!=c?parseInt(e?e:0,10):-60)?(b=new Date,b.setTime(b.getTime()+1E3*f)):1==b&&(b=new Date,f=
b.getYear(),b.setYear(f+2+(1900>f?1900:0))):b=0;return d&&"NONE"!=e?(n.cookie=encodeURIComponent(d)+"="+encodeURIComponent(c)+"; path=/;"+(b?" expires="+b.toGMTString()+";":"")+(a.cookieDomain?" domain="+a.cookieDomain+";":""),a.cookieRead(d)==c):0};a.g=h;a.P=function(a,c){try{"function"==typeof a?a.apply(l,c):a[1].apply(a[0],c)}catch(b){}};a.sa=function(d,c){c&&(a.g==h&&(a.g={}),a.g[d]==x&&(a.g[d]=[]),a.g[d].push(c))};a.o=function(d,c){if(a.g!=h){var b=a.g[d];if(b)for(;0<b.length;)a.P(b.shift(),
c)}};a.j=h;a.qa=function(d,c,b){var e=0,f=0,g;if(c&&n){for(g=0;!e&&2>g;){try{e=(e=n.getElementsByTagName(0<g?"HEAD":"head"))&&0<e.length?e[0]:0}catch(i){e=0}g++}if(!e)try{n.body&&(e=n.body)}catch(j){e=0}if(e)for(g=0;!f&&2>g;){try{f=n.createElement(0<g?"SCRIPT":"script")}catch(k){f=0}g++}}!c||!e||!f?b&&b():(f.type="text/javascript",f.setAttribute("async","async"),f.src=c,e.firstChild?e.insertBefore(f,e.firstChild):e.appendChild(f),b&&(a.j==h&&(a.j={}),a.j[d]=setTimeout(b,a.loadTimeout)))};a.ma=function(d){a.j!=
h&&a.j[d]&&(clearTimeout(a.j[d]),a.j[d]=0)};a.U=k;a.V=k;a.isAllowed=function(){if(!a.U&&(a.U=i,a.cookieRead(a.cookieName)||a.cookieWrite(a.cookieName,"T",1)))a.V=i;return a.V};a.a=h;a.e=h;var z=j.ab;z||(z="MC");var q=j.fb;q||(q="MCMID");var A=j.bb;A||(A="MCCIDH");var B=j.eb;B||(B="MCSYNCS");var D=j.cb;D||(D="MCIDTS");var y=j.Za;y||(y="A");var o=j.Wa;o||(o="MCAID");var w=j.$a;w||(w="AAM");var v=j.Ya;v||(v="MCAAMLH");var p=j.Xa;p||(p="MCAAMB");var r=j.gb;r||(r="NONE");a.B=0;a.S=function(){if(!a.B){var d=
a.version;a.audienceManagerServer&&(d+="|"+a.audienceManagerServer);a.audienceManagerServerSecure&&(d+="|"+a.audienceManagerServerSecure);a.B=a.T(d)}return a.B};a.W=k;a.f=function(){if(!a.W){a.W=i;var d=a.S(),c=k,b=a.cookieRead(a.cookieName),e,f,g,j=new Date;a.a==h&&(a.a={});if(b&&"T"!=b){b=b.split("|");b[0].match(/^[\-0-9]+$/)&&(parseInt(b[0],10)!=d&&(c=i),b.shift());1==b.length%2&&b.pop();for(d=0;d<b.length;d+=2)e=b[d].split("-"),f=e[0],g=b[d+1],e=1<e.length?parseInt(e[1],10):0,c&&(f==A&&(g=""),
0<e&&(e=j.getTime()/1E3-60)),f&&g&&(a.c(f,g,1),0<e&&(a.a["expire"+f]=e,j.getTime()>=1E3*e&&(a.e||(a.e={}),a.e[f]=i)))}if(!a.b(o)&&(b=a.cookieRead("s_vi")))b=b.split("|"),1<b.length&&0<=b[0].indexOf("v1")&&(g=b[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(/^[0-9a-fA-F\-]+$/)&&a.c(o,g))}};a.ua=function(){var d=a.S(),c,b;for(c in a.a)!Object.prototype[c]&&a.a[c]&&"expire"!=c.substring(0,6)&&(b=a.a[c],d+=(d?"|":"")+c+(a.a["expire"+c]?"-"+a.a["expire"+c]:"")+"|"+b);a.cookieWrite(a.cookieName,
d,1)};a.b=function(d,c){return a.a!=h&&(c||!a.e||!a.e[d])?a.a[d]:h};a.c=function(d,c,b){a.a==h&&(a.a={});a.a[d]=c;b||a.ua()};a.pa=function(d,c){var b=a.b(d,c);return b?b.split("*"):h};a.ta=function(d,c,b){a.c(d,c?c.join("*"):"",b)};a.Ta=function(d,c){var b=a.pa(d,c);if(b){var e={},f;for(f=0;f<b.length;f+=2)e[b[f]]=b[f+1];return e}return h};a.Va=function(d,c,b){var e=h,f;if(c)for(f in e=[],c)Object.prototype[f]||(e.push(f),e.push(c[f]));a.ta(d,e,b)};a.l=function(d,c){var b=new Date;b.setTime(b.getTime()+
1E3*c);a.a==h&&(a.a={});a.a["expire"+d]=Math.floor(b.getTime()/1E3);0>c?(a.e||(a.e={}),a.e[d]=i):a.e&&(a.e[d]=k)};a.R=function(a){if(a&&("object"==typeof a&&(a=a.d_mid?a.d_mid:a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a=r)),!a||a!=r&&!a.match(/^[0-9a-fA-F\-]+$/)))a="";return a};a.i=function(d,c){a.ma(d);a.h!=h&&(a.h[d]=k);if(d==z){var b=a.b(q);if(!b){b="object"==typeof c&&c.mid?c.mid:a.R(c);if(!b){if(a.u){a.getAnalyticsVisitorID(h,k,i);return}b=a.q()}a.c(q,
b)}if(!b||b==r)b="";"object"==typeof c&&((c.d_region||c.dcs_region||c.d_blob||c.blob)&&a.i(w,c),a.u&&c.mid&&a.i(y,{id:c.id}));a.o(q,[b])}if(d==w&&"object"==typeof c){b=604800;c.id_sync_ttl!=x&&c.id_sync_ttl&&(b=parseInt(c.id_sync_ttl,10));var e=a.b(v);e||((e=c.d_region)||(e=c.dcs_region),e&&(a.l(v,b),a.c(v,e)));e||(e="");a.o(v,[e]);e=a.b(p);if(c.d_blob||c.blob)(e=c.d_blob)||(e=c.blob),a.l(p,b),a.c(p,e);e||(e="");a.o(p,[e]);!c.error_msg&&a.s&&a.c(A,a.s);a.idSyncDisableSyncs?t.ca=i:(t.ca=k,t.Ka({H:c.ibs,
d:c.subdomain}))}if(d==y){b=a.b(o);b||((b=a.R(c))?a.l(p,-1):b=r,a.c(o,b));if(!b||b==r)b="";a.o(o,[b])}};a.h=h;a.r=function(d,c,b,e){var f="",g;if(a.isAllowed()&&(a.f(),f=a.b(d),!f&&(d==q?g=z:d==v||d==p?g=w:d==o&&(g=y),g))){if(c&&(a.h==h||!a.h[g]))a.h==h&&(a.h={}),a.h[g]=i,a.qa(g,c,function(){if(!a.b(d)){var b="";d==q?b=a.q():g==w&&(b={error_msg:"timeout"});a.i(g,b)}});a.sa(d,b);c||a.i(g,{id:r});return""}if((d==q||d==o)&&f==r)f="",e=i;b&&e&&a.P(b,[f]);return f};a._setMarketingCloudFields=function(d){a.f();
a.i(z,d)};a.setMarketingCloudVisitorID=function(d){a._setMarketingCloudFields(d)};a.u=k;a.getMarketingCloudVisitorID=function(d,c){if(a.isAllowed()){a.marketingCloudServer&&0>a.marketingCloudServer.indexOf(".demdex.net")&&(a.u=i);var b=a.A("_setMarketingCloudFields");return a.r(q,b,d,c)}return""};a.ra=function(){a.getAudienceManagerBlob()};j.AuthState={UNKNOWN:0,AUTHENTICATED:1,LOGGED_OUT:2};a.p={};a.Q=k;a.s="";a.setCustomerIDs=function(d){if(a.isAllowed()&&d){a.f();var c,b;for(c in d)if(!Object.prototype[c]&&
(b=d[c]))if("object"==typeof b){var e={};b.id&&(e.id=b.id);b.authState!=x&&(e.authState=b.authState);a.p[c]=e}else a.p[c]={id:b};var d=a.getCustomerIDs(),e=a.b(A),f="";e||(e=0);for(c in d)Object.prototype[c]||(b=d[c],f+=(f?"|":"")+c+"|"+(b.id?b.id:"")+(b.authState?b.authState:""));a.s=a.T(f);a.s!=e&&(a.Q=i,a.ra())}};a.getCustomerIDs=function(){a.f();var d={},c,b;for(c in a.p)Object.prototype[c]||(b=a.p[c],d[c]||(d[c]={}),b.id&&(d[c].id=b.id),d[c].authState=b.authState!=x?b.authState:j.AuthState.UNKNOWN);
return d};a._setAnalyticsFields=function(d){a.f();a.i(y,d)};a.setAnalyticsVisitorID=function(d){a._setAnalyticsFields(d)};a.getAnalyticsVisitorID=function(d,c,b){if(a.isAllowed()){var e="";b||(e=a.getMarketingCloudVisitorID(function(){a.getAnalyticsVisitorID(d,i)}));if(e||b){var f=b?a.marketingCloudServer:a.trackingServer,g="";a.loadSSL&&(b?a.marketingCloudServerSecure&&(f=a.marketingCloudServerSecure):a.trackingServerSecure&&(f=a.trackingServerSecure));f&&(g="http"+(a.loadSSL?"s":"")+"://"+f+"/id?callback=s_c_il%5B"+
a._in+"%5D._set"+(b?"MarketingCloud":"Analytics")+"Fields&mcorgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&mid="+e:""));return a.r(b?q:o,g,d,c)}}return""};a._setAudienceManagerFields=function(d){a.f();a.i(w,d)};a.A=function(d){var c=a.audienceManagerServer,b="",e=a.b(q),f=a.b(p,i),g=a.b(o),g=g&&g!=r?"&d_cid_ic=AVID%01"+encodeURIComponent(g):"";a.loadSSL&&a.audienceManagerServerSecure&&(c=a.audienceManagerServerSecure);if(c){var b=a.getCustomerIDs(),h,j;if(b)for(h in b)Object.prototype[h]||
(j=b[h],g+="&d_cid_ic="+encodeURIComponent(h)+"%01"+encodeURIComponent(j.id?j.id:"")+(j.authState?"%01"+j.authState:""));d||(d="_setAudienceManagerFields");b="http"+(a.loadSSL?"s":"")+"://"+c+"/id?d_rtbd=json&d_ver=2"+(!e&&a.u?"&d_verify=1":"")+"&d_orgid="+encodeURIComponent(a.marketingCloudOrgID)+"&d_nsid="+(a.idSyncContainerID||0)+(e?"&d_mid="+e:"")+(f?"&d_blob="+encodeURIComponent(f):"")+g+"&d_cb=s_c_il%5B"+a._in+"%5D."+d}return b};a.getAudienceManagerLocationHint=function(d,c){if(a.isAllowed()&&
a.getMarketingCloudVisitorID(function(){a.getAudienceManagerLocationHint(d,i)})){var b=a.b(o);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerLocationHint(d,i)}));if(b)return b=a.A(),a.r(v,b,d,c)}return""};a.getAudienceManagerBlob=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerBlob(d,i)})){var b=a.b(o);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerBlob(d,i)}));if(b)return b=a.A(),a.Q&&a.l(p,-1),a.r(p,b,d,c)}return""};a.m="";
a.t={};a.C="";a.D={};a.getSupplementalDataID=function(d,c){!a.m&&!c&&(a.m=a.q(1));var b=a.m;a.C&&!a.D[d]?(b=a.C,a.D[d]=i):b&&(a.t[d]&&(a.C=a.m,a.D=a.t,a.m=b=!c?a.q(1):"",a.t={}),b&&(a.t[d]=i));return b};var u={k:!!l.postMessage,ja:1,O:864E5};a.Pa=u;a.Y={postMessage:function(a,c,b){var e=1;c&&(u.k?b.postMessage(a,c.replace(/([^:]+:\/\/[^\/]+).*/,"$1")):c&&(b.location=c.replace(/#.*$/,"")+"#"+ +new Date+e++ +"&"+a))},K:function(a,c){var b;try{if(u.k)if(a&&(b=function(b){if("string"===typeof c&&b.origin!==
c||"[object Function]"===Object.prototype.toString.call(c)&&!1===c(b.origin))return!1;a(b)}),window.addEventListener)window[a?"addEventListener":"removeEventListener"]("message",b,!1);else window[a?"attachEvent":"detachEvent"]("onmessage",b)}catch(e){}}};var E={Z:function(){if(n.addEventListener)return function(a,c,b){a.addEventListener(c,function(a){"function"===typeof b&&b(a)},k)};if(n.attachEvent)return function(a,c,b){a.attachEvent("on"+c,function(a){"function"===typeof b&&b(a)})}}(),map:function(a,
c){if(Array.prototype.map)return a.map(c);if(void 0===a||a===h)throw new TypeError;var b=Object(a),e=b.length>>>0;if("function"!==typeof c)throw new TypeError;for(var f=Array(e),g=0;g<e;g++)g in b&&(f[g]=c.call(c,b[g],g,b));return f},Aa:function(a,c){return this.map(a,function(a){return encodeURIComponent(a)}).join(c)}};a.Ua=E;var t={ka:3E4,N:649,ga:k,id:h,I:h,ba:function(a){if("string"===typeof a)return a=a.split("/"),a[0]+"//"+a[2]},d:h,url:h,Ca:function(){var d="http://fast.",c="?d_nsid="+a.idSyncContainerID+
"#"+encodeURIComponent(n.location.href);this.d||(this.d="nosubdomainreturned");a.loadSSL&&(d=a.idSyncSSLUseAkamai?"https://fast.":"https://");d=d+this.d+".demdex.net/dest5.html"+c;this.I=this.ba(d);this.id="destination_publishing_iframe_"+this.d+"_"+a.idSyncContainerID;return d},wa:function(){var d="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(n.location.href);"string"===typeof a.z&&a.z.length&&(this.id="destination_publishing_iframe_"+(new Date).getTime()+"_"+a.idSyncContainerID,this.I=this.ba(a.z),
this.url=a.z+d)},ca:h,G:k,M:k,v:h,hb:h,Ia:h,ib:h,L:k,w:[],Ga:[],Ha:[],da:u.k?15:100,J:[],Ea:[],aa:i,ea:k,$:function(){function a(){e=document.createElement("iframe");e.id=b.id;e.style.cssText="display: none; width: 0; height: 0;";e.src=b.url;b.Ia=i;c();document.body.appendChild(e)}function c(){E.Z(e,"load",function(){e.className="aamIframeLoaded";b.v=i;b.n()})}this.M=i;var b=this,e=document.getElementById(this.id);e?"IFRAME"!==e.nodeName?(this.id+="_2",a()):"aamIframeLoaded"!==e.className?c():(this.v=
i,this.n()):a();this.Da=e},n:function(d){var c=this;d===Object(d)&&this.J.push(d);if((this.ea||!u.k||this.v)&&this.J.length)this.Ja(this.J.shift()),this.n();!a.idSyncDisableSyncs&&this.v&&this.w.length&&!this.L&&(this.ga||(this.ga=i,setTimeout(function(){c.da=u.k?15:150},this.ka)),this.L=i,this.fa())},Ja:function(a){var c=encodeURIComponent,b,e,f,g,h;if((b=a.H)&&b instanceof Array&&(e=b.length))for(f=0;f<e;f++)g=b[f],h=[c("ibs"),c(g.id||""),c(g.tag||""),E.Aa(g.url||[],","),c(g.ha||""),"","",g.Ba?
"true":"false"],this.aa?this.F(h.join("|")):g.Ba&&this.xa(g,h.join("|"));this.Ea.push(a)},xa:function(d,c){a.f();var b=a.b(B),e=k,f=k,g=Math.ceil((new Date).getTime()/u.O);if(b){if(b=b.split("*"),f=this.La(b,d.id,g),e=f.ya,f=f.za,!e||!f)this.F(c),b.push(d.id+"-"+(g+Math.ceil(d.ha/60/24))),this.Fa(b),a.c(B,b.join("*"))}else this.F(c),a.c(B,d.id+"-"+(g+Math.ceil(d.ha/60/24)))},La:function(a,c,b){var e=k,f=k,g,h,j;for(h=0;h<a.length;h++)g=a[h],j=parseInt(g.split("-")[1],10),g.match("^"+c+"-")?(e=i,b<
j?f=i:(a.splice(h,1),h--)):b>=j&&(a.splice(h,1),h--);return{ya:e,za:f}},Fa:function(a){if(a.join("*").length>this.N)for(a.sort(function(a,b){return parseInt(a.split("-")[1],10)-parseInt(b.split("-")[1],10)});a.join("*").length>this.N;)a.shift()},F:function(d){var c=encodeURIComponent;this.w.push((a.Ra?c("---destpub-debug---"):c("---destpub---"))+d)},fa:function(){var d=this,c;this.w.length?(c=this.w.shift(),a.Y.postMessage(c,this.url,this.Da.contentWindow),this.Ga.push(c),setTimeout(function(){d.fa()},
this.da)):this.L=k},K:function(a){var c=/^---destpub-to-parent---/;"string"===typeof a&&c.test(a)&&(c=a.replace(c,"").split("|"),"canSetThirdPartyCookies"===c[0]&&(this.aa="true"===c[1]?i:k,this.ea=i,this.n()),this.Ha.push(a))},Ka:function(d){this.url===h&&(this.d="string"===typeof a.X&&a.X.length?a.X:d.d||"",this.url=this.Ca());d.H instanceof Array&&d.H.length&&(this.G=i);if((this.G||a.na)&&this.d&&"nosubdomainreturned"!==this.d&&!this.M)(j.ia||"complete"===n.readyState||"loaded"===n.readyState)&&
this.$();"function"===typeof a.idSyncIDCallResult?a.idSyncIDCallResult(d):this.n(d);"function"===typeof a.idSyncAfterIDCallResult&&a.idSyncAfterIDCallResult(d)},va:function(d,c){return a.Sa||!d||c-d>u.ja}};a.Qa=t;0>m.indexOf("@")&&(m+="@AdobeOrg");a.marketingCloudOrgID=m;a.cookieName="AMCV_"+m;a.cookieDomain=a.oa();a.cookieDomain==l.location.hostname&&(a.cookieDomain="");a.loadSSL=0<=l.location.protocol.toLowerCase().indexOf("https");a.loadTimeout=500;a.marketingCloudServer=a.audienceManagerServer=
"dpm.demdex.net";if(s&&"object"==typeof s){for(var C in s)!Object.prototype[C]&&(a[C]=s[C]);a.idSyncContainerID=a.idSyncContainerID||0;a.f();C=a.b(D);var F=Math.ceil((new Date).getTime()/u.O);!a.idSyncDisableSyncs&&t.va(C,F)&&(a.l(p,-1),a.c(D,F));a.getMarketingCloudVisitorID();a.getAudienceManagerLocationHint();a.getAudienceManagerBlob()}if(!a.idSyncDisableSyncs){t.wa();E.Z(window,"load",function(){var d=t;j.ia=i;(d.G||a.na)&&d.d&&"nosubdomainreturned"!==d.d&&d.url&&!d.M&&d.$()});try{a.Y.K(function(a){t.K(a.data)},
t.I)}catch(G){}}}Visitor.getInstance=function(m,s){var a,l=window.s_c_il,j;0>m.indexOf("@")&&(m+="@AdobeOrg");if(l)for(j=0;j<l.length;j++)if((a=l[j])&&"Visitor"==a._c&&a.marketingCloudOrgID==m)return a;return new Visitor(m,s)};(function(){function m(){s.ia=a}var s=window.Visitor,a=s.la;a||(a=!0);window.addEventListener?window.addEventListener("load",m):window.attachEvent&&window.attachEvent("onload",m)})();

    

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
    
    /*
        s.visitor = Visitor.getInstance("B08C1C8B533094750A490D4D@AdobeOrg",{
        marketingCloudServer: s.trackingServer,
        marketingCloudServerSecure: s.trackingServerSecure
    });
    */


    /*
     * Plugin: Cookie Merging 
     */
    s.c_rr=s.c_r;
    s.c_r=new Function("k",""
    +"var s=this,d=new Date,v=s.c_rr(k),c=s.c_rr('s_pers'),i,m,e;if(v)ret"
    +"urn v;k=s.ape(k);i=c.indexOf(' '+k+'=');c=i<0?s.c_rr('s_sess'):c;i="
    +"c.indexOf(' '+k+'=');m=i<0?i:c.indexOf('|',i);e=i<0?i:c.indexOf(';'"
    +",i);m=m>0?m:e;v=i<0?'':s.epa(c.substring(i+2+k.length,m<0?c.length:"
    +"m));if(m>0&&m!=e)if(parseInt(c.substring(m+1,e<0?c.length:e))<d.get"
    +"Time()){d.setTime(d.getTime()-60000);s.c_w(s.epa(k),'',d);v='';}ret"
    +"urn v;");
    s.c_wr=s.c_w;
    s.c_w=new Function("k","v","e",""
    +"var s=this,d=new Date,ht=0,pn='s_pers',sn='s_sess',pc=0,sc=0,pv,sv,"
    +"c,i,t;d.setTime(d.getTime()-60000);if(s.c_rr(k)) s.c_wr(k,'',d);k=s"
    +".ape(k);pv=s.c_rr(pn);i=pv.indexOf(' '+k+'=');if(i>-1){pv=pv.substr"
    +"ing(0,i)+pv.substring(pv.indexOf(';',i)+1);pc=1;}sv=s.c_rr(sn);i=sv"
    +".indexOf(' '+k+'=');if(i>-1){sv=sv.substring(0,i)+sv.substring(sv.i"
    +"ndexOf(';',i)+1);sc=1;}d=new Date;if(e){if(e.getTime()>d.getTime())"
    +"{pv+=' '+k+'='+s.ape(v)+'|'+e.getTime()+';';pc=1;}}else{sv+=' '+k+'"
    +"='+s.ape(v)+';';sc=1;}if(sc) s.c_wr(sn,sv,0);if(pc){t=pv;while(t&&t"
    +".indexOf(';')!=-1){var t1=parseInt(t.substring(t.indexOf('|')+1,t.i"
    +"ndexOf(';')));t=t.substring(t.indexOf(';')+1);ht=ht<t1?t1:ht;}d.set"
    +"Time(ht);s.c_wr(pn,pv,d);}return v==s.c_r(s.epa(k));");

    /*
     * Plugin: getQueryParam 2.4
     */
    s.getQueryParam=new Function("p","d","u","h",""
    +"var s=this,v='',i,j,t;d=d?d:'';u=u?u:(s.pageURL?s.pageURL:s.wd.loca"
    +"tion);if(u=='f')u=s.gtfs().location;while(p){i=p.indexOf(',');i=i<0"
    +"?p.length:i;t=s.p_gpv(p.substring(0,i),u+'',h);if(t){t=t.indexOf('#"
    +"')>-1?t.substring(0,t.indexOf('#')):t;}if(t)v+=v?d+t:t;p=p.substrin"
    +"g(i==p.length?i:i+1)}return v");
    s.p_gpv=new Function("k","u","h",""
    +"var s=this,v='',q;j=h==1?'#':'?';i=u.indexOf(j);if(k&&i>-1){q=u.sub"
    +"string(i+1);v=s.pt(q,'&','p_gvf',k)}return v");
    s.p_gvf=new Function("t","k",""
    +"if(t){var s=this,i=t.indexOf('='),p=i<0?t:t.substring(0,i),v=i<0?'T"
    +"rue':t.substring(i+1);if(p.toLowerCase()==k.toLowerCase())return s."
    +"epa(v)}return''");

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
     * Utility Function: split v1.5 (JS 1.0 compatible)
     */
    s.split=new Function("l","d",""
    +"var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x"
    +"++]=l.substring(0,i);l=l.substring(i+d.length);}return a");
     
     /*
     * Plugin Utility: Replace v1.0
     */
    s.repl=new Function("x","o","n",""
    +"var i=x.indexOf(o),l=n.length;while(x&&i>=0){x=x.substring(0,i)+n+x."
    +"substring(i+o.length);i=x.indexOf(o,i+l)}return x");

    /*
     * Plugin: getVisitStart v2.0 
     */
    s.getVisitStart=new Function("c",""
    +"var s=this,v=1,t=new Date;t.setTime(t.getTime()+1800000);if(s.c_r(c"
    +")){v=0}if(!s.c_w(c,1,t)){s.c_w(c,1,0)}if(!s.c_r(c)){v=0}return v;");

    /*
     * s.join: 1.0 - Joins an array into a string
     */
     
    s.join = new Function("v","p",""
    +"var s = this;var f,b,d,w;if(p){f=p.front?p.front:'';b=p.back?p.back"
    +":'';d=p.delim?p.delim:'';w=p.wrap?p.wrap:'';}var str='';for(var x=0"
    +";x<v.length;x++){if(typeof(v[x])=='object' )str+=s.join( v[x],p);el"
    +"se str+=w+v[x]+w;if(x<v.length-1)str+=d;}return f+str+b;");

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
     *  Plug-in: crossVisitParticipation v1.7 - stacks values from
     *  specified variable in cookie and returns value
     */
     
    s.crossVisitParticipation=new Function("v","cn","ex","ct","dl","ev","dv",""
    +"var s=this,ce;if(typeof(dv)==='undefined')dv=0;if(s.events&&ev){var"
    +" ay=s.split(ev,',');var ea=s.split(s.events,',');for(var u=0;u<ay.l"
    +"ength;u++){for(var x=0;x<ea.length;x++){if(ay[u]==ea[x]){ce=1;}}}}i"
    +"f(!v||v==''){if(ce){s.c_w(cn,'');return'';}else return'';}v=escape("
    +"v);var arry=new Array(),a=new Array(),c=s.c_r(cn),g=0,h=new Array()"
    +";if(c&&c!=''){arry=s.split(c,'],[');for(q=0;q<arry.length;q++){z=ar"
    +"ry[q];z=s.repl(z,'[','');z=s.repl(z,']','');z=s.repl(z,\"'\",'');arry"
    +"[q]=s.split(z,',')}}var e=new Date();e.setFullYear(e.getFullYear()+"
    +"5);if(dv==0&&arry.length>0&&arry[arry.length-1][0]==v)arry[arry.len"
    +"gth-1]=[v,new Date().getTime()];else arry[arry.length]=[v,new Date("
    +").getTime()];var start=arry.length-ct<0?0:arry.length-ct;var td=new"
    +" Date();for(var x=start;x<arry.length;x++){var diff=Math.round((td."
    +"getTime()-arry[x][1])/86400000);if(diff<ex){h[g]=unescape(arry[x][0"
    +"]);a[g]=[arry[x][0],arry[x][1]];g++;}}var data=s.join(a,{delim:',',"
    +"front:'[',back:']',wrap:\"'\"});s.c_w(cn,data,e);var r=s.join(h,{deli"
    +"m:dl});if(ce)s.c_w(cn,'');return r;");

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
    * Plugin: clickPast - version 1.0
    */
    s.clickPast=new Function("scp","ct_ev","cp_ev","cpc",""
    +"var s=this,scp,ct_ev,cp_ev,cpc,ev,tct;if(s.p_fo(ct_ev)==1){if(!cpc)"
    +"{cpc='s_cpc';}ev=s.events?s.events+',':'';if(scp){s.events=ev+ct_ev"
    +";s.c_w(cpc,1,0);}else{if(s.c_r(cpc)>=1){s.events=ev+cp_ev;s.c_w(cpc"
    +",0,0);}}}");

    /*
    * Plugin: getValOnce_v1.1
    */
    s.getValOnce=new Function("v","c","e","t",""
    +"var s=this,a=new Date,v=v?v:'',c=c?c:'s_gvo',e=e?e:0,i=t=='m'?6000"
    +"0:86400000;k=s.c_r(c);if(v){a.setTime(a.getTime()+e*i);s.c_w(c,v,e"
    +"==0?0:a);}return v==k?'':v");

    /*
     * channelManager v2.8 - Tracking External Traffic
     */
    s.channelManager=new Function("a","b","c","d","e","f","g",""
    +"var s=this,h=new Date,i=0,j,k,l,m,n,o,p,q,r,t,u,v,w,x,y,z,A,B,C,D,E"
    +",F,G,H,I,J,K,L,M,N,O,P,Q,R,S;h.setTime(h.getTime()+1800000);if(e){i"
    +"=1;if(s.c_r(e))i=0;if(!s.c_w(e,1,h))s.c_w(e,1,0);if(!s.c_r(e))i=0;i"
    +"f(f&&s.c_r('s_tbm'+f))i=0;}j=s.referrer?s.referrer:document.referre"
    +"r;j=j.toLowerCase();if(!j)k=1;else {l=j.indexOf('?')>-1?j.indexOf('"
    +"?'):j.length;m=j.substring(0,l);n=s.split(j,'/');o=n[2].toLowerCase"
    +"();p=s.linkInternalFilters.toLowerCase();p=s.split(p,',');for(q=0;q"
    +"<p.length;q++){r=o.indexOf(p[q])==-1?'':j;if(r)break;}}if(!r&&!k){t"
    +"=j;u=v=o;w='Other Natural Referrers';x=s.seList+'>'+s._extraSearchE"
    +"ngines;if(d==1){m=s.repl(m,'oogle','%');m=s.repl(m,'ahoo','^');j=s."
    +"repl(j,'as_q','*');}y=s.split(x,'>');for(z=0;z<y.length;z++){A=y[z]"
    +";A=s.split(A,'|');B=s.split(A[0],',');for(C=0;C<B.length;C++){D=m.i"
    +"ndexOf(B[C]);if(D>-1){if(A[2])E=v=A[2];else E=o;if(d==1){E=s.repl(E"
    +",'#',' - ');j=s.repl(j,'*','as_q');E=s.repl(E,'^','ahoo');E=s.repl("
    +"E,'%','oogle');}F=s.split(A[1],',');for(G=0;G<F.length;G++){if(j.in"
    +"dexOf(F[G]+'=')>-1||j.indexOf('https://www.google.')==0)H=1;I=s.get"
    +"QueryParam(F[G],'',j).toLowerCase();if(H||I)break;}}if(H||I)break;}"
    +"if(H||I)break;}}if(!r||g!='1'){r=s.getQueryParam(a,b);if(r){v=r;if("
    +"E)w='Paid Search';else w='Unknown Paid Channel';}if(!r&&E){v=E;w='N"
    +"atural Search';}}if(k==1&&!r&&i==1)t=u=v=w='Typed/Bookmarked';J=s._"
    +"channelDomain;if(J&&o){K=s.split(J,'>');for(L=0;L<K.length;L++){M=s"
    +".split(K[L],'|');N=s.split(M[1],',');O=N.length;for(P=0;P<O;P++){Q="
    +"N[P].toLowerCase();R=o.indexOf(Q);if(R>-1){w=M[0];break;}}if(R>-1)b"
    +"reak;}}J=s._channelParameter;if(J){K=s.split(J,'>');for(L=0;L<K.len"
    +"gth;L++){M=s.split(K[L],'|');N=s.split(M[1],',');O=N.length;for(P=0"
    +";P<O;P++){R=s.getQueryParam(N[P]);if(R){w=M[0];break;}}if(R)break;}"
    +"}J=s._channelPattern;if(J){K=s.split(J,'>');for(L=0;L<K.length;L++)"
    +"{M=s.split(K[L],'|');N=s.split(M[1],',');O=N.length;for(P=0;P<O;P++"
    +"){Q=N[P].toLowerCase();R=r.toLowerCase();S=R.indexOf(Q);if(S==0){w="
    +"M[0];break;}}if(S==0)break;}}S=w?r+u+w+I:'';c=c?c:'c_m';if(c!='0')S"
    +"=s.getValOnce(S,c,0);if(S){s._campaignID=r?r:'n/a';s._referrer=t?t:"
    +"'n/a';s._referringDomain=u?u:'n/a';s._campaign=v?v:'n/a';s._channel"
    +"=w?w:'n/a';s._partner=E?E:'n/a';s._keywords=H?I?I:'Keyword Unavaila"
    +"ble':'n/a';if(f&&w!='Typed/Bookmarked'){h.setTime(h.getTime()+f*864"
    +"00000);s.c_w('s_tbm'+f,1,h);}}");
    /* Top 130 - Grouped */
    s.seList="google.,googlesyndication.com|q,as_q|Google>yahoo.com,yahoo"
    +".co.jp|p,va|Yahoo!>bing.com|q|Bing>altavista.co,altavista.de|q,r|Al"
    +"taVista>.aol.,suche.aolsvc.de|q,query|AOL>ask.jp,ask.co|q,ask|Ask>w"
    +"ww.baidu.com|wd|Baidu>daum.net,search.daum.net|q|Daum>icqit.com|q|i"
    +"cq>myway.com|searchfor|MyWay.com>naver.com,search.naver.com|query|N"
    +"aver>netscape.com|query,search|Netscape Search>reference.com|q|Refe"
    +"rence.com>seznam|w|Seznam.cz>abcsok.no|q|Startsiden>tiscali.it,www."
    +"tiscali.co.uk|key,query|Tiscali>virgilio.it|qs|Virgilio>yandex|text"
    +"|Yandex.ru>search.cnn.com|query|CNN Web Search>search.earthlink.net"
    +"|q|Earthlink Search>search.comcast.net|q|Comcast Search>search.rr.c"
    +"om|qs|RoadRunner Search>optimum.net|q|Optimum Search";


    s.p_fo=new Function("n",""
    +"var s=this;if(!s.__fo){s.__fo=new Object;}if(!s.__fo[n]){s.__fo[n]="
    +"new Object;return 1;}else {return 0;}");


}
