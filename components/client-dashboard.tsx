"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Check,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Save,
  Send,
  Share2,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DashboardStats = {
  redditTotal: number;
  redditPosted: number;
  redditQueued: number;
  emailsPrepared: number;
  activeEmailSequences: number;
  unifyProspects: number;
  unifyReady: number;
  checklist: { label: string; done: number; total: number }[];
  channelMix: { name: string; value: number; color: string }[];
  weeklyActivity: { name: string; reddit: number; email: number; unify: number }[];
};

type ContentItem = {
  id: string;
  itemName: string;
  type: string;
  status: string;
  link: string;
  feedback: string;
};

type RequestItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
};

const emptyStats: DashboardStats = {
  redditTotal: 0,
  redditPosted: 0,
  redditQueued: 0,
  emailsPrepared: 0,
  activeEmailSequences: 0,
  unifyProspects: 0,
  unifyReady: 0,
  checklist: [
    { label: "Reddit posts drafted", done: 0, total: 0 },
    { label: "Reddit posts published", done: 0, total: 0 },
    { label: "Email sequences prepared", done: 0, total: 0 },
    { label: "Unify lists cleaned", done: 0, total: 0 },
  ],
  channelMix: [
    { name: "Reddit", value: 0, color: "#dc2626" },
    { name: "Email", value: 0, color: "#0f766e" },
    { name: "Unify", value: 0, color: "#2563eb" },
  ],
  weeklyActivity: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((name) => ({
    name,
    reddit: 0,
    email: 0,
    unify: 0,
  })),
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "approvals", label: "Approvals", icon: FileText },
  { id: "requests", label: "Requests", icon: ClipboardList },
];

