import GitHubButton from './GitHubButton';

interface FooterProps {
}

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t py-6 bg-white">
      <div className="text-center">
        <a 
          href="/sensitive-test" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline text-sm"
        >
          Open Test Page with Sensitive Data
        </a>
      </div>
    </footer>
  );
}
