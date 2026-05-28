import { useQuery } from "@tanstack/react-query";
import { listAdmins } from "../../../api/modules/adminApi";

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};

export function useAdmins(
  page = 1,
  perPage = 20,
  filters: { name?: string; email?: string; active?: boolean } = {},
) {
  return useQuery({
    queryKey: ["master", "admins", page, perPage, filters],
    queryFn: async (): Promise<PaginatedResult<any>> => {
      const all = await listAdmins(filters);
      const total = all.length;
      const start = (page - 1) * perPage;
      const items = all.slice(start, start + perPage);
      return { items, total, page, perPage };
    },
  });
}
