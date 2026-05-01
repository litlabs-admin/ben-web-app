const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export const AIRTABLE_TABLES = {
  redditPostings: "Reddit_Postings",
  emailCampaigns: "Email_Campaigns",
  unifyProspects: "Unify_Prospects",
  contentPipeline: "Content_Pipeline",
  taskRequests: "Task_Requests",
  dealPipeline: "Deal_Pipeline",
  meetings: "Meetings",
  leadActivity: "Lead_Activity",
  websiteAnalytics: "Website_Analytics",
};

function getAirtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID.");
  }

  return { apiKey, baseId };
}

async function airtableRequest(tableName, options = {}) {
  const { apiKey, baseId } = getAirtableConfig();
  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}${options.query ?? ""}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Airtable ${response.status}: ${detail}`);
  }

  return response.json();
}

export async function fetchRedditPostings() {
  return airtableRequest(AIRTABLE_TABLES.redditPostings, {
    query: "?sort%5B0%5D%5Bfield%5D=Post_Date&sort%5B0%5D%5Bdirection%5D=desc",
  });
}

export async function fetchEmailCampaigns() {
  return airtableRequest(AIRTABLE_TABLES.emailCampaigns, {
    query: "?sort%5B0%5D%5Bfield%5D=Send_Date&sort%5B0%5D%5Bdirection%5D=desc",
  });
}

export async function fetchUnifyProspects() {
  return airtableRequest(AIRTABLE_TABLES.unifyProspects);
}

export async function fetchContentPipeline() {
  return airtableRequest(AIRTABLE_TABLES.contentPipeline, {
    query: "?filterByFormula=%7BStatus%7D%3D%27Pending%20Review%27",
  });
}

export async function fetchTaskRequests() {
  return airtableRequest(AIRTABLE_TABLES.taskRequests);
}

export async function fetchDealPipeline() {
  return airtableRequest(AIRTABLE_TABLES.dealPipeline);
}

export async function fetchMeetings() {
  return airtableRequest(AIRTABLE_TABLES.meetings);
}

export async function fetchLeadActivity() {
  return airtableRequest(AIRTABLE_TABLES.leadActivity);
}

export async function fetchWebsiteAnalytics() {
  return airtableRequest(AIRTABLE_TABLES.websiteAnalytics);
}

export async function approveContentItem(recordId) {
  return airtableRequest(AIRTABLE_TABLES.contentPipeline, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields: {
            Status: "Approved",
          },
        },
      ],
    }),
  });
}

export async function submitContentFeedback(recordId, feedback) {
  return airtableRequest(AIRTABLE_TABLES.contentPipeline, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields: {
            Status: "Needs Revision",
            Client_Feedback: feedback,
          },
        },
      ],
    }),
  });
}

export async function updateContentItem(recordId, fields) {
  return airtableRequest(AIRTABLE_TABLES.contentPipeline, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
}

export async function createTaskRequest({ title, description, priority = "Medium" }) {
  return airtableRequest(AIRTABLE_TABLES.taskRequests, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            Task_Title: title,
            Description: description,
            Priority: priority,
            Status: "To-Do",
          },
        },
      ],
    }),
  });
}

export async function updateTaskRequest(recordId, fields) {
  return airtableRequest(AIRTABLE_TABLES.taskRequests, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    }),
  });
}
