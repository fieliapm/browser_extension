﻿// ==UserScript==
// @name           Plurk Emoticon Importer Exporter
// @namespace      http://fieliapm.blogspot.com/
// @version        0.0.1
// @author         fieliapm (fieliapm@gmail.com)
// @description    Plurk Emoticon Importer Exporter. made by fieliapm (fieliapm@gmail.com)
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

function init(){
	function initUI(){
		var importFile = document.createElement("input");
		importFile.type = "file";
		importFile.id = "emoticon-import_file";
		importFile.name = "emoticon-import_file";

		var importButton = document.createElement("input");
		importButton.type = "button";
		importButton.id = "emoticon-import";
		importButton.name = "emoticon-import";
		importButton.value = "import emoticon";

		/*
		var listItemImport = document.createElement("li");
		listItemImport.className = "pif-import cmp_import_off";
		listItemImport.appendChild(importButton);
		listItemImport.appendChild(importFile);
		*/

		var exportButton = document.createElement("input");
		exportButton.type = "button";
		exportButton.id = "emoticon-export";
		exportButton.name = "emoticon-export";
		exportButton.value = "export emoticon";

		/*
		var listItemExport = document.createElement("li");
		listItemExport.className = "pif-export cmp_export_off";
		listItemExport.appendChild(exportButton);
		*/

		var splashWindow = document.createElement("div");
		splashWindow.style = "position: relative; top: 50%; transform: translate(0%, -50%); width: 300px; margin: auto; background-color: white; padding: 10px;";
		splashWindow.appendChild(importFile);
		splashWindow.appendChild(document.createElement("br"));
		splashWindow.appendChild(importButton);
		splashWindow.appendChild(document.createElement("br"));
		splashWindow.appendChild(exportButton);

		var splashWindowBackground = document.createElement("div");
		splashWindowBackground.style = "position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 10;";
		splashWindowBackground.style.display = "none";
		splashWindowBackground.appendChild(splashWindow);
		document.body.appendChild(splashWindowBackground);

		var emoticonExtensionButton = document.createElement("input");
		emoticonExtensionButton.type = "button";
		emoticonExtensionButton.id = "emoticon-extension";
		emoticonExtensionButton.name = "emoticon-extension";
		emoticonExtensionButton.value = ":(";

		var listItemEmoticonExtension = document.createElement("li");
		listItemEmoticonExtension.className = "pif-emoticon-extension cmp_emoticon_extension_off";
		listItemEmoticonExtension.appendChild(emoticonExtensionButton);

		var iconsHolder = document.getElementById("main_poster").getElementsByClassName("icons_holder")[0];
		iconsHolder.appendChild(listItemEmoticonExtension);

		return {
			emoticonExtensionButton: emoticonExtensionButton,
			splashWindowBackground: splashWindowBackground,
			splashWindow: splashWindow,
			importFile: importFile,
			importButton: importButton,
			exportButton: exportButton
		};
	}

	unsafeWindow.PlurkEmoticonIO = function(splashWindowBackground, importFile){
		console.log("init plurk emoticon extension");

		this.token = unsafeWindow.GLOBAL.session_user.token;
		//this.token = document.body.innerHTML.match(/token=([^'^"^\s]+)/)[1];
		//this.user_id = GLOBAL.session_user.id;
		console.log("token:", this.token);

		function flatEmoticons(emoticonGroups){
			function getEmoticonsOfGroupId(group_id){
				return emoticonGroups[group_id].map(function(emoticon){
					return Object.assign({group_id: group_id}, emoticon);
				});
			}
			return [].concat.apply([], [1].concat(emoticonGroups.go).map(getEmoticonsOfGroupId));
		}

		function createEmoticonsMap(emoticons){
			var emoticonsMap = {};
			emoticons.forEach(function(emoticon){
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

		this.getUserEmoticons = function(){
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);

			return fetch("https://www.plurk.com/EmoticonManager/getUserEmoticons",
				{
					method: "POST",
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
					},
					body: searchParams
				}
			).then(function(response){
				if(response.ok){
					return response.json();
				}else{
					return response.text().then(function(errMessage){
						throw {
							status: response.status,
							message: errMessage
						};
					});
				}
			}).then(function(currentEmoticonGroups){
				return currentEmoticonGroups;
			}).catch(function(error){
				console.error("error:", error);
			});
		};

		this.addEmoticon = function(hash_id, keyword, group_id){
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);
			searchParams.append("hash_id", hash_id);
			searchParams.append("keyword", keyword);
			searchParams.append("group_id", group_id);

			return fetch("https://www.plurk.com/EmoticonDiscovery/addEmoticon",
				{
					method: "POST",
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
					},
					body: searchParams
				}
			).then(function(response){
				if(response.ok){
					return response.json();
				}else{
					return response.text().then(function(errResponse){
						throw {
							status: response.status,
							emoticon: {
								hash_id: hash_id,
								keyword: keyword,
								group_id: group_id
							},
							response: errResponse
						};
					});
				}
			}).then(function(result){
				return result;
			}).catch(function(error){
				console.error("error:", error);
			});
		};
		
		this.removeEmoticon = function(hash_id){
			var searchParams = new URLSearchParams();
			searchParams.append("token", this.token);
			searchParams.append("hash_id", hash_id);

			return fetch("https://www.plurk.com/EmoticonDiscovery/removeEmoticon",
				{
					method: "POST",
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
					},
					body: searchParams
				}
			).then(function(response){
				if(response.ok){
					return response.json();
				}else{
					return response.text().then(function(errResponse){
						throw {
							status: response.status,
							emoticon: {
								hash_id: hash_id
							},
							response: errResponse
						};
					});
				}
			}).then(function(result){
				return result;
			}).catch(function(error){
				console.error("error:", error);
			});
		};

		this.importEmoticon = function(){
			console.log("import emo");

			//importFile = document.getElementById("emo-import_file");
			if(importFile.files.length >= 1){
				var importFileObj = importFile.files[0];
				var importFileReader = new FileReader();
				var that = this;
				importFileReader.onload = function(event){
					var importEmoticons = JSON.parse(event.target.result);
					that.getUserEmoticons().then(function(currentEmoticonGroups){
						var currentEmoticons = flatEmoticons(currentEmoticonGroups);
						var currentEmoticonsMap = createEmoticonsMap(currentEmoticons);
						var addEmoticonPromise = Promise.resolve();
						importEmoticons.forEach(function(importEmoticon){
							var group_id = ("group_id" in importEmoticon)?importEmoticon.group_id:1;
							addEmoticonPromise = addEmoticonPromise.then(function(){
								if(!((importEmoticon.hash_id in currentEmoticonsMap) && (importEmoticon.keyword === currentEmoticonsMap[importEmoticon.hash_id].keyword))){
									console.log("add", importEmoticon.hash_id, importEmoticon.keyword, group_id);
									return that.addEmoticon(importEmoticon.hash_id, importEmoticon.keyword, group_id);
								}else{
									console.log("no-op", importEmoticon.hash_id, importEmoticon.keyword, group_id);
									return Promise.resolve();
								}
							});
						});
						addEmoticonPromise.then(function(){
							console.log("import emo complete!");
							alert("import emo complete!");
							splashWindowBackground.style.display = "none";
							return Promise.resolve();
						});
					});
				};
				importFileReader.readAsText(importFileObj);
			}else{
				console.log("please choose import file!");
				alert("please choose import file!");
				splashWindowBackground.style.display = "none";
			}
		};

		this.exportEmoticon = function(){
			console.log("export emo");

			this.getUserEmoticons().then(function(currentEmoticonGroups){
				var currentEmoticons = flatEmoticons(currentEmoticonGroups);
				downloadObjectAsJSON("emoticon", currentEmoticons);

				console.log("export emo complete!");
				splashWindowBackground.style.display = "none";
			});

			console.log("export emo wait");
		};

		this.openEmoticonSplash = function(){
			console.log("open emo splash");
			splashWindowBackground.style.display = "";
		};

		console.log("init plurk emoticon extension complete!");

		return this;
	};

	var emoticonUI = initUI();

	unsafeWindow.plurkEmoticonIO = new unsafeWindow.PlurkEmoticonIO(emoticonUI.splashWindowBackground, emoticonUI.importFile);

	emoticonUI.importButton.addEventListener("click", function(){unsafeWindow.plurkEmoticonIO.importEmoticon();});
	emoticonUI.exportButton.addEventListener("click", function(){unsafeWindow.plurkEmoticonIO.exportEmoticon();});
	emoticonUI.emoticonExtensionButton.addEventListener("click", function(){unsafeWindow.plurkEmoticonIO.openEmoticonSplash();});
}

/*
function waitForElement(){
	if(typeof unsafeWindow.GLOBAL !== "undefined"){
		init();
	} else {
		console.log("wait");
		setTimeout(waitForElement, 250);
	}
}
*/

//window.addEventListener("load", waitForElement);
window.addEventListener("load", init);

})();
