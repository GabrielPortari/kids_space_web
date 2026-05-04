import { useAttendance } from "../hooks/useAttendance";
import { useWorkspaceContext } from "../WorkspaceContext";
import { Pagination } from "../components/Pagination";
import { extractId, formatTimestamp } from "../formatter";
import type { ListItem } from "../types";

export function AttendanceSection() {
  const { page, setPage, search, setSearch } = useWorkspaceContext();

  const { pagedCollection, onDeleteAttendance } = useAttendance();

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(pagedCollection.length / PAGE_SIZE) || 1;

  return (
    <>
      <section className="crm-panel">
        <h2>Presenca</h2>

        <div className="crm-panel-head">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou ID"
          />
        </div>

        <div className="crm-table">
          {pagedCollection.map((item) => {
            const typed = item as ListItem;
            const id = extractId(typed);

            return (
              <article key={id || JSON.stringify(item)} className="crm-row">
                <div>
                  <strong>
                    {(typed as any).childName || "Crianca sem nome"}
                  </strong>
                  <p>
                    {(typed as any).checkinTime &&
                      "Entrada: " + formatTimestamp((typed as any).checkinTime)}
                  </p>
                  <p>
                    {(typed as any).checkoutTime &&
                      "Saida: " + formatTimestamp((typed as any).checkoutTime)}
                  </p>
                </div>
                <div className="crm-row-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (!id) return;
                      onDeleteAttendance(id);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })}

          {pagedCollection.length === 0 && (
            <p>
              Nenhum registro de presenca encontrado para a busca informada.
            </p>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}
