# Anchor alarm webhook for SignalK

A simple plugin that triggers GET HTTP requests to specified URLs when the anchor alarm notification has the state `emergency`.

Subscribe to `notifications.navigation.anchor` and wait for updates where the `state`is set to `emergency`. On receiving a matching update, the configured URLs are called. 

This can be used in combination with [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid) or other automation tools to trigger an alarm. 

## Installation:
Navigate to your SignalK directory (e.g. ~/.signalk) and install from github:

`npm i LukasLeppich/signalk-anchor-webhook`

Restart SignalK server.

Add URLs in the plugin configuration page.



## MacroDroid macro:
1. Use a webhook trigger, copy the url into the configuration of this plugin.
2. Create a Do/While loop with `Device Locked` as condition. Inside of the loop add a sound to play and a `Wait x seconds`. 
3. Display a notification to let you know that the anchor alarm was triggered.