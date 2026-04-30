import {
  fetchContentPipeline,
  fetchEmailCampaigns,
  fetchRedditPostings,
  fetchTaskRequests,
  fetchUnifyProspects,
} from "@/lib/airtable";

export const dynamic = "force-dynamic";

function recordsFrom(response) {
  return Array.isArray(response?.records) ? response.records : [];
}

function numberField(fields, key) {
  const value = Number(fields?.[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function statusIs(fields, value) {
  return String(fields?.Status ?? "").toLowerCase() === value.toLowerCase();
}

function statusIn(fields, values) {
  const status = String(fields?.Status ?? "").toLowerCase();
  return values.some((value) => status === value.toLowerCase());
}

function buildChannelMix(redditTotal, emailsPrepared, unifyProspects) {
  const total = redditTotal + emailsPrepared + unifyProspects;
  if (!total) {
    return [
      { name: "Reddit", value: 0, color: "#dc2626" },
      { name: "Email", value: 0, color: "#0f766e" },
      { name: "Unify", value: 0, color: "#2563eb" },
    ];
  }

  return [
    { name: "Reddit", value: Math.round((redditTotal / total) * 100), color: "#dc2626" },
    { name: "Email", value: Math.round((emailsPrepared / total) * 100), color: "#0f766e" },
    { name: "Unify", value: Math.round((unifyProspects / total) * 100), color: "#2563eb" },
  ];
}

function buildWeeklyActivity(redditRecords, emailRecords, unifyRecords) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const buckets = days.map((name) => ({ name, reddit: 0, email: 0, unify: 0 }));

  redditRecords.forEach((record, index) => {
    buckets[index % buckets.length].reddit += 1;
  });
  emailRecords.forEach((record, index) => {
    buckets[index % buckets.length].email += numberField(record.fields, "Emails_Prepared");
  });
  unifyRecords.forEach((record, index) => {
    buckets[index % buckets.length].unify += 1;
  });

  return buckets;
}

export async function GET() {
  const [redditResponse, emailResponse, unifyResponse, contentResponse, requestsResponse] =
    await Promise.all([
      fetchRedditPostings(),
      fetchEmailCampaigns(),
      fetchUnifyProspects(),
      fetchContentPipeline(),
      fetchTaskRequests(),
    ]);

  const redditRecords = recordsFrom(redditResponse);
  const emailRecords = recordsFrom(emailResponse);
  const unifyRecords = recordsFrom(unifyResponse);
  const contentRecords = recordsFrom(contentResponse);
  const requestRecords = recordsFrom(requestsResponse);

  const redditTotal = redditRecords.length;
  const redditPosted = redditRecords.filter((record) => statusIs(record.fields, "Posted")).length;
  const redditQueued = redditRecords.filter((record) =>
    statusIn(record.fields, ["Draft", "Scheduled", "Needs Revision"]),
  ).length;
  const redditDrafted = redditRecords.filter((record) =>
    statusIn(record.fields, ["Draft", "Scheduled", "Posted", "Needs Revision"]),
  ).length;

  const emailsPrepared = emailRecords.reduce(
    (total, record) => total + numberField(record.fields, "Emails_Prepared"),
    0,
  );
  const activeEmailSequences = emailRecords.filter((record) =>
    statusIn(record.fields, ["Drafting", "Ready", "Sending"]),
  ).length;

  const unifyProspects = unifyRecords.length;
  const unifyReady = unifyRecords.filter((record) =>
    statusIn(record.fields, ["Ready for Outreach", "Contacted"]),
  ).length;

  return Response.json({
    stats: {
      redditTotal,
      redditPosted,
      redditQueued,
      emailsPrepared,
      activeEmailSequences,
      unifyProspects,
      unifyReady,
      checklist: [
        { label: "Reddit posts drafted", done: redditDrafted, total: Math.max(redditTotal, 1) },
        { label: "Reddit posts published", done: redditPosted, total: Math.max(redditTotal, 1) },
        {
          label: "Email sequences prepared",
          done: activeEmailSequences,
          total: Math.max(emailRecords.length, 1),
        },
        { label: "Unify lists cleaned", done: unifyReady, total: Math.max(unifyProspects, 1) },
      ],
      channelMix: buildChannelMix(redditTotal, emailsPrepared, unifyProspects),
      weeklyActivity: buildWeeklyActivity(redditRecords, emailRecords, unifyRecords),
    },
    contentItems: contentRecords.map((record) => ({
      id: record.id,
      itemName: record.fields.Item_Name ?? "Untitled item",
      type: record.fields.Type ?? "Content",
      status: record.fields.Status ?? "Pending Review",
      link: record.fields.Link_to_Draft ?? "https://airtable.com",
      feedback: record.fields.Client_Feedback ?? "",
    })),
    requests: requestRecords.map((record) => ({
      id: record.id,
      title: record.fields.Task_Title ?? "Untitled request",
      description: record.fields.Description ?? "",
      status: record.fields.Status ?? "To-Do",
      priority: record.fields.Priority ?? "Medium",
    })),
  });
}
