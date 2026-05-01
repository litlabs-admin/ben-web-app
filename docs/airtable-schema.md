# Airtable Tables To Create

Create these tables in one Airtable base. Field names should match exactly so the API helpers can read and update records cleanly.

## Reddit_Postings

| Field | Type | Notes |
| --- | --- | --- |
| Post_Title | Single line text | Internal title for the post/comment |
| Subreddit | Single line text | Example: r/SaaS |
| Post_Type | Single select | Post, Comment, Reply |
| Status | Single select | Draft, Scheduled, Posted, Needs Revision |
| Post_Date | Date | Planned or actual publish date |
| Link_to_Draft | URL | Draft, doc, or Airtable attachment link |
| Published_URL | URL | Final Reddit URL |
| Notes | Long text | Internal context |

## Email_Campaigns

| Field | Type | Notes |
| --- | --- | --- |
| Campaign_Name | Single line text | Name of the email sequence |
| Audience | Single line text | Segment or list name |
| Status | Single select | Drafting, Ready, Sending, Paused, Complete |
| Send_Date | Date | Planned or actual send date |
| Emails_Prepared | Number | Count prepared for sending |
| Emails_Sent | Number | Count sent |
| Reply_Count | Number | Optional once replies exist |
| Link_to_Copy | URL | Draft copy or sequence URL |

## Unify_Prospects

| Field | Type | Notes |
| --- | --- | --- |
| Company_Name | Single line text | Prospect company |
| Contact_Name | Single line text | Optional contact |
| Segment | Single select | Example: Fintech, SaaS, Agency |
| Status | Single select | New, Cleaned, Ready for Outreach, Contacted, Archived |
| Priority | Single select | Low, Medium, High |
| Source | Single select | Unify, Manual, Referral, Imported |
| Notes | Long text | Qualification notes |

## Content_Pipeline

| Field | Type | Notes |
| --- | --- | --- |
| Item_Name | Single line text | Deliverable name |
| Type | Single select | Reddit, Email, Unify, Newsletter, Lead Magnet |
| Status | Single select | Pending Review, Approved, Needs Revision |
| Link_to_Draft | URL | Draft link for client review |
| Client_Feedback | Long text | Feedback pushed from dashboard |

## Task_Requests

| Field | Type | Notes |
| --- | --- | --- |
| Task_Title | Single line text | Client request title |
| Description | Long text | Context from request form |
| Priority | Single select | Low, Medium, High |
| Status | Single select | To-Do, In Progress, Delivered |

## Deal_Pipeline

| Field | Type | Notes |
| --- | --- | --- |
| Deal_Name | Single line text | Company or opportunity name |
| Stage | Single select | New, Discovery, Qualified, Proposal, Negotiation, Won, Lost |
| Pipeline_Value | Currency or number | Expected deal value |
| Created_Date | Date | Date the deal entered the pipeline |
| Source | Single select | Reddit, Email, Unify, Website, Referral, Manual, Other |
| Owner | Single line text | Optional sales owner |
| Notes | Long text | Optional deal context |

## Meetings

| Field | Type | Notes |
| --- | --- | --- |
| Meeting_Name | Single line text | Prospect or meeting label |
| Status | Single select | Scheduled, Completed, Held, Booked, Canceled, No Show |
| Meeting_Date | Date | Scheduled or completed date |
| Source | Single select | Reddit, Email, Unify, Website, Referral, Manual, Other |
| Related_Deal | Link to Deal_Pipeline | Optional |
| Notes | Long text | Optional meeting context |

## Lead_Activity

| Field | Type | Notes |
| --- | --- | --- |
| Activity_Name | Single line text | Campaign, post, sequence, asset, or source label |
| Source | Single select | Reddit, Email, Unify, Website, Lead Magnet, Referral, Manual, Other |
| Leads_Generated | Number | Count of generated leads for the row |
| Lifecycle_Stage | Single select | Lead, MQL, SQL, Customer |
| MQL_Count | Number | Optional direct MQL count |
| SQL_Count | Number | Optional direct SQL count |
| Conversion_Rate | Percent or number | Optional conversion rate for this activity |
| Activity_Date | Date | Date the leads were generated |

## Website_Analytics

| Field | Type | Notes |
| --- | --- | --- |
| Period | Single line text | Example: 2026-05 week 1 |
| Date | Date | Reporting date or period start |
| Website_Visits | Number | Visits or sessions |
| Lead_Magnet_Downloads | Number | Total downloads of gated assets |
| Conversion_Rate | Percent or number | Visitor-to-lead or asset conversion rate |
| Lead_Magnet_Name | Single line text | Optional asset name |
| Notes | Long text | Optional analytics context |
