'use strict';

var Fs = require("fire-fs");
var Path = require("fire-path");

var inject_script = `
(function () {
    if (typeof window.jsb === 'object') {
        var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            var paths = JSON.parse(hotUpdateSearchPaths);
            jsb.fileUtils.setSearchPaths(paths);

            var fileList = [];
            var storagePath = paths[0] || '';
            var tempPath = storagePath + '_temp/';
            var baseOffset = tempPath.length;

            if (jsb.fileUtils.isDirectoryExist(tempPath) && !jsb.fileUtils.isFileExist(tempPath + 'project.manifest.temp')) {
                jsb.fileUtils.listFilesRecursively(tempPath, fileList);
                fileList.forEach(srcPath => {
                    var relativePath = srcPath.substr(baseOffset);
                    var dstPath = storagePath + relativePath;

                    if (srcPath[srcPath.length] == '/') {
                        jsb.fileUtils.createDirectory(dstPath)
                    }
                    else {
                        if (jsb.fileUtils.isFileExist(dstPath)) {
                            jsb.fileUtils.removeFile(dstPath)
                        }
                        jsb.fileUtils.renameFile(srcPath, dstPath);
                    }
                })
                jsb.fileUtils.removeDirectory(tempPath);
            }
        }
    }
})();
`;

var additional_inject = `

var prevLink = "";
if(prevLink) {
    window["_pt_"] = prevLink;
}

`

module.exports = {
    load: function () {
        // 当 package 被正确加载的时候执行
    },

    unload: function () {
        // 当 package 被正确卸载的时候执行
    },

    messages: {
        'editor:build-finished': function (event, target) {
            var root = Path.normalize(target.dest);
            var url = Path.join(root, "main.js");
            var gameConfigPath = Path.join(root, "..", "..", "assets","_targets","game_config.json");
            var gameConfig = JSON.parse(Fs.readFileSync(gameConfigPath, "utf8"))
            Fs.readFile(url, "utf8", function (err, data) {
                if (err) {
                    throw err;
                }
                var newStr = ""
                if(gameConfig.prev_link) {
                    var content = additional_inject.replace("var prevLink = \"\";","var prevLink = \"" + gameConfig.prev_link + "\";");
                    newStr = inject_script + content + data;
                } else {
                    newStr = inject_script + data;
                }
                Fs.writeFile(url, newStr, function (error) {
                    if (error) {
                        throw error;
                    }
                    Editor.log("SearchPath updated in built main.js for hot update");
                });
            });

            var appJsonPath = Path.join(root, "..", "..","hot-update-tools","app.json");
            Fs.writeFile(appJsonPath, JSON.stringify({
                "android_app_url": gameConfig.android_app_url || "",
                "ios_app_url": gameConfig.ios_app_url || ""
            }), function (error) {
                if (error) {
                    throw error;
                }
                Editor.log("app.json updated for hot update");
            });
        }
    }
};