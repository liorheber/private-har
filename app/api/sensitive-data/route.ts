import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  
  // Log received data (this will appear in HAR with sensitive info)
  console.log('Received data:', data);

  // Return a response with mixed sensitive and public data
  return NextResponse.json({
    status: 'success',
    user: {
      // Personal Information
      name: 'John Doe',
      email: 'john.doe@example.com',
      ssn: '123-45-6789',
      dob: '1985-04-15',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      
      // Financial Information
      creditCard: {
        number: '4111-1111-1111-1111',
        cvv: '123',
        expiryDate: '12/25',
        cardholderName: 'JOHN DOE'
      },
      bankAccount: {
        accountNumber: '9876543210',
        routingNumber: '021000021',
        bankName: 'Chase Bank'
      },
      
      // Authentication Data
      password: 'SuperSecretPass123!',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      
      // Healthcare Data
      medicalRecordNumber: 'MRN123456789',
      insuranceNumber: 'INS987654321',
      bloodType: 'O+',
    },
    
    // Public/Non-Sensitive Data
    regularData: {
      // System Information
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substring(7),
      environment: 'production',
      version: '2.1.0',
      
      // Application Data
      preferences: {
        theme: 'dark',
        language: 'en-US',
        timezone: 'America/Los_Angeles',
        notifications: {
          email: true,
          push: false,
          sms: true
        }
      },
      
      // Public Business Data
      subscription: {
        plan: 'premium',
        features: ['analytics', 'api_access', 'support'],
        startDate: '2023-01-01',
        billingCycle: 'monthly'
      },
      
      // Public Metrics
      metrics: {
        lastLogin: '2023-11-14T12:00:00Z',
        loginCount: 42,
        accountAge: 365,
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS'
      }
    }
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'API is working',
    // Sensitive Data
    authentication: {
      apiKey: 'sk_live_51ABCDEfghijklmno',
      privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC9QFbj...',
      clientSecret: '8a7b9c6d5e4f3g2h1i0j',
      bearerToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiw...',
      refreshToken: 'rt_1234567890abcdefghijklmnopqrstuvwxyz'
    },
    credentials: {
      username: 'admin',
      password: 'P@ssw0rd123!',
      databaseUrl: 'postgresql://user:pass@localhost:5432/mydb'
    },
    
    // Public Data
    publicData: {
      // API Information
      version: '1.0.0',
      environment: 'production',
      region: 'us-west-2',
      status: 'healthy',
      
      // Service Information
      service: {
        name: 'data-processor',
        uptime: '99.99%',
        lastDeployment: '2023-11-14T00:00:00Z',
        features: ['data-processing', 'analytics', 'reporting'],
        endpoints: ['/api/v1/process', '/api/v1/analyze', '/api/v1/report']
      },
      
      // System Status
      system: {
        cpu: '45%',
        memory: '2.1GB/8GB',
        storage: '123GB/512GB',
        network: {
          incoming: '1.2MB/s',
          outgoing: '0.8MB/s',
          connections: 1250
        }
      },
      
      // Documentation
      docs: {
        apiDocs: 'https://api.example.com/docs',
        swagger: 'https://api.example.com/swagger',
        support: 'support@example.com'
      }
    }
  });
}
