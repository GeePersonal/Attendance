interface Props {
  errors: string[];
}

function ValidationError({ errors }: Props) {
  return (
    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-xl mb-4 p-4 mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-400 mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-sm text-red-400/80 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
export default ValidationError;
