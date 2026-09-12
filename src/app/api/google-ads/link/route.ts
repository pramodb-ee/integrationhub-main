import { NextResponse } from 'next/server';

/** Local demo contract. No request is sent to Google Ads. */
export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input || !['account', 'campaign', 'form'].every((key) => typeof input[key] === 'string' && input[key].trim())) {
      return NextResponse.json({ linked: false, message: 'Select an Ads account, campaign and lead form.' }, { status: 400 });
    }
    return NextResponse.json({
      linked: true,
      demo: true,
      message: 'Webhook linked successfully (demo).',
      webhookUrl: 'https://crm.example.com/webhooks/google-ads',
      samplePayload: {
        lead_id: `demo-${crypto.randomUUID()}`,
        user_column_data: [
          { column_id: 'FULL_NAME', column_name: 'Full Name', string_value: 'Rahul Sharma' },
          { column_id: 'EMAIL', column_name: 'Email', string_value: 'rahul.sharma@example.com' },
          { column_id: 'PHONE_NUMBER', column_name: 'Phone Number', string_value: '+919876543210' },
        ],
        api_version: '1.0',
        form_id: 123456789,
        campaign_id: 987654321,
        google_key: 'demo_google_ads_webhook_key',
        is_test: true,
        lead_submit_time: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ linked: false, message: 'Invalid JSON request.' }, { status: 400 });
  }
}
