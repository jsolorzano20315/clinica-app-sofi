import axios from 'axios'


const API = import.meta.env.VITE_API_URL

export const enviarWhatsAppAPI = async (
  telefono: string,
  mensaje: string
) => {
  const response = await axios.post(`${API}/whatsapp/enviar`, {
    telefono,
    mensaje
  })

  return response.data
}
