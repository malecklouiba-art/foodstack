const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  try {
    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }

    // Fetch VAPID public key from API
    const response = await fetch(`${API_URL}/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error(`Failed to fetch VAPID public key: ${response.statusText}`);
    }
    const { publicKey } = (await response.json()) as { publicKey: string };

    if (!publicKey) {
      throw new Error('VAPID public key is not configured on the server.');
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    });

    // Send subscription to API
    const postResponse = await fetch(`${API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!postResponse.ok) {
      throw new Error(`Failed to register subscription: ${postResponse.statusText}`);
    }

    localStorage.setItem('push-subscribed', 'true');
    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}
