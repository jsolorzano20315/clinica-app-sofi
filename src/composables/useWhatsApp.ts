
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const useWhatsApp = () => {

  const formatearTelefono = (tel: string) =>
    tel.replace(/\D/g, '')

  const formatearFecha = (fecha: string) => {

    const f = new Date(fecha)

    const dia = String(f.getDate()).padStart(2, '0')
    const mes = String(f.getMonth() + 1).padStart(2, '0')
    const anio = f.getFullYear()

    return `${dia}/${mes}/${anio}`
  }

  const generarMensajeWhatsApp = (evento: any, fecha: string) => {

    return `Recordatorio de cita. Hola ${evento.nombreCompleto},
    le recordamos su cita el día ${formatearFecha(fecha)},
    para ${evento.tipo}.`
  }

  const enviarWhatsApp = (evento: any, fecha: string) => {

    if (!evento.telefono) return

    const telefono = formatearTelefono(evento.telefono)

    const url =
      `https://wa.me/${telefono}?text=${encodeURIComponent(
        generarMensajeWhatsApp(evento, fecha)
      )}`

    window.open(url, '_blank')
  }

  const enviarWhatsAppBackend = async (
    evento: any,
    fecha: string
  ) => {

    if (!evento.telefono) return

    await axios.post(
      `${API_URL}/WhatsApp/EnviarWhatsApp`,
      {
        telefono: formatearTelefono(evento.telefono),
        mensaje: generarMensajeWhatsApp(evento, fecha)
      }
    )
  }

  return {
    enviarWhatsApp,
    enviarWhatsAppBackend,
    generarMensajeWhatsApp,
    formatearTelefono
  }
}

