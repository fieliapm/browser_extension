// ==UserScript==
// @name           PlurkEmoticonLambda
// @namespace      https://fieliapm.blogspot.com/
// @version        0.0.9
// @author         fieliapm (fieliapm@gmail.com)
// @description    Plurk Emoticon Extension Utility. made by fieliapm (fieliapm@gmail.com)
// @include        *://www.plurk.com/*
// @exclude        *://www.plurk.com/m/*
// @exclude        *://www.plurk.com/_comet/*
// ==/UserScript==

/*
https://www.plurk.com/EmoticonManager/uploadEmoFromUrl
token: $1$01234567890abcdef@pdg1ab
url: https://emos.plurk.com/#{hash_id}_w48_h22.gif
*/

(function(){

"use strict";

function init(){
	// view

	function initUI(){
		// splash window

		const splashWindowHTML = `
<div style="position: relative; top: 50%; transform: translate(0%, -50%); width: 500px; margin: auto; background-color: white; padding: 10px;">
	<table>
		<tr>
			<th style="color: black;">import</th>
			<th style="color: black;">export</th>
		</tr>
		<tr>
			<td><progress id="emoticon-import_progress" max="1" value="0" style="width: 100%;"></progress></td>
			<td></td>
		</tr>
		<tr>
			<td><input type="file" id="emoticon-import_file" name="emoticon-import_file" style="width: 100%;"></td>
			<td></td>
		</tr>
		<tr>
			<td><input type="button" id="emoticon-import_button" name="emoticon-import_button" value="import emoticon"></td>
			<td><input type="button" id="emoticon-export_button" name="emoticon-export_button" value="export emoticon"></td>
		</tr>
	</table>
</div>
`;

		var splashWindowBackground = document.createElement("div");
		splashWindowBackground.style = "position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 10;";
		splashWindowBackground.style.display = "none";
		splashWindowBackground.id = "emoticon-splash_window_background";
		splashWindowBackground.innerHTML = splashWindowHTML;

		document.body.appendChild(splashWindowBackground);

		// emoticon extension button

		const emoticonExtensionButtonHTML = `<input type="button" id="emoticon-extension" name="emoticon-extension" value=":(">`;

		var listItemEmoticonExtension = document.createElement("li");
		listItemEmoticonExtension.className = "pif-emoticon-extension cmp_emoticon_extension_off";
		listItemEmoticonExtension.innerHTML = emoticonExtensionButtonHTML;

		var iconsHolder = document.getElementById("main_poster").getElementsByClassName("icons_holder")[0];
		iconsHolder.appendChild(listItemEmoticonExtension);

		return;
	}

	// const

	const postHeaderTemplate = {
		"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
	};

	// utility function

	function flatEmoticons(emoticonGroups){
		function getEmoticonsOfGroupId(group_id){
			return emoticonGroups[group_id].map((emoticon) => {
				return Object.assign({group_id: group_id}, emoticon);
			});
		}
		return [].concat.apply([], [1].concat(emoticonGroups.go).map(getEmoticonsOfGroupId));
	}

	function createEmoticonsMap(emoticons){
		var emoticonsMap = {};
		emoticons.forEach((emoticon) => {
			emoticonsMap[emoticon.hash_id] = Object.assign({}, emoticon);
		});
		return emoticonsMap;
	}

	function downloadObjectAsJSON(filename, exportObj){
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
		var downloadAnchorNode = document.createElement("a");
		downloadAnchorNode.href = dataStr;
		downloadAnchorNode.download = filename+".json";
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	class PlurkEmoticonIO{
		constructor(){
			var importButton = document.getElementById("emoticon-import_button");
			var exportButton = document.getElementById("emoticon-export_button");
			var emoticonExtensionButton = document.getElementById("emoticon-extension");

			importButton.addEventListener("click", this.importEmoticon.bind(this));
			exportButton.addEventListener("click", this.exportEmoticon.bind(this));
			emoticonExtensionButton.addEventListener("click", this.openEmoticonSplash.bind(this));

			this.token = unsafeWindow.GLOBAL.session_user.token;
			//this.token = document.body.innerHTML.match(/token=([^'^"^\s]+)/)[1];
			//this.user_id = unsafeWindow.GLOBAL.session_user.id;
			console.log("token:", this.token);
		}

		getUserEmoticons(){
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);

			return fetch("https://www.plurk.com/EmoticonManager/getUserEmoticons", {
				method: "POST",
				headers: new Headers(postHeaderTemplate),
				body: searchParams
			}).then((response) => {
				if(response.ok){
					return response.json();
				}else{
					return response.text().then((errorResponse) => {
						var errorObj = {
							status: response.status,
							response: errorResponse
						};
						throw new Error(JSON.stringify(errorObj, null, 4));
					});
				}
			});
		}

		addEmoticon(hash_id, keyword, group_id) {
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);
			searchParams.append("hash_id", hash_id);
			searchParams.append("keyword", keyword);
			searchParams.append("group_id", group_id);

			return fetch("https://www.plurk.com/EmoticonDiscovery/addEmoticon", {
				method: "POST",
				headers: new Headers(postHeaderTemplate),
				body: searchParams
			}).then((response) => {
				if(response.ok){
					return response.json();
				}else{
					return response.text().then((errorResponse) => {
						var errorObj = {
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

		removeEmoticon(hash_id){
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);
			searchParams.append("hash_id", hash_id);

			return fetch("https://www.plurk.com/EmoticonDiscovery/removeEmoticon", {
				method: "POST",
				headers: new Headers(postHeaderTemplate),
				body: searchParams
			}).then((response) => {
				if(response.ok){
					return response.json();
				}else{
					return response.text().then((errorResponse) => {
						var errorObj = {
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

		uploadEmoticons(importEmoticons){
			var importProgress = document.getElementById("emoticon-import_progress");
			var splashWindowBackground = document.getElementById("emoticon-splash_window_background");

			var importProgressMaxBackup = importProgress.max;
			var importProgressValueBackup = importProgress.value;
			importProgress.max = importEmoticons.length;
			importProgress.value = 0;
			this.getUserEmoticons().then((currentEmoticonGroups) => {
				var currentEmoticons = flatEmoticons(currentEmoticonGroups);
				var currentEmoticonsMap = createEmoticonsMap(currentEmoticons);
				var addEmoticonPromise = Promise.resolve();
				importEmoticons.forEach((importEmoticon, index) => {
					var group_id = ("group_id" in importEmoticon)?importEmoticon.group_id:1;
					addEmoticonPromise = addEmoticonPromise.then(() => {
						importProgress.value = index;
						if(!((importEmoticon.hash_id in currentEmoticonsMap) && (importEmoticon.keyword === currentEmoticonsMap[importEmoticon.hash_id].keyword))){
							console.log(index, "add", importEmoticon.hash_id, importEmoticon.keyword, group_id);
							return this.addEmoticon(importEmoticon.hash_id, importEmoticon.keyword, group_id);
						}else{
							console.log(index, "no-op", importEmoticon.hash_id, importEmoticon.keyword, group_id);
							return Promise.resolve();
						}
					});
				});
				addEmoticonPromise.then(() => {
					importProgress.value = importEmoticons.length;
					alert("import emoticon complete!");
					importProgress.max = importProgressMaxBackup;
					importProgress.value = importProgressValueBackup;
					splashWindowBackground.style.display = "none";
					return Promise.resolve();
				}).catch((error) => {
					alert("error:\n"+error.toString());
					importProgress.max = importProgressMaxBackup;
					importProgress.value = importProgressValueBackup;
				});
			});
		}

		parseAndUploadEmoticons(event){
			var importEmoticons = JSON.parse(event.target.result);
			this.uploadEmoticons(importEmoticons);
		}

		importEmoticon(){
			console.log("import emoticon");

			var importFile = document.getElementById("emoticon-import_file");

			if(importFile.files.length >= 1){
				var importFileObj = importFile.files[0];

				var importFileReader = new FileReader();
				importFileReader.onload = this.parseAndUploadEmoticons.bind(this);
				importFileReader.readAsText(importFileObj);
			}else{
				alert("please choose import file!");
			}
		}

		exportEmoticon(){
			console.log("export emoticon");
			console.log(this);

			var splashWindowBackground = document.getElementById("emoticon-splash_window_background");

			this.getUserEmoticons().then((currentEmoticonGroups) => {
				var currentEmoticons = flatEmoticons(currentEmoticonGroups);
				downloadObjectAsJSON("emoticon", currentEmoticons);

				splashWindowBackground.style.display = "none";
				return Promise.resolve();
			});
		}

		openEmoticonSplash(){
			console.log("open emoticon splash");

			var splashWindowBackground = document.getElementById("emoticon-splash_window_background");
			splashWindowBackground.style.display = "";
		}
	}

	// init

	console.log("init plurk emoticon extension");

	initUI();

	unsafeWindow.plurkEmoticonIO = new PlurkEmoticonIO();

	console.log("init plurk emoticon extension complete!");

	return;
}

window.addEventListener("load", init);

})();
