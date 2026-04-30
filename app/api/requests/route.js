import { createTaskRequest } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();

  if (!title) {
    return Response.json({ error: "Task title is required." }, { status: 400 });
  }

  const response = await createTaskRequest({
    title,
    description: String(body.description ?? ""),
    priority: String(body.priority ?? "Medium"),
  });
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
