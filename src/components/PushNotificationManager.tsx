import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/services/api';
import { getAuthSession } from '@/lib/auth';
import {
  PushUnavailableError,
  clearPushPromptSnooze,
  getActiveServiceWorker,
  getUserIdFromToken,
  isPushPromptSnoozed,
  snoozePushPrompt,
} from '@/lib/push-notifications';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  // A escolha do aviso é por usuário (id = `sub` do token).
  const userId = getAuthSession()?.user?.id ?? getUserIdFromToken(getAuthSession()?.accessToken);
  // Endpoint já enviado ao backend nesta página: evita um POST a cada vez que a aba ganha foco.
  const sentEndpoint = useRef<string | null>(null);
  const checking = useRef(false);

  const sendSubscription = useCallback(async (sub: PushSubscription) => {
    if (sentEndpoint.current === sub.endpoint) return;
    await apiFetch('/users/web-push-subscription', {
      method: 'POST',
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    sentEndpoint.current = sub.endpoint;
  }, []);

  // `silent`: chamada automática ao abrir o app. Nela nada de toast (só o toque do usuário mostra erro).
  const subscribe = useCallback(async (registration: ServiceWorkerRegistration, silent = false) => {
    if (!registration?.pushManager) {
      console.warn('Push manager não suportado neste navegador/ambiente.');
      return false;
    }
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY não encontrada no ambiente.');
      if (!silent) toast.error('Chave VAPID pública não configurada no frontend.');
      return false;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    await sendSubscription(subscription);
    return true;
  }, [sendSubscription]);

  // Verifica o estado real. O aviso só aparece se ainda falta ativar E o usuário não
  // recusou/fechou antes (a escolha fica salva). Nada de toast ao abrir o app.
  const checkStatus = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      const snoozed = isPushPromptSnoozed(userId);
      const permission = Notification.permission;

      if (permission === 'denied') {
        // O usuário bloqueou: não adianta insistir, o navegador não deixa pedir de novo.
        setShowBanner(false);
        return;
      }
      if (permission !== 'granted') {
        setShowBanner(!snoozed);
        return;
      }

      try {
        // Sempre pede o registro ativo na hora: o guardado de antes pode estar velho.
        const registration = await getActiveServiceWorker();
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sendSubscription(sub); // garante que o backend tem a inscrição atual
          setShowBanner(false);
          return;
        }
        // Permissão ok, mas a inscrição sumiu: tenta refazer em silêncio.
        const ok = await subscribe(registration, true);
        setShowBanner(!ok && !snoozed);
      } catch (e) {
        console.warn('Falha ao checar registro de push:', e);
        setShowBanner(!(e instanceof PushUnavailableError) && !snoozed);
      }
    } finally {
      checking.current = false;
    }
  }, [userId, sendSubscription, subscribe]);

  const handleDismiss = () => {
    snoozePushPrompt(userId);
    setShowBanner(false);
  };

  const handleActivate = async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('Este navegador não suporta notificações push.');
        return;
      }
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }
      if (permission === 'granted') {
        // Registro ativo consultado agora: evita "no active Service Worker".
        const registration = await getActiveServiceWorker();
        if (await subscribe(registration)) {
          clearPushPromptSnooze(userId);
          setShowBanner(false);
          toast.success('Notificações ativadas com sucesso!');
        }
      } else if (permission === 'denied') {
        setShowBanner(false);
        toast.error('Notificações bloqueadas. Libere as notificações deste site nas configurações do navegador.');
      } else {
        // Fechou a caixa do navegador sem escolher: respeita e não pergunta de novo por um tempo.
        handleDismiss();
      }
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(
        error instanceof PushUnavailableError
          ? error.message
          : `Não foi possível ativar as notificações: ${error?.message || error}`,
      );
    }
  };

  // Checa ao abrir e quando o app volta ao primeiro plano (reativa sozinho se o usuário
  // liberou nas configurações do navegador). Recusa/fechar não gera novo aviso.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    void checkStatus();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkStatus();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [checkStatus]);

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl">
        <div className="flex flex-col text-center">
          <span className="text-2xl font-bold">Ative as Notificações</span>
          <span className="mt-3 text-base text-primary-foreground/90 leading-relaxed">
            Para não perder nenhuma venda, ative os alertas instantâneos de novos pedidos.
          </span>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-xl bg-transparent px-5 py-3.5 text-base font-bold text-primary-foreground hover:bg-primary-foreground/10 active:scale-95 transition-all"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="w-full rounded-xl bg-background px-5 py-3.5 text-base font-bold text-primary shadow-sm hover:bg-background/90 active:scale-95 transition-all"
          >
            Ativar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
