import { updateTaskRequest } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["To-Do", "In Progress", "Delivered"]);
const allowedPriorities = new Set(["Low", "Medium", "High"]);

export async function PATCH(request, { params }) {
  const body = await request.json();
  const fields = {};

  if (typeof body.title === "string") fields.Task_Title = body.title;
  if (typeof body.description === "string") fields.Description = body.description;
  if (typeof body.priority === "string" && allowedPriorities.has(body.priority)) {
    fields.Priority = body.priority;
  }
  if (typeof body.status === "string" && allowedStatuses.has(body.status)) {
    fields.Status = body.status;
  }

  if (!Object.keys(fields).length) {
    return Response.json({ error: "No valid fields provided." }, { status: 400 });
  }

  const response = await updateTaskRequest(params.id, fields);
  const record = response.records?.[0];

  return Response.json({
    request: {
      id: record.id,
      title: record.fields.Task_Title ?? "",
      description: record.fields.Description ?? "",
      status: record.fields.Status ?? "To-Do",
      priority: record.fields.Priority ?? "Medium",
    },
  });
}
