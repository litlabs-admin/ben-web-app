import { updateContentItem } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["Pending Review", "Approved", "Needs Revision"]);

export async function PATCH(request, { params }) {
  const body = await request.json();
  const fields = {};

  if (typeof body.itemName === "string") fields.Item_Name = body.itemName;
  if (typeof body.type === "string") fields.Type = body.type;
  if (typeof body.link === "string") fields.Link_to_Draft = body.link;
  if (typeof body.feedback === "string") fields.Client_Feedback = body.feedback;
  if (typeof body.status === "string" && allowedStatuses.has(body.status)) {
    fields.Status = body.status;
  }

  if (!Object.keys(fields).length) {
    return Response.json({ error: "No valid fields provided." }, { status: 400 });
  }

  const response = await updateContentItem(params.id, fields);
  const record = response.records?.[0];

  return Response.json({
    item: {
      id: record.id,
      itemName: record.fields.Item_Name ?? "",
      type: record.fields.Type ?? "",
      status: record.fields.Status ?? "",
      link: record.fields.Link_to_Draft ?? "",
      feedback: record.fields.Client_Feedback ?? "",
    },
  });
}
