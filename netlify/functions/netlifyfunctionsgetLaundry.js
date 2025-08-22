const { google } = require("googleapis");

exports.handler = async (event, context) => {
  try {
    // Require Netlify Identity JWT
    if (!context.clientContext || !context.clientContext.user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A2:I", // skip header row
    });

    const rows = resp.data.values || [];
    const formatted = rows.map(r => ({
      Ticket:   r[0] || "",
      Name:     r[1] || "",
      Phone:    r[2] || "",
      Email:    r[3] || "",
      Clothes:  r[4] || "",
      Quantity: r[5] || "",
      Date:     r[6] || "",
      Notes:    r[7] || "",
      Status:   r[8] || ""
    }));

    return { statusCode: 200, body: JSON.stringify(formatted) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
};
