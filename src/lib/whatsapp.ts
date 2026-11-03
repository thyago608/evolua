import { onlyDigits } from "./validation";

/**
 * Monta a URL pública do formulário para um token de convite.
 */
export function buildSurveyUrl(token: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/s/${token}`;
}

/**
 * Mensagem padrão enviada ao paciente junto do link.
 */
export function buildInviteMessage(patientName: string, url: string): string {
  const firstName = patientName.split(" ")[0];
  return `Olá, ${firstName}! Por favor, responda nossa pesquisa de acompanhamento: ${url}`;
}

/**
 * Link wa.me para envio manual pelo WhatsApp (Fase 1).
 * phone deve estar em E.164 (+55...).
 */
export function buildWhatsAppLink(phoneE164: string, message: string): string {
  const phone = onlyDigits(phoneE164);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Envio ativo via Twilio (Fase 2). Env-gated: sem credenciais retorna
 * { sent: false } para que o fluxo caia no envio manual sem quebrar.
 *
 * A implementação real do Twilio é adicionada na Fase 2.
 */
export async function sendWhatsApp(
  _phoneE164: string,
  _message: string
): Promise<{ sent: boolean; reason?: string }> {
  const configured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM;
  if (!configured) {
    return { sent: false, reason: "twilio_not_configured" };
  }
  // Fase 2: integração Twilio aqui.
  return { sent: false, reason: "not_implemented" };
}
