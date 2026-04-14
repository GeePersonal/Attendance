import { MetaData } from "../models/pagination";

interface Props {
  metaData: MetaData;
  onPageChange: (page: number) => void;
}

function AppPaginations({
  metaData: {
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasNext,
    hasPrevious,
  },
  onPageChange,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div aria-label="Page navigation" className="flex items-center justify-center space-x-2 bg-black/20 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-2xl shadow-xl">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          className={`flex items-center justify-center p-2 rounded-xl transition-all ${
            hasPrevious 
              ? "text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer" 
              : "text-neutral-600 cursor-not-allowed"
          }`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
            <path
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
        </button>

        {totalPages > 0 &&
          Array.from(Array(totalPages).keys()).map((page) => {
            const pageNum = page + 1;
            const isActive = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`flex items-center justify-center w-10 h-10 transition-all font-medium rounded-xl text-sm ${
                  isActive
                    ? "bg-white/20 text-white shadow-inner border border-white/20"
                    : "text-neutral-400 hover:bg-white/10 hover:text-white transparent"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className={`flex items-center justify-center p-2 rounded-xl transition-all ${
            hasNext 
              ? "text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer" 
              : "text-neutral-600 cursor-not-allowed"
          }`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
            <path
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
      
      <div className="text-sm text-neutral-500 font-light tracking-wide bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
        Showing <span className="font-medium text-neutral-300">{totalCount === 0 ? 0 : pageSize * (currentPage - 1) + 1}</span> to{" "}
        <span className="font-medium text-neutral-300">{Math.min(pageSize * currentPage, totalCount)}</span> of{" "}
        <span className="font-medium text-neutral-300">{totalCount}</span> {totalCount === 1 ? "entry" : "entries"}
      </div>
    </div>
  );
}
export default AppPaginations;
