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
          className="text-blue-500 hover:text-blue-700 underline text-sm inline-flex items-center gap-1"
        >
          Open Test Page with Sensitive Data
          <svg 
            className="w-3.5 h-3.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </footer>
  );
}
