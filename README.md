[![N|Solid](https://assets.dynatrace.com/content/dam/dynatrace/misc/dynatrace_web.png)](https://dynatrace.com)

# Dynatrace OutSystems Cordova Plugin

This plugin is a wrapper around the Dynatrace Cordova plugin, to be used with OutSystems

## Installation

Import the `DynatracePlugin.oml` file into Service Studio. You can then add it as a dependency to your apps.

In your app, create a Resource called `Dynatrace.properties`.

The file should look like this:

```
AUTO_UPDATE=true
DTXApplicationID=<APP_ID>
DTXBeaconURL=<BEACON_URL>
DTXHybridApplication=true
DTXLogLevel=debug
```

It accepts all parameters that the original cordova plugin accepts.

The Resource must be deployed in the root of your project, like so:

![Example Resource](https://imgur.com/WZUK2Rs.png)

## Usage

`Dynatrace_EnterAction` expects to receive the `ActionName` input parameter.

`Dynatrace_EnterAction` emits the `ActionID` output parameter.  
Use the `ActionID` output parameter as the input parameter for `Dynatrace_LeaveAction`

![Example Flow](https://imgur.com/rv5ZV4t.png)

Results in:

![Example of Waterfall](https://imgur.com/mVy15Tr.png)

## Methods Implemented

- EnterAction
- LeaveAction
- Init (Automatic)

## TODO

Implement everything else.
