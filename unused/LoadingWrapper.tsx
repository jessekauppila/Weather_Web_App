interface LoadingWrapperProps {
  isComponentVisible: boolean;
  isLoading: boolean;
  isPending: boolean;
  children: React.ReactNode;
}

export function LoadingWrapper({
  isComponentVisible,
  isLoading,
  isPending,
  children
}: LoadingWrapperProps) {
  return (
    <div 
      className={`w-full max-w-6xl space-y-4 transition-opacity duration-200 ${
        isComponentVisible && !isLoading && !isPending 
          ? 'opacity-100' 
          : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
} 