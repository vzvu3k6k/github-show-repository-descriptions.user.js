// ==UserScript==
// @name           Github: Read all repository descriptions in user's repositories page
// @description    Read all descriptions in https://github.com/{user}?tab=repositories, https://github.com/{organization}
// @version        1.0
// @author         vzvu3k6k
// @match          https://github.com/*
// @namespace      http://vzvu3k6k.tk/
// @license        public domain
// ==/UserScript==

// This script should work in
//   A. https://github.com/<organization> (eg. https://github.com/github)
//   B. https://github.com/<user>?tab=repositories(#) (eg. https://github.com/mojombo?tab=repositories)
//   C. https://github.com/<user|organization>/repositories (eg. https://github.com/mattn/repositories)

(function(){
    const loadNum = 30; // the number of repositories in page C
    var apiParam, pageNumOffset = 0;
    if(!(/^\/[^\/]+\/repositories/.test(location.pathname))){
        apiParam = "sort=pushed&direction=desc";   // A, B
    }else if(!document.querySelector('[data-tab="repo"] .selected')){
        apiParam = "sort=full_name&direction=asc"; // C
        var match = location.search.match(/page=(\d+)/);
        if(match){
            pageNumOffset = parseInt(match[1], 10) - 1;
        }
    }else{
        return;
    }

    GM_addStyle(".repolist .addon.loading{padding: inherit;}");
    GM_addStyle(".repolist .addon.loading:hover{background: inherit;}");
    GM_addStyle(".repolist .addon.loading .indicator{padding-left: 20px;}");

    // Adds description and last updated time to <li>
    var addBody = function(repoLi, descriptionText, updatedAtText){
        var body = document.createElement("div");
        body.classList.add("body");
        var description = document.createElement("p");
        description.classList.add("description");
        description.textContent = descriptionText || "(No Description)";
        body.appendChild(description);
        var update_at = document.createElement("p");
        update_at.classList.add("updated-at");
        update_at.textContent = "Last updated: " + updatedAtText;
        body.appendChild(update_at);

        repoLi.appendChild(body);
        repoLi.classList.remove("simple");
        repoLi.classList.add("not-simple-any-more");
    };

    // {repository_owner}/{project_name} (eg. mojombo/jekyll)
    var getRepoFullName = function(repoLi){
        return repoLi.querySelector("h3 a").href.replace("https://github.com/", "");
    };

    // returns all repository elements
    var getRepos = function(){
        return document.querySelectorAll(".repolist > li");
    };

    // returns repository elements without description
    var getSimpleRepos = function(){
        return document.querySelectorAll(".repolist > li.simple");
    };

    // returns the first visible repository element without description
    var getFirstSimpleRepoOnDisplay = function(){
        var repos = getSimpleRepos();
        for(var i = 0; i < repos.length; i++)
            if(repos[i].style.display != "none"){
                var top = repos[i].getBoundingClientRect().top;
                if(top > 0 && top < window.innerHeight)
                    return repos[i];
            }
        return null;
    };

    // Gets details of repos
    var getDetails = function(user, param, page, perPage, callback, onErrorCallback){
        var url = "https://api.github.com/users/" + user + "/repos?type=owner&" + param + "&per_page=" + perPage + "&page=" + page;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function(){
            var result = JSON.parse(this.responseText);
            callback(result);
        };
        xhr.onErrorCallback = onErrorCallback;
        xhr.send(null);
    };

    // Adds or removes repository load icons from startLi to the num-th sibling of startLi
    var toggleLoadIcons = function(repoElements){
        for(var i = 0; i < repoElements.length; i++){
            var re = repoElements[i];
            if(re.classList.contains("simple")){
                var h3cl = re.querySelector("h3").classList;
                h3cl.toggle("addon");
                h3cl.toggle("loading");
                re.querySelector("h3 a").classList.toggle("indicator");
            }
        }
    };

    var owner = location.pathname.split("/")[1];
    var loading = false;
    var removeListener = function(){document.removeEventListener("scroll", onScroll);};
    var onScroll = function(){
        var firstSimple = getFirstSimpleRepoOnDisplay();
        if(firstSimple == null) return;
        if(loading) return;

        var pageNum = Math.ceil((Array.apply(null, getRepos()).indexOf(firstSimple) + 1) / loadNum) + pageNumOffset;
        var loadingRepos = Array.apply(null, getSimpleRepos()).slice((pageNum - 1) * loadNum, pageNum * loadNum);
        toggleLoadIcons(loadingRepos); // add loading icon
        loading = true;

        getDetails(owner, apiParam, pageNum, loadNum,
            function onload(repos){
                toggleLoadIcons(loadingRepos); // remove loading icon

                var repoData = {};
                for(var i = 0, l = repos.length; i < l; i++){
                    repoData[repos[i].full_name] = repos[i];
                }

                var simpleRepos = getSimpleRepos();
                for(var i = 0, l = simpleRepos.length; i < l; i++){
                    var repo = simpleRepos[i];
                    var data = repoData[getRepoFullName(repo)];
                    if(data){
                        addBody(repo, data.description, data.updated_at);
                    }
                    //else console.log("no data: " + repoFullName);
                }

                loading = false;
                if(getSimpleRepos().length == 0)
                    removeListener();
            },
            function onerror(){
                console.info("xhr error");
                removeListener();
            });
    };
    document.addEventListener("scroll", onScroll);
})();
