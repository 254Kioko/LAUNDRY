// CommonJS for broad Netlify compatibility
const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body || "{}");
    if (!data.name || !data.phone || !data.clothes || !data.quantity) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    // Fix multiline private_key
    if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const ticket = Math.random().toString(36).slice(2, 8).toUpperCase();
    const date = data.date || new Date().toISOString().slice(0, 10);
    const status = "Received";

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          ticket,
          data.name,
          data.phone,
          data.email || "",
          data.clothes,
          Number(data.quantity) || 1,
          date,
          data.notes || "",
          status
        ]],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, ticket }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
};
