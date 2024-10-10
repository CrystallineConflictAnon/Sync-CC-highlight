// ==UserScript==
// @name         Sync /xivg/ CC posts highlight
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Highlights CC callouts (and hopefully nothing else)
// @author       Anon
// @match        https://boards.4chan.org/vg/thread/*
// @match        https://boards.4channel.org/vg/thread/*
// @icon         https://www.google.com/s2/favicons?domain=4chan.org
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    const KEYWORDS = ["cc", "casual", "queue", "queues"];

    // I hate regex (used for finding ET times in the post, helps avoiding irrelevant highlighting)
    const TIME_REGEX = /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*ET\b/i;

    // Funny border for the post
    const HIGHLIGHT_CSS = `
        .callout-highlight {
            position: relative;
            outline: 2px solid red;
            border-radius: 10px;
        }`
    ;

    // We inject the above CSS into the page
    function addGlobalStyle(css) {
        const head = document.getElementsByTagName("head")[0];
        if (!head) {
            return;
        }
        const style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = css;
        head.appendChild(style);
    }

    // We check if we're in /xivg/ before doing anything
    function isXVIGThread() {
        const threadTitleElement = document.querySelector(".thread .subject, .thread .postInfo .subject");
        if (threadTitleElement) {
            const subjectText = threadTitleElement.innerText.toLowerCase();
            if (subjectText.includes("/xivg/")) {
                return true;
            }
        }
        return false;
    }

    // We check the post
    function isCalloutPost(postContent) {
        const contentLower = postContent.toLowerCase();

        // We check for keywords
        const hasKeyword = KEYWORDS.some((keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(contentLower);
        });

        if (!hasKeyword) {
            return false;
        }

        // We check if a time was included (this is what the regex is for)
        const hasTime = TIME_REGEX.test(postContent);
        if (!hasTime) {
            return false;
        }
        return true;
    }

    // We process and highlight the post
    function highlightPost(postContainer) {
        const replyPost = postContainer.querySelector("div.post.reply");
        if (replyPost) {
            replyPost.classList.add("callout-highlight");
        }
    }

    function processPosts() {
        const posts = document.querySelectorAll("div.postContainer");

        posts.forEach((post) => {
            // We do NOT process a post twice
            if (post.getAttribute("data-callout-highlighted") === "true") {
                return;
            }

            // Actual processing
            const messageElement = post.querySelector(".postMessage");
            // Checking if the element is a post
            if (messageElement) {
                // Getting the text from the post
                const text = messageElement.innerText;
                if (isCalloutPost(text)) {
                    // We do not highlight the OP
                    if (!post.classList.contains("opContainer")) {
                        // But we highlight the post otherwise
                        highlightPost(post);
                        post.setAttribute("data-callout-highlighted", "true");
                    }
                }
            }
        });
    }

    // This is the main function, runs all of the stuff above
    if (isXVIGThread()) {
        addGlobalStyle(HIGHLIGHT_CSS);
        processPosts();
    }

    // We go agane when thread updates/new posts appear
    const observer = new MutationObserver((mutations) => {
        if (isXVIGThread()) {
            processPosts();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
