import './globals.css';

export const metadata = {
  title: 'HAR Privacy Scrubber',
  description: 'Client-side HAR file privacy protection tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
