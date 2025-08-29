import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Webhook de verificação do WhatsApp
app.get("/webhook", (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verify_token) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recebe mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log("📩 Mensagem recebida:", JSON.stringify(body, null, 2));

  try {
    if (body.entry && body.entry[0].changes[0].value.messages) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from;
      const text = msg.text.body;

      // 🔗 Chamada ao ChatGPT
      const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${process.env.OPENAI_API_KEY}
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: text }]
        })
      });
      const data = await gptRes.json();
      const reply = data.choices[0].message.content;

      // 🔗 Resposta no WhatsApp
      await fetch(https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${process.env.WHATSAPP_TOKEN}
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply }
        })
      });
    }
  } catch (err) {
    console.error("❌ Erro:", err);
  }

  res.sendStatus(200);
});

// Porta Render
app.listen(10000, () => console.log("🚀 Webhook rodando na porta 10000"));
