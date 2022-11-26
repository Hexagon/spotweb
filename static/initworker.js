/*const requestNotificationPermission = async () => {
    if ("Notification" in window) {
        const permission = await window.Notification.requestPermission();
        if(permission !== 'granted'){
            throw new Error('Permission not granted for Notification');
        }
    } else {
        throw new Error("Notifications not supporter by current environment");
    }
};*/

const registerServiceWorker = async () => {
  // Register service worker
  if ("serviceWorker" in navigator) {
    const _registration = await navigator.serviceWorker.register("/worker.js");
    navigator.serviceWorker.addEventListener("message", (event) => {
      messageReceived(event.data.msg, event.data.payload);
    });
    /*if ('periodicSync' in registration) {
            // Request permission
            const status = await navigator.permissions.query({
              name: 'periodic-background-sync',
            });
            if (status.state === 'granted') {
              try {
                // Register new sync every 24 hours
                await registration.periodicSync.register('get-spotprice-update', {
                    minInterval: 60 * 5 * 1000,
                });
                console.log('Periodic background sync registered!');
              } catch(e) {
                console.error(`Periodic background sync failed:\n${e}`);
              }
            }
        }*/
  } else {
    throw new Error("Service workers not available in current environment");
  }
};

const main = async () => {
  // Request notification permission
  await registerServiceWorker();
  //await requestNotificationPermission();
};

main();
