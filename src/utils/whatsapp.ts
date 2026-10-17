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
    // Em dispositivos móveis com WhatsApp instalado, o scheme whatsapp:// abre direto o app nativo
    // Se targetPhone existir: whatsapp://send?phone=...&text=...
    // Se não existir (compartilhar): whatsapp://send?text=...
    // Criamos um link oculto e clicamos ou usamos window.location para o SO chamar o app instalado imediatamente
    const a = document.createElement("a");
    a.href = urlApp;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 500);
  } else {
    // Em desktop, abre o WhatsApp Web diretamente
    window.open(urlWeb, "_blank", "noopener,noreferrer");
  }
}
