import type { Evento } from '@/interfaces/Evento'


export const generarMensajeWhatsApp = (
  evento: Evento,
  fecha: string
): string => {
  return `
🏥 Recordatorio de cita

Hola ${evento.nombreCompleto} 👋

Le recordamos su cita médica:

📅 Fecha: ${fecha}
🩺 Tipo: ${evento.tipo}

Por favor confirme su asistencia.

Gracias.
${evento.clinica ?? 'Clínica'}
  `.trim()
}