type ContactFields = {
  name: string;
  email: string;
  organization: string;
  message: string;
};

type ContactResult =
  | { ok: true }
  | {
      ok: false;
      status: 400 | 502 | 503;
      message: string;
    };

function validateContactFields(input: unknown):
  | { ok: true; fields: ContactFields }
  | { ok: false; message: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "Please enter your contact details and try again." };
  }

  const body = input as Record<string, unknown>;
  const fields: ContactFields = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim() : "",
    organization:
      typeof body.organization === "string" ? body.organization.trim() : "",
    message: typeof body.message === "string" ? body.message.trim() : ""
  };

  if (!fields.name || !fields.email || !fields.organization || !fields.message) {
    return { ok: false, message: "Please complete all fields before sending." };
  }
  if (
    fields.name.length > 100 ||
    fields.email.length > 254 ||
    fields.organization.length > 150 ||
    fields.message.length > 5000
  ) {
    return {
      ok: false,
      message: "One or more fields are too long. Please shorten your message and try again."
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  return { ok: true, fields };
}

export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const validation = validateContactFields(input);
  if (!validation.ok) {
    return { ok: false, status: 400, message: validation.message };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Contact form is unavailable because RESEND_API_KEY is not configured.");
    return {
      ok: false,
      status: 503,
      message: "The contact form is temporarily unavailable. Please email hope@imagomarketing.com."
    };
  }

  const { fields } = validation;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "IMAGO Marketing <hope@imagomarketing.com>",
        to: ["hope@imagomarketing.com"],
        reply_to: fields.email,
        subject: "New IMAGO Marketing website inquiry",
        text: [
          "A new message was sent through the IMAGO Marketing website.",
          "",
          `Name: ${fields.name}`,
          `Email: ${fields.email}`,
          `Organization: ${fields.organization}`,
          "",
          "What's changing?",
          fields.message
        ].join("\n")
      })
    });

    if (!response.ok) {
      console.error(`Resend rejected a contact message with status ${response.status}.`);
      return {
        ok: false,
        status: 502,
        message: "Your message could not be sent. Please email hope@imagomarketing.com instead."
      };
    }
  } catch (error) {
    console.error("Could not reach Resend to send a contact message:", error);
    return {
      ok: false,
      status: 502,
      message: "Your message could not be sent. Please email hope@imagomarketing.com instead."
    };
  }

  return { ok: true };
}