export function ClientDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestPriority, setRequestPriority] = useState("Medium");
  const [requestOpen, setRequestOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Unable to load Airtable data.");
      const data = await response.json();

      setStats(data.stats ?? emptyStats);
      setContentItems(data.contentItems ?? []);
      setRequests(data.requests ?? []);
    } catch (loadError) {
      setStats(emptyStats);
      setContentItems([]);
      setRequests([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load Airtable data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const pendingCount = contentItems.filter((item) => item.status === "Pending Review").length;
  const approvedCount = contentItems.filter((item) => item.status === "Approved").length;

  const requestCounts = useMemo(
    () =>
      ["To-Do", "In Progress", "Delivered"].map((status) => ({
        status,
        count: requests.filter((request) => request.status === status).length,
      })),
    [requests],
  );

  const operations = [
    {
      label: "Reddit Posts",
      value: String(stats.redditTotal),
      detail: "From Airtable",
      trend: `${stats.redditPosted} posted, ${stats.redditQueued} queued`,
      icon: Share2,
    },
    {
      label: "Emails Prepared",
      value: String(stats.emailsPrepared),
      detail: "Ready or sent",
      trend: `${stats.activeEmailSequences} active sequences`,
      icon: Inbox,
    },
    {
      label: "Unify Prospects",
      value: String(stats.unifyProspects),
      detail: "Tracked records",
      trend: `${stats.unifyReady} ready for outreach`,
      icon: UsersRound,
    },
    {
      label: "Client Reviews",
      value: String(pendingCount),
      detail: "Pending",
      trend: `${approvedCount} approved`,
      icon: FileText,
    },
  ];

  async function updateContent(id: string, patch: Partial<ContentItem>) {
    setSavingId(id);
    const response = await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSavingId(null);
      setError("Could not save content changes to Airtable.");
      return null;
    }

    const data = await response.json();
    const updated = data.item as ContentItem;
    setContentItems((items) => items.map((item) => (item.id === id ? updated : item)));
    setSelectedContent((current) => (current?.id === id ? updated : current));
    setSavingId(null);
    return updated;
  }

  async function createRequest() {
    if (!requestTitle.trim()) return;
    setSavingId("new-request");
    setError("");

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: requestTitle,
        description: requestDescription,
        priority: requestPriority,
      }),
    });

    if (!response.ok) {
      setSavingId(null);
      setError("Could not create request in Airtable.");
      return;
    }

    const data = await response.json();
    setRequests((current) => [data.request, ...current]);
    setRequestTitle("");
    setRequestDescription("");
    setRequestPriority("Medium");
    setRequestOpen(false);
    setSavingId(null);
  }

  async function updateRequest(id: string, patch: Partial<RequestItem>) {
    setSavingId(id);
    const response = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSavingId(null);
      setError("Could not save request changes to Airtable.");
      return;
    }

    const data = await response.json();
    setRequests((items) => items.map((item) => (item.id === id ? data.request : item)));
    setEditingRequest((current) => (current?.id === id ? data.request : current));
    setSavingId(null);
  }

  function navigateToSection(sectionId: string) {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b bg-card lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center justify-between px-5 lg:h-auto lg:flex-col lg:items-start lg:gap-8 lg:py-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Client Portal
              </p>
              <h1 className="mt-1 text-lg font-semibold">Execution Hub</h1>
            </div>
            <Badge variant={pendingCount ? "warning" : "success"}>
              {pendingCount ? `${pendingCount} to review` : "Clear"}
            </Badge>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  className={cn(
                    "flex min-w-fit items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    activeSection === item.id && "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex flex-col gap-4 border-b bg-background/90 px-5 py-5 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-sm text-muted-foreground">Live Airtable operations</p>
              <h2 className="text-2xl font-semibold tracking-tight">What is moving right now</h2>
            </div>
            <RequestDialog
              open={requestOpen}
              saving={savingId === "new-request"}
              onOpenChange={setRequestOpen}
              title={requestTitle}
              description={requestDescription}
              priority={requestPriority}
              onTitleChange={setRequestTitle}
              onDescriptionChange={setRequestDescription}
              onPriorityChange={setRequestPriority}
              onSubmit={createRequest}
            />
          </header>

          <div className="grid gap-8 px-5 py-6 lg:px-8">
            {error && (
              <Card className="border-red-200 bg-red-50 text-red-900">
                <CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium">{error}</p>
                  <Button variant="outline" onClick={loadDashboard}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            <section id="dashboard" className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {operations.map((operation) => (
                  <OperationCard key={operation.label} {...operation} loading={loading} />
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Execution checklist</CardTitle>
                    <CardDescription>Work that has to happen before results can show up.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5">
                    {stats.checklist.map((item) => (
                      <ProgressRow key={item.label} {...item} loading={loading} />
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Channel workload</CardTitle>
                    <CardDescription>Where the team is spending execution time.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-[0.85fr_1fr] xl:grid-cols-1">
                    <div className="h-48">
                      {loading ? (
                        <EmptyChartLabel label="Loading Airtable" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats.channelMix} innerRadius={48} outerRadius={72} dataKey="value">
                              {stats.channelMix.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="grid content-center gap-2">
                      {stats.channelMix.map((source) => (
                        <div key={source.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: source.color }}
                            />
                            {source.name}
                          </span>
                          <span className="font-medium">{source.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly activity</CardTitle>
                  <CardDescription>Posting, email preparation, and Unify list work.</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  {loading ? (
                    <EmptyChartLabel label="Loading Airtable" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.weeklyActivity}>
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="reddit" name="Reddit posts" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="email" name="Emails" fill="#0f766e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="unify" name="Unify records" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section id="approvals" className="grid gap-5">
              <SectionHeading
                icon={FileText}
                title="Content approvals"
                description={`${pendingCount} pending review, ${approvedCount} approved`}
              />
              {contentItems.length ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  {contentItems.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      saving={savingId === item.id}
                      onApprove={() => updateContent(item.id, { status: "Approved" })}
                      onOpen={() => setSelectedContent(item)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No content awaiting review" body="Add records in Content_Pipeline to show review cards here." />
              )}
            </section>

            <section id="requests" className="grid gap-5">
              <SectionHeading
                icon={ClipboardList}
                title="Request tracker"
                description="New asks, active work, and delivered items without Slack digging."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {requestCounts.map((bucket) => (
                  <Card key={bucket.status}>
                    <CardHeader>
                      <CardTitle>{bucket.status}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold">{loading ? "-" : bucket.count}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {requests.length ? (
                <div className="grid gap-3">
                  {requests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setEditingRequest(request)}
                      className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium">{request.title || "Untitled request"}</p>
                        <p className="text-sm text-muted-foreground">{request.priority} priority</p>
                      </div>
                      <Badge
                        variant={
                          request.status === "Delivered"
                            ? "success"
                            : request.status === "In Progress"
                              ? "default"
                              : "muted"
                        }
                      >
                        {request.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No client requests yet" body="Use New Request to create the first Airtable task." />
              )}
            </section>
          </div>
        </section>
      </div>

      <ContentEditor
        item={selectedContent}
        saving={selectedContent ? savingId === selectedContent.id : false}
        onClose={() => setSelectedContent(null)}
        onSave={(patch) => selectedContent && updateContent(selectedContent.id, patch)}
      />
      <RequestEditor
        item={editingRequest}
        saving={editingRequest ? savingId === editingRequest.id : false}
        onClose={() => setEditingRequest(null)}
        onSave={(patch) => editingRequest && updateRequest(editingRequest.id, patch)}
      />
    </main>
  );
}

function RequestDialog({
  open,
  saving,
  onOpenChange,
  title,
  description,
  priority,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  priority: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New request</DialogTitle>
          <DialogDescription>
            Capture the idea now. The team can turn it into an execution task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="What do you need?"
          />
          <Textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Add context, links, audience, or timing."
          />
          <SelectField label="Priority" value={priority} onChange={onPriorityChange} options={["Low", "Medium", "High"]} />
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={onSubmit} disabled={saving}>
              <Send />
              {saving ? "Submitting" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentEditor({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: ContentItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<ContentItem>) => Promise<ContentItem | null> | false | null;
}) {
  const [draft, setDraft] = useState<ContentItem | null>(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  if (!draft) return null;

  async function save(patch: Partial<ContentItem>) {
    const updated = await onSave({ ...draft, ...patch });
    if (updated) setDraft(updated);
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{draft.itemName || "Untitled content"}</DialogTitle>
          <DialogDescription>Edit the Airtable record directly from the portal.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Input
            value={draft.itemName}
            onChange={(event) => setDraft({ ...draft, itemName: event.target.value })}
            placeholder="Item name"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Type"
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
              options={["Reddit", "Email", "Unify", "Newsletter", "Lead Magnet"]}
            />
            <SelectField
              label="Status"
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              options={["Pending Review", "Approved", "Needs Revision"]}
            />
          </div>
          <Input
            value={draft.link}
            onChange={(event) => setDraft({ ...draft, link: event.target.value })}
            placeholder="Draft link"
          />
          {draft.link && (
            <a
              href={draft.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Open original draft link
            </a>
          )}
          <Textarea
            value={draft.feedback}
            onChange={(event) => setDraft({ ...draft, feedback: event.target.value })}
            placeholder="Client feedback"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" disabled={saving} onClick={() => save({ status: "Needs Revision" })}>
              <MessageSquareText />
              Needs Revision
            </Button>
            <Button disabled={saving} onClick={() => save({ status: "Approved" })}>
              <Check />
              Approve
            </Button>
            <Button disabled={saving} onClick={() => save({})}>
              <Save />
              {saving ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestEditor({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: RequestItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<RequestItem>) => void;
}) {
  const [draft, setDraft] = useState<RequestItem | null>(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  if (!draft) return null;

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft.title || "Untitled request"}</DialogTitle>
          <DialogDescription>Edit the Airtable task request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Task title"
          />
          <Textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="Description"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="Priority"
              value={draft.priority}
              onChange={(priority) => setDraft({ ...draft, priority })}
              options={["Low", "Medium", "High"]}
            />
            <SelectField
              label="Status"
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              options={["To-Do", "In Progress", "Delivered"]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button disabled={saving} onClick={() => onSave(draft)}>
              <Save />
              {saving ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function OperationCard({
  label,
  value,
  detail,
  trend,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  trend: string;
  icon: typeof Share2;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{detail}</CardDescription>
          </div>
          <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{loading ? "-" : value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{loading ? "Loading Airtable" : trend}</p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  label,
  done,
  total,
  loading,
}: {
  label: string;
  done: number;
  total: number;
  loading: boolean;
}) {
  const percent = total ? Math.min(Math.round((done / total) * 100), 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {loading ? "-" : `${done} / ${total}`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${loading ? 0 : percent}%` }} />
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ApprovalCard({
  item,
  saving,
  onApprove,
  onOpen,
}: {
  item: ContentItem;
  saving: boolean;
  onApprove: () => void;
  onOpen: () => void;
}) {
  const isApproved = item.status === "Approved";
  const needsRevision = item.status === "Needs Revision";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{item.itemName || "Untitled content"}</CardTitle>
            <CardDescription>{item.type || "Content"}</CardDescription>
          </div>
          <Badge variant={isApproved ? "success" : needsRevision ? "warning" : "muted"}>
            {item.status || "No status"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button variant="outline" onClick={onOpen}>
          <FileText />
          Open in app
        </Button>
        {!isApproved && (
          <Button onClick={onApprove} disabled={saving}>
            <Check />
            {saving ? "Saving" : "Approve"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="grid gap-1 py-8 text-center">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChartLabel({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}
