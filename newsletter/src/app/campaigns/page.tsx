import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Mail, Send, Clock, FileEdit, BarChart3 } from "lucide-react";
import { format } from "date-fns";

async function getCampaigns() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
    return data || [];
}

async function getCampaignStats() {
    const supabase = await createClient();

    const [total, draft, sent, scheduled] = await Promise.all([
        supabase.from("newsletter_campaigns").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_campaigns").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("newsletter_campaigns").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("newsletter_campaigns").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    ]);

    return {
        total: total.count || 0,
        draft: draft.count || 0,
        sent: sent.count || 0,
        scheduled: scheduled.count || 0,
    };
}

function getStatusIcon(status: string) {
    switch (status) {
        case "sent":
            return <Send className="h-4 w-4" />;
        case "scheduled":
            return <Clock className="h-4 w-4" />;
        case "draft":
            return <FileEdit className="h-4 w-4" />;
        case "sending":
            return <Mail className="h-4 w-4 animate-pulse" />;
        default:
            return <Mail className="h-4 w-4" />;
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "sent":
            return "bg-green-100 text-green-700";
        case "scheduled":
            return "bg-blue-100 text-blue-700";
        case "draft":
            return "bg-gray-100 text-gray-700";
        case "sending":
            return "bg-yellow-100 text-yellow-700";
        case "paused":
            return "bg-orange-100 text-orange-700";
        case "cancelled":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export default async function CampaignsPage() {
    const [campaigns, stats] = await Promise.all([getCampaigns(), getCampaignStats()]);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                    <p className="text-gray-500">Create and manage your email campaigns</p>
                </div>
                <Link
                    href="/campaigns/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Campaign
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Drafts</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {campaigns.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No campaigns yet</h3>
                        <p className="text-gray-500 mt-1 mb-4">
                            Create your first campaign to start engaging with your members.
                        </p>
                        <Link
                            href="/campaigns/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create Campaign
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {campaigns.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/campaigns/${campaign.id}`}
                                className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                campaign.status || "draft"
                                            )}`}
                                        >
                                            {getStatusIcon(campaign.status || "draft")}
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Created {campaign.created_at ? format(new Date(campaign.created_at), "MMM d, yyyy HH:mm") : "-"}
                                        {campaign.scheduled_at && (
                                            <> • Scheduled for {format(new Date(campaign.scheduled_at), "MMM d, yyyy HH:mm")}</>
                                        )}
                                    </p>
                                </div>

                                {/* Stats */}
                                {campaign.status === "sent" && (
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.sent_count || 0}</p>
                                            <p className="text-xs text-gray-500">Sent</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.open_count || 0}</p>
                                            <p className="text-xs text-gray-500">Opens</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">{campaign.click_count || 0}</p>
                                            <p className="text-xs text-gray-500">Clicks</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-medium text-gray-900">
                                                {campaign.sent_count && campaign.open_count
                                                    ? Math.round((campaign.open_count / campaign.sent_count) * 100)
                                                    : 0}
                                                %
                                            </p>
                                            <p className="text-xs text-gray-500">Open Rate</p>
                                        </div>
                                    </div>
                                )}

                                <BarChart3 className="h-5 w-5 text-gray-400 ml-4" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
