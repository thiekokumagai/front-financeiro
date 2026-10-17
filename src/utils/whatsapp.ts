/**
 * Helper utilitário para abrir links do WhatsApp.
 * Em dispositivos móveis (Android, iPhone, iPad, iPod), tenta abrir o app nativo via URL scheme (whatsapp://).
 * Se o app não abrir ou no desktop, abre a versão web (web.whatsapp.com / api.whatsapp.com).
 */
export interface OpenWhatsAppParams {
  phone?: string | null;
  text?: string;
}

export function openWhatsApp(
  phoneOrParams?: string | OpenWhatsAppParams | null,
  messageText?: string
) {
  let phone: string | undefined;
  let text: string | undefined;

  if (typeof phoneOrParams === "object" && phoneOrParams !== null) {
    phone = phoneOrParams.phone || undefined;
    text = phoneOrParams.text;
  } else if (typeof phoneOrParams === "string") {
    phone = phoneOrParams;
    text = messageText;
  } else {
    text = messageText;
  }

  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  const targetPhone = cleanPhone
    ? cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`
    : "";

  const encodedMessage = text ? encodeURIComponent(text) : "";

  let urlApp: string;
  let urlWeb: string;

  if (targetPhone) {
    urlApp = `whatsapp://send?phone=${targetPhone}${encodedMessage ? `&text=${encodedMessage}` : ""}`;
    urlWeb = `https://web.whatsapp.com/send?phone=${targetPhone}${encodedMessage ? `&text=${encodedMessage}` : ""}`;
  } else {
    urlApp = `whatsapp://send?text=${encodedMessage}`;
    urlWeb = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  if (isMobile) {
    // Em dispositivos móveis, URL scheme direto para disparar o aplicativo do WhatsApp
    // Ex: whatsapp://send?phone=5511999999999&text=...
    window.location.href = urlApp;

    // Fallback se por acaso o app não responder após 1.2s
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        const fallbackUrl = targetPhone
          ? `https://api.whatsapp.com/send?phone=${targetPhone}${encodedMessage ? `&text=${encodedMessage}` : ""}`
          : `https://api.whatsapp.com/send?text=${encodedMessage}`;
        window.location.href = fallbackUrl;
      }
    }, 1200);
  } else {
    // Em desktop, web.whatsapp.com ou wa.me/api
    window.open(urlWeb, "_blank", "noopener,noreferrer");
  }
}
