import {
  fetchContentPipeline,
  fetchDealPipeline,
  fetchEmailCampaigns,
  fetchLeadActivity,
  fetchMeetings,
  fetchRedditPostings,
  fetchTaskRequests,
  fetchUnifyProspects,
  fetchWebsiteAnalytics,
} from "@/lib/airtable";

export const dynamic = "force-dynamic";

function recordsFrom(response) {
  return Array.isArray(response?.records) ? response.records : [];
}

function numberField(fields, key) {
  const value = Number(fields?.[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function firstNumberField(fields, keys) {
  for (const key of keys) {
    const value = Number(fields?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function firstTextField(fields, keys, fallback = "") {
  for (const key of keys) {
    const value = fields?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function averageField(records, keys) {
  const values = records
    .map((record) => firstNumberField(record.fields, keys))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function statusIs(fields, value) {
  return String(fields?.Status ?? "").toLowerCase() === value.toLowerCase();
}

function statusIn(fields, values) {
  const status = String(fields?.Status ?? "").toLowerCase();
  return values.some((value) => status === value.toLowerCase());
}

function anyFieldIn(fields, keys, values) {
  return keys.some((key) => {
    const fieldValue = String(fields?.[key] ?? "").toLowerCase();
    return values.some((value) => fieldValue === value.toLowerCase());
  });
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

async function optionalFetch(fetcher) {
  try {
    return await fetcher();
  } catch {
    return { records: [] };
  }
}

function buildPipeline(dealRecords) {
  const buckets = new Map();

  dealRecords.forEach((record) => {
    const stage = firstTextField(record.fields, ["Stage", "Pipeline_Stage", "Status"], "Unstaged");
    const existing = buckets.get(stage) ?? { stage, value: 0, count: 0 };
    existing.value += firstNumberField(record.fields, ["Pipeline_Value", "Deal_Value", "Amount", "ARR"]);
    existing.count += 1;
    buckets.set(stage, existing);
  });

  return Array.from(buckets.values());
}

function buildLeadSources(leadRecords) {
  const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#475569"];
  const buckets = new Map();

  leadRecords.forEach((record) => {
    const source = firstTextField(record.fields, ["Source", "Lead_Source", "Activity_Source"], "Unattributed");
    const existing = buckets.get(source) ?? { source, leads: 0 };
    existing.leads += firstNumberField(record.fields, ["Leads_Generated", "Lead_Count", "Count"]) || 1;
    buckets.set(source, existing);
  });

  return Array.from(buckets.values()).map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
  }));
}

export async function GET() {
  const [
    redditResponse,
    emailResponse,
    unifyResponse,
    contentResponse,
    requestsResponse,
    dealsResponse,
    meetingsResponse,
    leadsResponse,
    websiteResponse,
  ] =
    await Promise.all([
      fetchRedditPostings(),
      fetchEmailCampaigns(),
      fetchUnifyProspects(),
      fetchContentPipeline(),
      fetchTaskRequests(),
      optionalFetch(fetchDealPipeline),
      optionalFetch(fetchMeetings),
      optionalFetch(fetchLeadActivity),
      optionalFetch(fetchWebsiteAnalytics),
    ]);

  const redditRecords = recordsFrom(redditResponse);
  const emailRecords = recordsFrom(emailResponse);
  const unifyRecords = recordsFrom(unifyResponse);
  const contentRecords = recordsFrom(contentResponse);
  const requestRecords = recordsFrom(requestsResponse);
  const dealRecords = recordsFrom(dealsResponse);
  const meetingRecords = recordsFrom(meetingsResponse);
  const leadRecords = recordsFrom(leadsResponse);
  const websiteRecords = recordsFrom(websiteResponse);

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

  const newDeals = dealRecords.filter((record) =>
    anyFieldIn(record.fields, ["Stage", "Pipeline_Stage", "Status"], ["New", "Open", "Discovery", "Qualified"]),
  ).length;
  const pipelineValue = dealRecords.reduce(
    (total, record) =>
      total + firstNumberField(record.fields, ["Pipeline_Value", "Deal_Value", "Amount", "ARR"]),
    0,
  );
  const meetings = meetingRecords.filter((record) =>
    statusIn(record.fields, ["Scheduled", "Completed", "Held", "Booked"]),
  ).length;
  const salesQualifiedLeads = leadRecords.reduce((total, record) => {
    const stage = firstTextField(record.fields, ["Lifecycle_Stage", "Lead_Status", "Status"]);
    const count = firstNumberField(record.fields, ["SQL_Count", "Sales_Qualified_Leads"]);
    return total + (stage.toLowerCase() === "sql" || stage.toLowerCase() === "sales qualified" ? count || 1 : count);
  }, 0);
  const marketingQualifiedLeads = leadRecords.reduce((total, record) => {
    const stage = firstTextField(record.fields, ["Lifecycle_Stage", "Lead_Status", "Status"]);
    const count = firstNumberField(record.fields, ["MQL_Count", "Marketing_Qualified_Leads"]);
    return (
      total +
      (stage.toLowerCase() === "mql" || stage.toLowerCase() === "marketing qualified" ? count || 1 : count)
    );
  }, 0);
  const leadsGeneratedFromFields = leadRecords.reduce(
    (total, record) => total + firstNumberField(record.fields, ["Leads_Generated", "Lead_Count", "Count"]),
    0,
  );
  const leadsGenerated = leadsGeneratedFromFields || leadRecords.length;
  const websiteVisits = websiteRecords.reduce(
    (total, record) => total + firstNumberField(record.fields, ["Website_Visits", "Visits", "Sessions"]),
    0,
  );
  const leadMagnetDownloads = websiteRecords.reduce(
    (total, record) =>
      total + firstNumberField(record.fields, ["Lead_Magnet_Downloads", "Downloads", "Asset_Downloads"]),
    0,
  );
  const averageOpenRate = averageField(emailRecords, ["Open_Rate", "Average_Open_Rate"]);
  const averageConversionRate = averageField(
    [...emailRecords, ...websiteRecords, ...leadRecords],
    ["Conversion_Rate", "Lead_Conversion_Rate", "Visitor_To_Lead_Rate"],
  );

  return Response.json({
    stats: {
      scorecard: {
        newDeals,
        pipelineValue,
        meetings,
        salesQualifiedLeads,
        marketingQualifiedLeads,
        leadsGenerated,
        websiteVisits,
        leadMagnetDownloads,
        averageOpenRate,
        averageConversionRate,
      },
      pipeline: buildPipeline(dealRecords),
      leadSources: buildLeadSources(leadRecords),
      funnel: [
        { name: "Visits", value: websiteVisits },
        { name: "Downloads", value: leadMagnetDownloads },
        { name: "MQLs", value: marketingQualifiedLeads },
        { name: "SQLs", value: salesQualifiedLeads },
        { name: "Deals", value: newDeals },
      ],
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
