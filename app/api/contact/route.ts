import { sendContactMessage } from "../../contact-service";

export async function POST(request: Request) {
  console.info("Contact form request started.");

  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return Response.json(
        { message: "Please submit the form again; its data could not be read." },
        { status: 400 }
      );
    }

    const result = await sendContactMessage(input);
    if (!result.ok) {
      return Response.json({ message: result.message }, { status: result.status });
    }

    return Response.json({ message: "Message sent." });
  } catch (error) {
    console.error("Contact form request failed unexpectedly:", error);
    return Response.json(
      { message: "Your message could not be sent. Please email hope@imagomarketing.com instead." },
      { status: 500 }
    );
  } finally {
    console.info("Contact form request finished.");
  }
}
