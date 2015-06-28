# HBS Web Analytics Wrapper

## Install

HTTP script reference

```html
<script src="http://www.hbs.edu/js/analytics.js"></script>
<script src="https://secure.hbs.edu/static/js/analytics.js"></script>
```

## Async Loading

```html
<script type="text/javascript">
    (function(){
        var k=document.createElement('script');k.type='text/javascript';k.async=true;
        k.src='http://www.hbs.edu/js/analytics.js';
        var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(k,s);
    })();
</script>

<script type="text/javascript">
    var _analytics = _analytics || [];
    _analytics.push(function(){
        analytics.settings({profile:'test'});
        analytics.settings({pageParams:['id']});
    });
</script>
```

## Settings

Options to control the configuration of the analytics

Must be run before page load

```javascript
// configures the analytics report id
analytics.settings({profile:"profilecode"})
```

## Link Markup

```html
<!-- forces link to track as an offsite link -->
<a href="page.html" class="offsite">Link</a>
<a href="page.html" rel="offsite">Link</a>

<!-- forces link to track as an onsite link -->
<a href="page.html" class="onsite">Link</a>
<a href="page.html" rel="onsite">Link</a>

<!-- forces link to track as a download link -->
<a href="page.html" class="download">Link</a>
<a href="page.html" rel="download">Link</a>

<!-- tracks individual links on the page -->
<a href="page.html" id="topnav-page">Link</a>

<!-- tracks a search result click -->
<a href="page.html" rel="search-result">Link</a>
```

## View

Simple link tracking. This automatically detects if the URL is a file or external link. Does not count as a page view.

```javascript
analytics.view("http://www.google.com");
```
## Page View

Full pageload tracking. Sets the channel and page name variables. Best used for modals or ajax page loads.

```javascript
analytics.pageView("/page.html");
```

## Event

Simple event tracking. Allows you to count the number of user interactions on a page. Does not count as a success metric.

```javascript
analytics.event("next-page");
```

## Search

Track Search Metrics

Must be run before page load

```javascript
// param 1 - String, The user entered search term
// param 2 - Num, the total number of results
// param 3 - Array of Strings, facets selected

analytics.search("Query Term",100,["Topics : Finance","Geo : Asia"]);
```

## Media

Track Media Metrics

```javascript
// starts the play duration stopwatch
analytics.mediaPlay("mba-video-2010");

// pauses the play duration stopwatch
analytics.mediaPause("mba-video-2010");

// sends the milestone data
// analytics.mediaMilestone(str MediaName,number Duration);

analytics.mediaMilestone("mba-video-2010",0);
analytics.mediaMilestone("mba-video-2010",25);
analytics.mediaMilestone("mba-video-2010",50);
analytics.mediaMilestone("mba-video-2010",75);
analytics.mediaMilestone("mba-video-2010",100);
```

## Error

ServerSide Error Analytics

Must be run before page load

```javascript
analytics.error(status,details);
analytics.error(404);
analytics.error("timeout","directory-search: Results returned in more than 9 sec");
analytics.error("server error","directory-search: q=query2&q2=query2");
```

## Javascript Error Tracking

Record JavaScript errors on the page

Must be run before page load

```javascript
window.onerror = analytics.onerror
```

## User Error

User Interaction Error Analytics

```javascript
analytics.userError("Zip Code Cannot Be Blank");
```

## Engagement

Increase User Engagement Count

Must be run before page load

```javascript
analytics.addEngagement(2);
```

## Campiagns

Adds a user to a campaign

Must be run before page load

```javascript
analytics.campaignStart("mp-banner-102-ee-amp","Email");
```

## Conversion

Must be run before page load

```javascript
analytics.conversion("apply-amp");
```

## Features

In-page analytics tracking of features.

```html
<div data-feature="search">
    <div data-feature="search-box">
        <div data-feature="search-button">
            <button>Submit</button>
        </div>
    </div>
</div>
```


