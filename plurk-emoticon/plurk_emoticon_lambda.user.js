// ==UserScript==
// @name           PlurkEmoticonLambda
// @namespace      https://fieliapm.blogspot.com/
// @version        0.2.0-rc1
// @author         fieliapm (fieliapm@gmail.com)
// @description    Plurk emoticon extension utility, made by fieliapm (fieliapm@gmail.com)
// @include        *://www.plurk.com/*
// @exclude        *://www.plurk.com/_comet/*
// @exclude        *://www.plurk.com/EmoticonManager2
// @exclude        *://www.plurk.com/EmoticonManager2/*
// @exclude        *://www.plurk.com/m
// @exclude        *://www.plurk.com/m/*
// ==/UserScript==

/*
================================================================================

PlurkEmoticonLambda - Plurk emoticon extension utility
Copyright (C) 2018-present Himawari Tachibana <fieliapm@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

================================================================================
*/

/*
================================================================================
author:
Himawari Tachibana | https://github.com/fieliapm

special thanks:
catLee             | https://github.com/leemiyinghao
Maplewing          | https://github.com/sinmaplewing
================================================================================
*/

/*
unused API:


https://www.plurk.com/EmoticonManager/uploadEmoFromUrl
token: $1$01234567890abcdef@pdg1ab
url: https://emos.plurk.com/#{hash_id}_w48_h22.gif


https://www.plurk.com/EmoticonManager/uploadEmoFromFile
multipart/form-data:
-----------------------------012345678901234
Content-Disposition: form-data; name="token"

$1$01234567890abcdef@pdg1ab
-----------------------------012345678901234
Content-Disposition: form-data; name="image"; filename="filename.gif"
Content-Type: image/gif

(binary data)
-----------------------------012345678901234--
*/

/* jshint esversion: 6 */

