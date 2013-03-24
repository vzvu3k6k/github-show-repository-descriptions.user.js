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
        return repoLi.querySelector("h3 a").href.replace("https://github.com/", "")
    };

    // returns repository elements without description
    var getSimpleRepos = function(){
        return document.querySelectorAll(".repolist > li.simple");
    };

    // Gets details of repos
    var getDetails = function(user, page, perPage, callback){
        var url = "https://api.github.com/users/" + user + "/repos?type=owner&sort=pushed&direction=desc&per_page= " + perPage + "&page=" + page;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function(){
            var result = JSON.parse(this.responseText);
            callback(result);
        };
        xhr.send(null);
    };

    var simpleRepos = getSimpleRepos();
    if(simpleRepos.length > 0){
        var li = document.createElement("li");
        li.setAttribute("style", "min-height:0");
        li.setAttribute("class", "center");
        var button = document.createElement("a");
        button.setAttribute("class", "button minibutton");
        button.textContent = "show details of following repos";
        button.addEventListener("click", function(event){
            event.target.parentNode.setAttribute("style", "display: none");
            getDetails(owner, 1, 100, function(repos){
                var repoData = {};
                for(var i = 0, l = repos.length; i < l; i++){
                    repoData[repos[i].full_name] = repos[i];
                }

                for(var i = 0, l = simpleRepos.length; i < l; i++){
                    var repo = simpleRepos[i];
                    var data = repoData[getRepoFullName(repo)];
                    if(data){
                        addBody(repo, data.description, data.updated_at);
                    }
                    //else console.log("no data: " + repoFullName);
                }
            });
        });
        li.appendChild(button);
        simpleRepos[0].parentNode.insertBefore(li, simpleRepos[0]);
    }
})();
