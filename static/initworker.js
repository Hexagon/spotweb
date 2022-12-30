const registerServiceWorker = async () => {
  // Register service worker
  if ("serviceWorker" in navigator) {
    const _registration = await navigator.serviceWorker.register("/worker.js");
    navigator.serviceWorker.addEventListener("message", (event) => {
      messageReceived(event.data.msg, event.data.payload);
    });
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
