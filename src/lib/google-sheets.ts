//src/lib/google-sheets.ts
import { google } from 'googleapis';


// Parse private key - handles various formats from env vars
function parsePrivateKey(key: string | undefined): string {
  if (!key) return '';

  // Replace literal \n with actual newlines
  let parsed = key.replace(/\\n/g, '\n');

  // Also handle double-escaped newlines
  parsed = parsed.replace(/\\\\n/g, '\n');

  return parsed;
}

// Initialize Google Sheets client
async function getGoogleSheetsClient() {
  const privateKey = parsePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // Keep compatibility just in case by relying on implicit JWT loading, or forcing authorize() if getClient doesn't exist.
  // Wait, Sheets API expects an auth client. The JWT object IS an auth client.
  const client = auth;
  const sheets = google.sheets({ version: 'v4', auth: client as any });

  return sheets;
}

// ✅ MODIFICATION: Accept three individual arguments
export async function appendExpenseToSheet(
  amount: number,
  category: string,
  purchaseType: string
) {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not defined');
    }

    const values = [[amount, category, purchaseType]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transactions!C:E', // This range is correct, it appends to the next free row
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });



    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange,
    };
  } catch (error) {
    console.error('❌ Error in appendExpenseToSheet:', error);
    throw error;
  }
}

/**
 * Fetches all expense data from the Google Sheet
 * Reads columns C:I (Amount, Category, Mood, TimeOfDay, DayOfWeek, WeekNumber, Date)
 * Starting from row 5 (skipping headers)
 */
export async function fetchLiveSheetData(): Promise<string[][]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not defined');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transactions!C5:I',
    });

    return response.data.values || [];
  } catch (error) {
    console.error('❌ Error fetching live sheet data:', error);
    throw error;
  }
}