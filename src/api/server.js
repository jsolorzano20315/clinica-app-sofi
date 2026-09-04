import express from 'express'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.PHONE_NUMBER_ID

// =====================
// 📲 ENVIAR WHATSAPP
// =====================
app.post('/send-whatsapp', async (req, res) => {
  const { telefono, mensaje } = req.body

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: telefono,
        type: "text",
        text: {
          body: mensaje
        }
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    )

    res.json(response.data)

  } catch (error: any) {
    console.error(error.response?.data || error.message)
    res.status(500).json(error.response?.data || { error: "Error enviando mensaje" })
  }
})

app.listen(process.env.PORT, () => {
  console.log("Servidor corriendo en puerto " + process.env.PORT)
})