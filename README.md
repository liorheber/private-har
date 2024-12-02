# HAR Privacy Scrubber

## Overview
A client-side web application that allows users to upload and scrub sensitive information from HTTP Archive (HAR) files using Chrome's Local AI model. Built with Next.js and TypeScript, it leverages Web Workers and local AI processing to ensure your data never leaves your machine.

## Key Benefits
- **Complete Privacy**: All processing happens locally on your machine, ensuring your sensitive data stays with you
- **Intelligent Scrubbing**: Uses AI to identify sensitive data beyond predefined patterns
- **Enhanced Security**: No data transmission to external servers means zero risk of data interception
- **Smart Detection**: Contextually understands what should be scrubbed for comprehensive protection

## Features
- 100% Client-Side Processing
- Chrome Local AI Integration
- Privacy-First Design
- Sensitive Data Redaction
- Easy HAR File Upload
- Instant Scrubbing
- Web Worker-based Processing
- Progress Indication
- Smart Content Type Detection
- JSON Schema Analysis
- Detailed Entry Summaries

## Technical Details

### AI-Powered Detection
The application uses Chrome's Local AI model to:
- Identify context-sensitive information
- Provide intelligent pattern recognition
- Enhance detection accuracy
- Ensure comprehensive data protection

### Sensitive Data Detection
The scrubber identifies and redacts:
- Email addresses
- Credit card numbers
- Social Security numbers (SSN)
- API keys and tokens
- Passwords
- Authorization headers
- Session information
- Cookies
- Custom sensitive fields
- Context-aware sensitive data (AI-detected)

### Content Processing
Handles various content types including:
- application/json
- application/ld+json
- application/x-www-form-urlencoded
- text/html
- text/xml
- application/xml

### Smart Processing Pipeline
1. Content type analysis
2. Size validation
3. Schema generation for JSON content
4. AI-powered sensitive field identification
5. Data scrubbing
6. Entry summarization

## How It Works
1. Upload a HAR file through the web interface
2. The file is processed locally in a Web Worker
3. Chrome's Local AI model analyzes content for sensitive data
4. Sensitive data is automatically identified and scrubbed
5. Progress is shown in real-time
6. Download the sanitized HAR file

## Development
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Privacy Commitment
No files are uploaded to external servers. All processing happens in your browser using Web Workers and Chrome's Local AI model for optimal performance and privacy. The application is designed with a privacy-first approach, ensuring your sensitive data never leaves your device.

## Technical Requirements
- Modern web browser with Web Workers support
- Chrome browser for Local AI capabilities
- JavaScript enabled
- Sufficient browser memory for processing large HAR files
