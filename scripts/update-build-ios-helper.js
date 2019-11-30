#!/usr/bin/env node

"use strict"; 

exports.searchForPListFile = searchForPListFile;

var path = require('path');
var paths = require('./pathsConstants.js');
var files = require('./fileOperationHelper.js');
var logger = require('./logger.js');

const DIR_SEARCH_EXCEPTION = ["build", "cordova", "CordovaLib"];

/**
 * Searches for the right PList file
 * @returns {String} Path to Plist file
 */
async function searchForPListFile(){
    let foundPListFiles;

    try{
        let packageApplicationContent = await files.readTextFromFile(paths.getApplicationPackage());
        let packageApplicationJSON = JSON.parse(packageApplicationContent);
        
        foundPListFiles = await files.searchFilesInDirectoryRecursive(paths.getIosPath(), packageApplicationJSON.name + "-Info.plist", DIR_SEARCH_EXCEPTION);
    }catch(e){
        logger.logMessageSync("Didnt find package.json and couldn't read name of the application. Will search for other plist files.", logger.WARN);
    }
	
	if(!foundPListFiles || foundPListFiles.length == 0){
		// If no plist file found with the name search in general for -Info.plist
		foundPListFiles = await files.searchFilesInDirectoryRecursive(paths.getIosPath(), "-Info.plist", DIR_SEARCH_EXCEPTION);
	}
	
	if(foundPListFiles.length > 1){
		logger.logMessageSync("Found several -Info.plist files, will take the first one: " + path.resolve(foundPListFiles[0]), logger.WARN);
	}else if(foundPListFiles.length == 0){
		throw new Error("No -Info.plist file found. iOS Instrumentation can not be completed by the script");
	}

	return foundPListFiles[0];
}