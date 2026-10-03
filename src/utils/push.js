import { supabase } from './supabase';

// Helper to convert VAPID string to Uint8Array for the subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications no son soportadas en este navegador.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permiso denegado para notificaciones.');
  }

  // 1. Fetch public VAPID key from Edge Function to keep it out of frontend bundle
  const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
  if (vapidError || !vapidData?.publicKey) {
    throw new Error('No se pudo obtener la clave VAPID pública.');
  }

  const registration = await navigator.serviceWorker.ready;
  
  // 2. Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
  });

  // 3. Save to database
  const subJSON = subscription.toJSON();
  const { error: dbError } = await supabase.from('pushSubscriptions').upsert({
    userId,
    endpoint: subJSON.endpoint,
    p256dh: subJSON.keys.p256dh,
    auth: subJSON.keys.auth,
    userAgent: navigator.userAgent,
    active: true
  }, { onConflict: 'endpoint' });

  if (dbError) {
    throw dbError;
  }
  
  return true;
}

export async function testPushNotification(userId) {
  // We can just invoke the edge function for a test ping, or insert a mock row in notifications
  // For push, we invoke an edge function directly.
  await supabase.functions.invoke('notify-test', {
    body: { userId }
  });
}
