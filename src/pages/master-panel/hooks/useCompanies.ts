import { useQuery } from "@tanstack/react-query";
import { listCompanies } from "../../../api/modules/companyApi";

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};

export function useCompanies(
  page = 1,
  perPage = 20,
  filters: { name?: string } = {},
) {
  return useQuery({
    queryKey: ["master", "companies", page, perPage, filters],
    queryFn: async (): Promise<PaginatedResult<any>> => {
      const all = await listCompanies();
      const filtered = filters.name
        ? all.filter((c: any) =>
            String(c.name || "")
              .toLowerCase()
              .includes(filters.name!.toLowerCase()),
          )
        : all;

      const total = filtered.length;
      const start = (page - 1) * perPage;
      const items = filtered.slice(start, start + perPage);
      return { items, total, page, perPage };
    },
  });
}
