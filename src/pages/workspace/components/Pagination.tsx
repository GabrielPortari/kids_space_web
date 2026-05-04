type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="crm-pagination">
      <button
        type="button"
        className="btn outline"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        Anterior
      </button>
      <span>
        Pagina {page} de {totalPages}
      </span>
      <button
        type="button"
        className="btn outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        Proxima
      </button>
    </div>
  );
}
