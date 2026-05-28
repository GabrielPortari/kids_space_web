import { useQuery } from "@tanstack/react-query";
import {
  listAdmins,
  listCollaboratorsAdmin,
  listParentsAdmin,
  listChildrenAdmin,
  listAttendancesAdmin,
} from "../../../api/modules/adminApi";
import { listCompanies } from "../../../api/modules/companyApi";

export function useMasterOverview() {
  const adminsQ = useQuery({
    queryKey: ["master", "admins", "list"],
    queryFn: () => listAdmins(),
  });
  const companiesQ = useQuery({
    queryKey: ["master", "companies", "list"],
    queryFn: () => listCompanies(),
  });
  const collaboratorsQ = useQuery({
    queryKey: ["master", "collaborators", "list"],
    queryFn: () => listCollaboratorsAdmin(),
  });
  const parentsQ = useQuery({
    queryKey: ["master", "parents", "list"],
    queryFn: () => listParentsAdmin(),
  });
  const childrenQ = useQuery({
    queryKey: ["master", "children", "list"],
    queryFn: () => listChildrenAdmin(),
  });
  const attendancesQ = useQuery({
    queryKey: ["master", "attendances", "list"],
    queryFn: () => listAttendancesAdmin(),
  });

  const counts = {
    admins: adminsQ.data?.length ?? 0,
    companies: companiesQ.data?.length ?? 0,
    collaborators: collaboratorsQ.data?.length ?? 0,
    parents: parentsQ.data?.length ?? 0,
    children: childrenQ.data?.length ?? 0,
    attendances: attendancesQ.data?.length ?? 0,
  };

  const isLoading =
    adminsQ.isLoading ||
    companiesQ.isLoading ||
    collaboratorsQ.isLoading ||
    parentsQ.isLoading ||
    childrenQ.isLoading ||
    attendancesQ.isLoading;

  const isError =
    adminsQ.isError ||
    companiesQ.isError ||
    collaboratorsQ.isError ||
    parentsQ.isError ||
    childrenQ.isError ||
    attendancesQ.isError;

  return {
    counts,
    isLoading,
    isError,
    refetch: () => {
      adminsQ.refetch();
      companiesQ.refetch();
      collaboratorsQ.refetch();
      parentsQ.refetch();
      childrenQ.refetch();
      attendancesQ.refetch();
    },
  };
}
