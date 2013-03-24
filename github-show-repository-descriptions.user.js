// ==UserScript==
// @name           Github: Read all repository descriptions in user's repositories page
// @description    Read all descriptions in https://github.com/{user}?tab=repositories
// @version        1.0
// @author         vzvu3k6k
// @match          https://github.com/*
// @namespace      http://vzvu3k6k.tk/
// @license        public domain
// ==/UserScript==

// This script should work in
//   * https://github.com/<organization> (eg. https://github.com/github)
//   * https://github.com/<user>?tab=repositories(#) (eg. https://github.com/mojombo?tab=repositories)

(function(){
    // check if the current page is a repository list.
    if(!document.querySelector('[data-tab="repo"] .selected'))
        return;

    var owner = location.pathname.slice(1);

    // Adds description and last updated time to <li>
    var addBody = function(repoLi, description, updated_at){
        var body = document.createElement("div");
        body.classList.add("body");
        var _description = document.createElement("p");
        _description.classList.add("description");
        _description.textContent = description || "(No Description)";
        body.appendChild(_description);
        var _updated_at = document.createElement("p");
        _updated_at.classList.add("updated-at");
        _updated_at.textContent = "Last updated: " + updated_at;
        body.appendChild(_updated_at);

        repoLi.appendChild(body);
        repoLi.classList.remove("simple");
        repoLi.classList.add("not-simple-any-more");
    };

    // {repository_owner}/{project_name} (eg. mojombo/jekyll)
    var getRepoFullName = function(repoLi){
        return repoLi.querySelector("h3 a").href.replace("https://github.com/", "")
    };

    // returns repository elements without description
    var getSimpleRepos = function(){
        return document.querySelectorAll(".repolist > li.simple");
    };

    // https://api.github.com/users/{user}/repos API returns up to 30 repos.
    const REPOS_API_NUM_LIMIT = 30;

    // Show details of up to REPOS_API_NUM_LIMIT repos from the bottom in bulk
    // using https://api.github.com/users/{user}/repos
    var showBottomReposData = function(){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.github.com/users/" + owner + "/repos?type=owner&sort=pushed&direction=asc");
        xhr.onload = function(){
            var result = JSON.parse(this.responseText);
            var repoData = {};
            for(var i = 0, l = result.length; i < l; i++){
                repoData[result[i].full_name] = result[i];
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
        };
        xhr.send(null);
    };

    var simpleRepos = getSimpleRepos();
    if(simpleRepos.length > 0){
        // puts a "show details of following repos" button
        var li = document.createElement("li");
        li.setAttribute("style", "min-height:0");
        li.classList.add("center");
        var button = document.createElement("a");
        button.setAttribute("class", "button minibutton");
        button.textContent = "show details of following repos";
        button.addEventListener("click", function(event){
            event.target.parentNode.setAttribute("style", "display: none");
            showBottomReposData();
        });
        li.appendChild(button);
        var uncoveredSimpleReposNum = simpleRepos.length - REPOS_API_NUM_LIMIT;
        simpleRepos[0].parentNode.insertBefore(li, simpleRepos[Math.max(0, uncoveredSimpleReposNum)]);

        // puts "..." buttons
        var onClickExpander = function(event){
            event.preventDefault();
            var target = event.target;
            target.setAttribute("style", "display: none");

            var repoLi = target.parentNode.parentNode.parentNode;
            var repoUrl = repoLi.querySelector("h3 a").href;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", repoUrl);
            xhr.responseType = "document";
            xhr.onload = function(){
                var d = this.responseXML;
                var description = d.querySelector('meta[name="description"]').getAttribute("content").replace(/^\S+ - /, "");
                var updated_at = d.querySelector("time.updated").getAttribute("datetime");
                addBody(repoLi, description, updated_at);
            };
            xhr.send(null);
        };
        for(var i = 0; i < uncoveredSimpleReposNum; i++){
            var span = document.createElement("span");
            span.setAttribute("class", "hidden-text-expander inline");
            var a = document.createElement("a");
            a.setAttribute("href", "#");
            a.setAttribute("style", "line-height: 6px;");
            a.textContent = "…";
            span.appendChild(a);

            span.addEventListener("click", onClickExpander);
            simpleRepos[i].querySelector("h3").appendChild(span);
        }
    }
})()
