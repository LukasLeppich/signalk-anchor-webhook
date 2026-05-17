/**
 * @import {ServerAPI, Plugin, Update, Notification, Position, Delta} from '@signalk/server-api'
 */

/** @param {ServerAPI} app */
module.exports = (app) => {
  const PLUGIN_NAME = 'SignalK Anchor Webhook';
  const PLUGIN_ID = 'signalk-anchor-webhook';
  const unsubscribes = [];
  let lastSendTime = 0;
  /** @type Plugin */
  const plugin = {
    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    description: 'A simple plugin for SignalK to send a HTTP request when the anchor alarm is triggered.',
    start: start,
    stop: stop,
    schema: schema
  };

  function start(settings, restartPlugin) {
    let subscription = {
      context: 'vessels.self',
      subscribe: [{
        path: 'notifications.navigation.anchor',
        policy: 'instant',
      }]
    };

    app.subscriptionmanager.subscribe(
      subscription,
      unsubscribes,
      subscriptionError => {
        app.error('Error:' + subscriptionError);
      },
      delta => {
        if (!delta.updates) {
          return;
        }
        delta.updates.forEach(update => {
          if (!update.values) {
            app.debug("No values in update, skipping");
            return;
          }
          update.values.forEach(value => {
            if (value.path !== 'notifications.navigation.anchor') {
              app.debug(`Received update for path ${value.path}, but expected notifications.navigation.anchor, skipping`);
              return;
            }
            /** @type {Notification} */
            const alarm = value.value;
            if (!alarm || alarm.state !== 'emergency') {
              app.debug(`Received anchor alarm update, but state is ${alarm ? alarm.state : 'undefined'}, skipping`);
              return;
            }
            const now = Date.now();
            if (now - lastSendTime > 5000) { // Limit send rate to 1 request per second
              lastSendTime = now;
              sendRequests(settings.urls);
            } else {
              app.debug(`Received anchor alarm update, but last send was only ${now - lastSendTime}ms ago, skipping to avoid spamming`);
            }
          });
        });
      }
    );
    app.setPluginStatus('Running');
  }
  function sendRequests(urls) {
    app.debug(`Sending HTTP requests to configured URLs: ${urls.join(', ')}`);
    urls.forEach(async url => {
      try {
        const resp = await fetch(url, { method: 'GET' });
        if (resp.ok) {
          app.debug(`Successfully sent request to ${url}`);
          return;
        }
        app.debug(`Received non-ok response from ${url}: ${resp.status} ${resp.statusText}`);
      } catch (e) {
        app.error(`Error sending request to ${url}: ${e}`);
      }

    });
  }
  function stop() {
    unsubscribes.forEach(f => f());
    app.setPluginStatus('Stopped');
  }
  function schema() {
    return {
      title: PLUGIN_NAME,
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          title: 'URLs to send HTTP requests to',
          required: ['urls'],
          items: {
            type: 'string',
            title: 'URL'
          }
        }
      }
    }
  }
  return plugin;
};
