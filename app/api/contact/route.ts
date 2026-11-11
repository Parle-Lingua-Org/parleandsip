import { Resend } from "resend";

const inbox = process.env.CONTACT_INBOX_EMAIL?.trim() || "Parlelinguaservices@gmail.com";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || name.length > 80) return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!subject || subject.length > 120) return Response.json({ error: "Please enter a subject." }, { status: 400 });
  if (!message || message.length > 4000) return Response.json({ error: "Please enter your message." }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return Response.json({ error: "Contact email is not configured on the server." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [inbox],
    replyTo: email,
    subject: `[Parle & Sip] ${subject}`,
    html: `<div style="max-width:620px;margin:0 auto;padding:24px;background:#f5f6f8;color:#192637;font-family:Arial,sans-serif">
      <header style="padding:18px;background:#192637;color:#fff">
        <p style="margin:0;color:#be8f3f;font-size:11px;letter-spacing:2px">PARLE & SIP</p>
        <h1 style="margin:10px 0 0;font-size:22px">New feedback / inquiry</h1>
      </header>
      <p style="margin:22px 0 8px;font-size:14px"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="margin:0 0 8px;font-size:14px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <div style="margin:18px 0;padding:16px;background:#fff;border:2px solid #192637;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(message)}</div>
      <p style="margin:0;color:#526173;font-size:12px">Reply directly to this email to answer ${escapeHtml(name)}.</p>
    </div>`,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
