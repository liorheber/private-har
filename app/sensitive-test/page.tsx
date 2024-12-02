'use client';

import { useState } from 'react';

export default function SensitiveTestPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const makePostRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sensitive-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiw...',
          'X-API-Key': 'pk_live_abcdef1234567890',
          'Cookie': 'session=abc123def456; auth=xyz789; token=jwt_token_here',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify({
          user: {
            // Personal Information
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            password: 'MyUltraSecurePass123!',
            ssn: '987-65-4321',
            dob: '1990-08-21',
            phone: '+1 (555) 987-6543',
            address: {
              street: '456 Oak Avenue',
              unit: 'Apt 4B',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              country: 'USA'
            },
            
            // Financial Information
            payment: {
              creditCard: {
                number: '5555-5555-5555-4444',
                cvv: '789',
                expiryDate: '03/25',
                cardholderName: 'JANE SMITH'
              },
              bankAccount: {
                accountNumber: '1234567890',
                routingNumber: '021000021',
                bankName: 'Bank of America',
                accountType: 'checking'
              },
              paypal: {
                email: 'jane.smith@example.com',
                merchantId: 'PAYPAL-MERCH-ID-123'
              }
            },

            // Healthcare Information
            health: {
              insuranceProvider: 'Blue Cross Blue Shield',
              policyNumber: 'BCBS123456789',
              groupNumber: 'GRP987654321',
              medications: ['Lisinopril', 'Metformin'],
              allergies: ['Penicillin']
            }
          },
          
          // Public/Non-Sensitive Data
          deviceInfo: {
            platform: 'macOS',
            browser: 'Chrome',
            version: '118.0.0',
            screenResolution: '2560x1440',
            colorDepth: 24,
            timezone: 'America/Los_Angeles',
            language: 'en-US'
          },
          
          preferences: {
            theme: 'dark',
            fontSize: 'medium',
            notifications: {
              email: true,
              push: false,
              sms: true
            },
            accessibility: {
              highContrast: false,
              screenReader: false,
              reducedMotion: true
            }
          },
          
          analytics: {
            source: 'direct',
            medium: 'web',
            campaign: 'spring_2023',
            feature: 'dashboard',
            interaction: 'button_click'
          }
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const makeGetRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sensitive-data', {
        headers: {
          'X-API-Key': 'private_key_12345',
          'Authorization': 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=', // base64 encoded username:password
          'Session-Token': 'sess_12345abcde67890fghijk',
          'Client-Secret': 'cs_live_abcdefghijklmnopqrstuvwxyz',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        }
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Sensitive Data Test Page</h1>
          
          <div className="space-y-4">
            <div className="space-x-4">
              <button
                onClick={makePostRequest}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Make POST Request with PII Data
              </button>
              
              <button
                onClick={makeGetRequest}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Make GET Request with Auth Data
              </button>
            </div>

            {loading && (
              <div className="text-gray-600">Loading...</div>
            )}

            {response && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Response:</h2>
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
