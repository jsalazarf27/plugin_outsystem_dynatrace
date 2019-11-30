#!/usr/bin/env node

"use strict"; 

// Imports
var fs = require('fs');

var config = require('./configHelper.js');
var files = require('./fileOperationHelper.js');
var logger = require('./logger.js');

var helper = require('./update-build-ios-helper.js');

// Const
var PROPERTIES_IOS_INSET = "    ";
var ARRAY_PROPERTIES = ["DTXExcludedControls", "DTXExcludedLifecycleClasses", "DTXSetCookiesForDomain"];

module.exports = async function(){
	logger.logMessageSync("Updating the iOS build ..", logger.INFO);
	
	try{
		let allConfig = await config.readSettings();
		let plistPath = await helper.searchForPListFile();
		await changePListFile(allConfig.agentConfig[config.PLATFORM_IOS - 1], plistPath);
	}catch(error){
		if(error.message == config.ERROR_CONFIG_NOT_AVAILABLE){
			logger.logMessageSync("Dynatrace Cordova Plugin configuration is not available! Skip instrumenting iOS build.", logger.ERROR);
		}else{
			logger.logMessageSync("Updating the ios build failed! See the following error:", logger.ERROR);
			logger.logMessageSync(error, logger.ERROR);
			await logger.closeLogFile();
			throw new Error(error);
		}
	}
}

/**
 * 
 * @param {*} iosConfig Configuration which should be copied to plist
 * @param { String } pListPath Path to the main plist file
 * @returns {void} nothing
 */
async function changePListFile(iosConfig, pListPath){
	let pListContent = await configureIosBuild(iosConfig, pListPath);
	await files.writeTextToFile(pListPath, pListContent);
	logger.logMessageSync("Successfully configured iOS build!", logger.INFO);
}

// Read the plist file and remove the old elements
function configureIosBuild(_properties, _file){
	return new Promise(function(resolve, reject){
		fs.readFile(_file, "utf8", (err, data) => {
			if(err){
				reject("Could not configure ios build because plist file is not available!");
				return;
			}
			
			let lines = data.split("\n");
			let markedIndexes = markDTXLines(lines);

			for(let i = 0; i < markedIndexes.length; i++){
				lines.splice(markedIndexes[i] - i, 1);
			}

			let lastDictIndex = 0;
			
			// Searching for our Properties - They will be removed
			for(let i = lines.length - 1; i >= 0; i--){
				if(lines[i].indexOf("</dict>") > -1){
					lastDictIndex = i;
					break;
				}
			}
			
			// Check if mandatory properties are here
			if(_properties["DTXApplicationID"] == undefined){
				reject("No iOS application id available for instrumentation!");
				return;
			}
			
			// Build Properties
			let newProperties = "";
			for(let key in _properties){
				newProperties += createPropertyKeyLine(key) + "\n" + createPropertyValueLine(_properties[key], checkIfKeyIsArray(key)) + "\n";
			}
			
			newProperties = newProperties.substring(0, newProperties.length - 1);
			lines.splice(lastDictIndex, 0, newProperties);
			resolve(lines.join("\n"));
		})
	});
}

// Mark the lines which are containing Dyntrace properties
function markDTXLines(lines){
	let markedIndexes = [];
	let arrayOpen = false;

	// Searching for our Properties - They will be removed
	for(let i = 0; i < lines.length; i++){
		let key = parseKeyFromPlist(lines[i]);
		if(key !== -1){
			if(checkIfKeyIsArray(key)){
				markedIndexes.push(i);
				arrayOpen = true;
			}else{
				// Property found which is ours
				markedIndexes.push(i);
				markedIndexes.push(i+1);
			}
		}else if(arrayOpen){
			// Mark every line of the array
			markedIndexes.push(i);
			if(lines[i].indexOf("</array>") > -1){
				// End of Array
				arrayOpen = false;
			}
		}
	}

	return markedIndexes;
}

function parseKeyFromPlist(_line){
	if(_line.indexOf("<key>DTX") > -1){
		return _line.substring(_line.indexOf("<key>") + "<key>".length, _line.indexOf("</key>"));
	}

	return -1;
}

// Create the line which contains a property key
function createPropertyKeyLine(_key){
	return PROPERTIES_IOS_INSET + "<key>" + _key + "</key>";
}

// Creates the line which contains the type for a key
function createPropertyValueLine(_value, _isArray){
	if(_isArray){
		let values = _value.split(",");
		let array = PROPERTIES_IOS_INSET + "<array>" + "\n";

		for(let i = 0; i < values.length; i++){
			array += PROPERTIES_IOS_INSET + identifyPropertyValue(values[i]) + "\n";
		}

		array += PROPERTIES_IOS_INSET + "</array>";
		return array;
	}else{
		return identifyPropertyValue(_value);
	}
}

// Decides if the value is String, Bool or Integer
function identifyPropertyValue(_value){
	_value = _value.trim();

	// Check if Boolean
	let isBoolean = checkIfValueIsBoolean(_value);
	if(isBoolean !== -1){
		return PROPERTIES_IOS_INSET + "<" + isBoolean + "/>"
	}

	// Check if int
	if(checkIfValueIsInt(_value)){
		return PROPERTIES_IOS_INSET + "<integer>" + _value + "</integer>"
	}

	return PROPERTIES_IOS_INSET + "<string>" + _value + "</string>";
}

// Function that checks if the Key is an Array type
function checkIfKeyIsArray(_key){
	for(let i = 0; i < ARRAY_PROPERTIES.length; i++){
		if(ARRAY_PROPERTIES[i] === _key){
			return true;
		}
	}

	return false;
}

function checkIfValueIsInt(_value){
	if(!isNaN(_value) && _value.match(/^-{0,1}\d+$/)){
		return true;
	}else{
		return false;
	}
}

// Function that checks if the Value is true or false
function checkIfValueIsBoolean(_value){
	let valueLower = _value.toLowerCase();

	if(valueLower === 'true' || valueLower === 'false'){
		return valueLower;
	}

	return -1;
}
