# Scorecard Airtable Changes

The dashboard now expects performance data first. Keep the existing activity tables, but add the tables below so the scorecard can show deals, pipeline, meetings, qualified leads, website visits, and lead magnet downloads.

Field names should match exactly.

## New Table: Deal_Pipeline

| Field | Type | Notes |
| --- | --- | --- |
| Deal_Name | Single line text | Company or opportunity name |
| Stage | Single select | New, Discovery, Qualified, Proposal, Negotiation, Won, Lost |
| Pipeline_Value | Currency or number | Expected deal value |
| Created_Date | Date | Date the deal entered the pipeline |
| Source | Single select | Reddit, Email, Unify, Website, Referral, Manual, Other |
| Owner | Single line text | Optional sales owner |
| Notes | Long text | Optional deal context |

## New Table: Meetings

| Field | Type | Notes |
| --- | --- | --- |
| Meeting_Name | Single line text | Prospect or meeting label |
| Status | Single select | Scheduled, Completed, Held, Booked, Canceled, No Show |
| Meeting_Date | Date | Scheduled or completed date |
| Source | Single select | Reddit, Email, Unify, Website, Referral, Manual, Other |
| Related_Deal | Link to Deal_Pipeline | Optional |
| Notes | Long text | Optional meeting context |

## New Table: Lead_Activity

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

## New Table: Website_Analytics

| Field | Type | Notes |
| --- | --- | --- |
| Period | Single line text | Example: 2026-05 week 1 |
| Date | Date | Reporting date or period start |
| Website_Visits | Number | Visits or sessions |
| Lead_Magnet_Downloads | Number | Total downloads of gated assets |
| Conversion_Rate | Percent or number | Visitor-to-lead or asset conversion rate |
| Lead_Magnet_Name | Single line text | Optional asset name |
| Notes | Long text | Optional analytics context |

## Updates To Existing Tables

### Email_Campaigns

Add:

| Field | Type | Notes |
| --- | --- | --- |
| Open_Rate | Percent or number | Used for the secondary engagement metric |
| Conversion_Rate | Percent or number | Used for the secondary conversion metric |
| Leads_Generated | Number | Optional, if email leads are tracked here before being copied to Lead_Activity |
| MQL_Count | Number | Optional |
| SQL_Count | Number | Optional |

### Reddit_Postings

Add:

| Field | Type | Notes |
| --- | --- | --- |
| Leads_Generated | Number | Leads attributed to the post/comment |
| Conversion_Rate | Percent or number | Optional |
| Source | Single select | Default to Reddit |

### Unify_Prospects

Add:

| Field | Type | Notes |
| --- | --- | --- |
| Lifecycle_Stage | Single select | Lead, MQL, SQL, Customer |
| Associated_Deal | Link to Deal_Pipeline | Optional |
| Meeting_Status | Single select | Optional quick status if no Meetings record exists yet |

## App Mapping

The scorecard reads these fields:

| Dashboard metric | Airtable source |
| --- | --- |
| New Deals | `Deal_Pipeline` records where `Stage` or `Status` is New, Open, Discovery, or Qualified |
| Pipeline | Sum of `Deal_Pipeline.Pipeline_Value` |
| Meetings | `Meetings` records where `Status` is Scheduled, Completed, Held, or Booked |
| SQLs | `Lead_Activity.SQL_Count` or records where `Lifecycle_Stage` is SQL |
| MQLs | `Lead_Activity.MQL_Count` or records where `Lifecycle_Stage` is MQL |
| Leads Generated | Sum of `Lead_Activity.Leads_Generated`, or record count if no count is provided |
| Leads by Source | `Lead_Activity.Source` grouped by leads generated |
| Website Visits | Sum of `Website_Analytics.Website_Visits` |
| Lead Magnet Downloads | Sum of `Website_Analytics.Lead_Magnet_Downloads` |
| Open Rate | Average of `Email_Campaigns.Open_Rate` |
| Conversion Rate | Average of `Conversion_Rate` across `Email_Campaigns`, `Website_Analytics`, and `Lead_Activity` |