(function () {

    "use strict";

    // view
    function initUI() {
        // style

        const styleText = `
div.splash-window {
	position: relative;
	top: 50%;
	transform: translate(0%, -50%);
	width: 500px;
	margin: auto;
	padding: 10px;
	background-color: white;
	color: black;
}

.splash-window-element {
	width: 100%;
}

div.css-table { display: table; }
div.css-table-header { display: table-header-group; }
div.css-table-body { display: table-row-group; }
div.css-table-row { display: table-row; }
div.css-table-cell { display: table-cell; }
`;

        // splash window

        let style = document.createElement("style");
        style.innerText = styleText;
        document.head.appendChild(style);

        const splashWindowHTML = `
<div class="splash-window">
	<div>
		<input type="button" id="emoticon-close_splash_window" name="emoticon-close_splash_window" value="x">
	</div>
	<div class="css-table">
		<div class="css-table-header">
			<div class="css-table-row">
				<div class="css-table-cell">import</div>
				<div class="css-table-cell">export</div>
			</div>
		</div>
		<div class="css-table-body">
			<div class="css-table-row">
				<div class="css-table-cell"><progress id="emoticon-import_progress" class="splash-window-element" max="1" value="0"></progress></div>
				<div class="css-table-cell"></div>
			</div>
			<div class="css-table-row">
				<div class="css-table-cell"><input type="file" id="emoticon-import_file" class="splash-window-element" name="emoticon-import_file"></div>
				<div class="css-table-cell"></div>
			</div>
			<div class="css-table-row">
				<div class="css-table-cell"><input type="button" id="emoticon-import_button" name="emoticon-import_button" value="import emoticon"></div>
				<div class="css-table-cell"><input type="button" id="emoticon-export_button" name="emoticon-export_button" value="export emoticon"></div>
			</div>
		</div>
	</div>
</div>
`;

        let splashWindowBackground = document.createElement("div");
        splashWindowBackground.style = "position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 10;";
        splashWindowBackground.style.display = "none";
        splashWindowBackground.id = "emoticon-splash_window_background";
        splashWindowBackground.innerHTML = splashWindowHTML;

        document.body.appendChild(splashWindowBackground);

        // emoticon lambda button

        const emoticonLambdaButtonHTML = `<input type="button" id="emoticon-lambda" name="emoticon-lambda" value=":(">`;

        let listItemEmoticonLambda = document.createElement("li");
        listItemEmoticonLambda.className = "pif-emoticon-lambda cmp_emoticon_lambda_off";
        listItemEmoticonLambda.innerHTML = emoticonLambdaButtonHTML;

        let iconsHolder = document.getElementById("main_poster").getElementsByClassName("icons_holder")[0];
        iconsHolder.appendChild(listItemEmoticonLambda);

        return;
    }

    // const

    const postHeaderTemplate = {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
    };

    // utility function

    function flatEmoticons(emoticonGroups) {
        function getEmoticonsOfGroupId(group_id) {
            let emoticonsOfGroupId = emoticonGroups.hasOwnProperty(group_id) ? emoticonGroups[group_id] : [];
            return emoticonsOfGroupId.map((emoticon) => {
                return Object.assign({ group_id: group_id }, emoticon);
            });
        }
        return [].concat.apply([], [1].concat(emoticonGroups.go).map(getEmoticonsOfGroupId));
    }

    function createEmoticonsMap(emoticons) {
        let emoticonsMap = {};
        emoticons.forEach((emoticon) => {
            emoticonsMap[emoticon.hash_id] = Object.assign({}, emoticon);
        });
        return emoticonsMap;
    }

    function createGroupMap(emoticonGroups) {
        let groupMap = { 1: 1 };
        for (let group_id in emoticonGroups.g) {
            groupMap[group_id] = group_id;
        }
        return groupMap;
    }

    function downloadObjectAsJSON(filename, exportObj) {
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        let downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.href = dataStr;
        downloadAnchorNode.download = filename + ".json";
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    class PlurkEmoticonIO {
        constructor() {
            let importButton = document.getElementById("emoticon-import_button");
            let exportButton = document.getElementById("emoticon-export_button");
            let closeSplashWindowButton = document.getElementById("emoticon-close_splash_window");
            let emoticonLambdaButton = document.getElementById("emoticon-lambda");

            importButton.addEventListener("click", this.importEmoticon.bind(this));
            exportButton.addEventListener("click", this.exportEmoticon.bind(this));
            closeSplashWindowButton.addEventListener("click", this.closeSplashWindow.bind(this));
            emoticonLambdaButton.addEventListener("click", this.openSplashWindow.bind(this));

            this.token = unsafeWindow.GLOBAL.session_user.token;
            //this.token = document.body.innerHTML.match(/token=([^'^"^\s]+)/)[1];
            //this.user_id = unsafeWindow.GLOBAL.session_user.id;
            console.log("token:", this.token);
        }

        newGroup(hash_id, keyword, group_id) {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);

            return fetch("https://www.plurk.com/EmoticonManager2/newGroup", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        setGroup(hash_id, group_id) {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);
            searchParams.append("hash_id", hash_id);
            searchParams.append("group_id", group_id);

            return fetch("https://www.plurk.com/EmoticonManager2/setGroup", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse,
                            emoticon: {
                                hash_id: hash_id,
                                group_id: group_id
                            }
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        revokeGroup(group_id) {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);
            searchParams.append("group_id", group_id);

            return fetch("https://www.plurk.com/EmoticonManager2/revokeGroup", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse,
                            emoticon: {
                                group_id: group_id
                            }
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        getUserEmoticons() {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);

            return fetch("https://www.plurk.com/EmoticonManager/getUserEmoticons", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        addEmoticon(hash_id, keyword, group_id) {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);
            searchParams.append("hash_id", hash_id);
            searchParams.append("keyword", keyword);
            searchParams.append("group_id", group_id);

            return fetch("https://www.plurk.com/Emoticons/add", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse,
                            emoticon: {
                                hash_id: hash_id,
                                keyword: keyword,
                                group_id: group_id
                            }
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        removeEmoticon(hash_id) {
            let searchParams = new URLSearchParams();
            searchParams.append("token", this.token);
            searchParams.append("hash_id", hash_id);

            return fetch("https://www.plurk.com/Emoticons/remove", {
                method: "POST",
                headers: new Headers(postHeaderTemplate),
                body: searchParams
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then((errorResponse) => {
                        let errorObj = {
                            status: response.status,
                            response: errorResponse,
                            emoticon: {
                                hash_id: hash_id
                            }
                        };
                        throw new Error(JSON.stringify(errorObj, null, 4));
                    });
                }
            });
        }

        uploadEmoticons(importEmoticons) {
            let importProgress = document.getElementById("emoticon-import_progress");
            let importButton = document.getElementById("emoticon-import_button");

            importButton.disabled = true;
            let importProgressMaxBackup = importProgress.max;
            let importProgressValueBackup = importProgress.value;
            importProgress.max = importEmoticons.length;
            importProgress.value = 0;
            this.getUserEmoticons().then((currentEmoticonGroups) => {
                let currentEmoticons = flatEmoticons(currentEmoticonGroups);
                let currentEmoticonsMap = createEmoticonsMap(currentEmoticons);
                let groupMap = createGroupMap(currentEmoticonGroups);
                let addEmoticonPromise = Promise.resolve();
                importEmoticons.forEach((importEmoticon, index) => {
                    let group_id = importEmoticon.hasOwnProperty("group_id") ? importEmoticon.group_id : 1;
                    if (!groupMap.hasOwnProperty(group_id)) {
                        groupMap[group_id] = null;
                        addEmoticonPromise = addEmoticonPromise.then(() => {
                            return this.newGroup().then((response) => {
                                let new_group_id = response.g;
                                groupMap[group_id] = new_group_id;
                                console.log("mapGroup", group_id, groupMap[group_id]);
                            });
                        });
                    }
                    addEmoticonPromise = addEmoticonPromise.then(() => {
                        importProgress.value = index;
                        if (currentEmoticonsMap.hasOwnProperty(importEmoticon.hash_id) && (importEmoticon.keyword === currentEmoticonsMap[importEmoticon.hash_id].keyword)) {
                            if (group_id === currentEmoticonsMap[importEmoticon.hash_id].group_id) {
                                console.log(index, "noOperation", importEmoticon.hash_id, importEmoticon.keyword, group_id, groupMap[group_id]);
                                return Promise.resolve();
                            } else {
                                console.log(index, "setGroup", importEmoticon.hash_id, importEmoticon.keyword, group_id, groupMap[group_id]);
                                return this.setGroup(importEmoticon.hash_id, groupMap[group_id]);
                            }
                        } else {
                            console.log(index, "add", importEmoticon.hash_id, importEmoticon.keyword, group_id, groupMap[group_id]);
                            return this.addEmoticon(importEmoticon.hash_id, importEmoticon.keyword, groupMap[group_id]);
                        }
                    });
                });
                return addEmoticonPromise;
            }).then(() => {
                importProgress.value = importEmoticons.length;
                alert("import emoticon complete!");
                return Promise.resolve();
            }).catch((error) => {
                alert("error:\n" + error.toString());
                return Promise.resolve();
            }).finally(() => {
                importProgress.max = importProgressMaxBackup;
                importProgress.value = importProgressValueBackup;
                importButton.disabled = false;
                return Promise.resolve();
            });
        }

        parseAndUploadEmoticons(event) {
            let importEmoticons = JSON.parse(event.target.result);
            this.uploadEmoticons(importEmoticons);
        }

        importEmoticon() {
            console.log("import emoticon");

            let importFile = document.getElementById("emoticon-import_file");

            if (importFile.files.length >= 1) {
                let importFileObj = importFile.files[0];

                let importFileReader = new FileReader();
                importFileReader.onload = this.parseAndUploadEmoticons.bind(this);
                importFileReader.onerror = function () {
                    alert("read import file failed!");
                };
                importFileReader.readAsText(importFileObj);
            } else {
                alert("please choose import file!");
            }
        }

        exportEmoticon() {
            console.log("export emoticon");

            let exportButton = document.getElementById("emoticon-export_button");
            exportButton.disabled = true;

            this.getUserEmoticons().then((currentEmoticonGroups) => {
                let currentEmoticons = flatEmoticons(currentEmoticonGroups);
                downloadObjectAsJSON("emoticon", currentEmoticons);
                return Promise.resolve();
            }).finally(() => {
                exportButton.disabled = false;
                return Promise.resolve();
            });
        }

        closeSplashWindow() {
            console.log("close splash window");

            let splashWindowBackground = document.getElementById("emoticon-splash_window_background");
            splashWindowBackground.style.display = "none";
        }

        openSplashWindow() {
            console.log("open splash window");

            let splashWindowBackground = document.getElementById("emoticon-splash_window_background");
            splashWindowBackground.style.display = "";
        }
    }

    function onLoad() {
        // init

        console.log("init plurk emoticon lambda");

        initUI();

        unsafeWindow.plurkEmoticonIO = new PlurkEmoticonIO();

        console.log("init plurk emoticon lambda complete!");

        return;
    }

    window.addEventListener("load", onLoad);

})();
