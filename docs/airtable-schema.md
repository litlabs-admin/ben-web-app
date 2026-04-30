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
