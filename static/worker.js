/*
Copyright 2015, 2019 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
// deno-lint-ignore no-unused-vars
const OFFLINE_VERSION = 5;
const CACHE_NAME = "offline";
// Customize this with a different URL if needed.
const OFFLINE_URL = "/offline.html";

/*const priceLevels = [1,2,4];
const priceLevelNames = ["låg","mellan","hög","extrem"];

const priceStates = {
  todayRs: null,
  tomorrowRs: null,
  lastDate: null,
  lastTomorrowDate: null,
  lastPriceLevel: 0
};

const nowPrice = (rs) => {
  if (rs && rs.data && rs.data.length > 0) {
    const result = rs.data.find((e) => Date.parse(e.startTime) <= new Date().getTime() && Date.parse(e.endTime) >= new Date().getTime());
    return result ? result.spotPrice : null;
  } else {
    return null;
  }
};

const hourlyCheck = async (registration) => {

  registration.showNotification("Test", { body: "Detta borde köras var 5e minut"});

  const
    dToday = new Date().toLocaleDateString('sv-SE'),
    dTomorrow = new Date().toLocaleDateString('sv-SE');

  // If new day
  if (dToday != priceStates.lastDate) {

    // Try to get new result set
    const
      rs = await fetch("/api/spot?currency=SEK&area=SE2&period=hourly&date=" + dToday + "&accessKey=194174147afnuspwa"),
      rsJson = await rs.json();

    if (rsJson.valid) {
      priceStates.todayRs = rsJson;

      //
      priceStates.lastDate = dToday;
    }

  }

  // If new tomorrow
  if (dTomorrow != priceStates.lastTomorrowDate) {

    // Try to get new result set
    const
      rs = await fetch("/api/spot?currency=SEK&area=SE2&period=hourly&date=" + dTomorrow + "&accessKey=194174147afnuspwa"),
      rsJson = await rs.json();

    if (rsJson.valid) {
      priceStates.tomorrowRs = rsJson;
      priceStates.lastTomorrowDate = dTomorrow;
      registration.showNotification("Spot",{
        body: "Morgondagens elpriser finns tillgängliga"
      });
    }

  }

  // Check if price level has changed
  if (priceStates.todayRs && priceStates.todayRs.valid) {
    let foundPriceLevel = 0;
    const priceNow = nowPrice(priceStates.todayRs);
    if (priceNow < priceLevels[0]) {
      foundPriceLevel = 0;
    } else if (priceNow < priceLevels[1]) {
      foundPriceLevel = 1;
    } else if (priceNow < priceLevels[2]) {
      foundPriceLevel = 2;
    } else {
      foundPriceLevel = 3;
    }

    if (foundPriceLevel != priceStates.lastPriceLevel) {
      if (foundPriceLevel < priceStates.lastPriceLevel && priceStates.lastPriceLevel !== null) {
        registration.showNotification('Billigare el', {
          body: 'Elprisnivån har minskat från ' + priceLevelNames[priceStates.lastPriceLevel] + ' till ' + priceLevelNames[foundPriceLevel] + '. Elpriset är just nu ' + priceNow.toFixed(2) + " kr"
        });
      } else if (foundPriceLevel > priceStates.lastPriceLevel && priceStates.lastPriceLevel !== null) {
        registration.showNotification('Dyrare el', {
          body: 'Elprisnivån har ökat från ' + priceLevelNames[priceStates.lastPriceLevel] + ' till ' + priceLevelNames[foundPriceLevel] + '. Elpriset är just nu ' + priceNow.toFixed(2) + " kr"
        });
      }
      priceStates.lastPriceLevel = foundPriceLevel;
    }
  }

};*/

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Setting {cache: 'reload'} in the new request will ensure that the response
    // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
    await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
  })());
});

/*self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-spotprice-update') {
    hourlyCheck(self.registration);
  }
});*/

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Enable navigation preload if it's supported.
    // See https://developers.google.com/web/updates/2017/02/navigation-preload
    if ("navigationPreload" in self.registration) {
      await self.registration.navigationPreload.enable();
    }
  })());

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's supported.
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // catch is only triggered if an exception is thrown, which is likely
        // due to a network error.
        // If fetch() returns a valid HTTP response with a response code in
        // the 4xx or 5xx range, the catch() will NOT be called.
        console.log("Fetch failed; returning offline page instead.", error);

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse;
      }
    })());
  }

  // If our if() condition is false, then this fetch handler won't intercept the
  // request. If there are any other fetch handlers registered, they will get a
  // chance to call event.respondWith(). If no fetch handlers call
  // event.respondWith(), the request will be handled by the browser as if there
  // were no service worker involvement.
});
