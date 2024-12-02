interface ErrorDisplayProps {
  message: string | null;
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  if (!message) return null;
  
  return (
    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
      {message}
    </div>
  );
}
