import Fastify from "fastify";
import cors from "@fastify/cors";
import { Resend } from "resend";

const app = Fastify({ logger: true });
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

await app.register(cors, {
  origin: true,
});

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

app.get("/", async () => ({
  service: "kursun-api",
  status: "ok",
}));

app.get("/api/health", async () => ({ status: "ok" }));

app.post<{ Body: ContactBody }>("/api/contact", async (request, reply) => {
  const { name, email, subject, message } = request.body || {};

  if (!name || !email || !subject || !message) {
    return reply.status(400).send({
      success: false,
      message: "Missing required fields: name, email, subject, message.",
    });
  }

  const contactEmailTo = process.env.CONTACT_EMAIL_TO || "contact@kursuntech.com";
  const contactEmailFrom =
    process.env.CONTACT_EMAIL_FROM ||
    "Kursun Contact <onboarding@resend.dev>";

  if (!resend) {
    app.log.warn("RESEND_API_KEY not set; contact form emails are disabled");
    return reply.status(503).send({
      success: false,
      message: "Email service is not configured. Please try again later.",
    });
  }

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <pre style="white-space: pre-wrap; font-family: sans-serif;">${escapeHtml(message)}</pre>
  `;

  const { data, error } = await resend.emails.send({
    from: contactEmailFrom,
    to: [contactEmailTo],
    replyTo: [email],
    subject: `[Kursun Contact] ${escapeHtml(subject)}`,
    html,
  });

  if (error) {
    app.log.error({ err: error }, "Failed to send contact email");
    return reply.status(500).send({
      success: false,
      message: "Unable to send message. Please try again later.",
    });
  }

  app.log.info({ id: data?.id, email }, "Contact form email sent");
  return reply.status(200).send({
    success: true,
    message: "Message received. We will respond within 1–2 business days.",
  });
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const port = parseInt(process.env.PORT || "3001", 10);

app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`API running at http://localhost:${port}`);
});
