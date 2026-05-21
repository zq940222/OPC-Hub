import { acceptApplication, rejectApplication } from "@/actions/applications";

type ApplicationListProps = {
  applications: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: Date;
    applicant: { id: string; name: string | null; email: string | null; phone: string | null };
  }>;
};

export function ApplicationList({ applications }: ApplicationListProps) {
  async function acceptAction(formData: FormData) {
    "use server";
    await acceptApplication(String(formData.get("applicationId") ?? ""));
  }

  async function rejectAction(formData: FormData) {
    "use server";
    await rejectApplication(String(formData.get("applicationId") ?? ""));
  }

  if (applications.length === 0) {
    return <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No applications yet.</div>;
  }

  return (
    <div className="grid gap-3">
      {applications.map((application) => (
        <article key={application.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-slate-950">{application.applicant.name ?? application.applicant.email ?? application.applicant.phone ?? "OPC"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{application.reason}</p>
              <p className="mt-2 text-xs text-slate-500">
                {application.status} / {application.createdAt.toLocaleDateString("zh-CN")}
              </p>
            </div>
            {application.status === "PENDING" ? (
              <div className="flex gap-2">
                <form action={acceptAction}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <button className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Accept</button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="applicationId" value={application.id} />
                  <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Reject</button>
                </form>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
