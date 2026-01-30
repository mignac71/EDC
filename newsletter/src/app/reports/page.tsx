import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Users, Mail, MousePointer, Eye } from "lucide-react";

async function getDashboardStats() {
    const supabase = await createClient();

    const [contacts, campaigns, totalSent, totalOpens, totalClicks] = await Promise.all([
        supabase.from("newsletter_contacts").select("status", { count: "exact" }),
        supabase.from("newsletter_campaigns").select("status, sent_count, open_count, click_count"),
        supabase.from("newsletter_sends").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_opens").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_clicks").select("*", { count: "exact", head: true }),
    ]);

    const sentCampaigns = campaigns.data?.filter((c) => c.status === "sent") || [];
    const totalCampaignSent = sentCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const totalCampaignOpens = sentCampaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
    const totalCampaignClicks = sentCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);

    return {
        totalContacts: contacts.count || 0,
        activeContacts: contacts.data?.filter((c) => c.status === "active").length || 0,
        totalCampaigns: campaigns.data?.length || 0,
        sentCampaigns: sentCampaigns.length,
        totalSent: totalSent.count || totalCampaignSent,
        totalOpens: totalOpens.count || totalCampaignOpens,
        totalClicks: totalClicks.count || totalCampaignClicks,
        openRate: totalCampaignSent > 0 ? ((totalCampaignOpens / totalCampaignSent) * 100).toFixed(1) : "0",
        clickRate: totalCampaignOpens > 0 ? ((totalCampaignClicks / totalCampaignOpens) * 100).toFixed(1) : "0",
    };
}

async function getRecentCampaignStats() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("status", "sent")
        .order("completed_at", { ascending: false })
        .limit(10);
    return data || [];
}

export default async function ReportsPage() {
    const stats = await getDashboardStats();
    const recentCampaigns = await getRecentCampaignStats();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-500">Track the performance of your email campaigns</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Contacts</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalContacts}</p>
                            <p className="text-sm text-green-600 mt-1">{stats.activeContacts} active</p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Emails Sent</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalSent}</p>
                            <p className="text-sm text-gray-500 mt-1">{stats.sentCampaigns} campaigns</p>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3">
                            <Mail className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Open Rate</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.openRate}%</p>
                            <p className="text-sm text-gray-500 mt-1">{stats.totalOpens} opens</p>
                        </div>
                        <div className="bg-purple-100 rounded-lg p-3">
                            <Eye className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Click Rate</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.clickRate}%</p>
                            <p className="text-sm text-gray-500 mt-1">{stats.totalClicks} clicks</p>
                        </div>
                        <div className="bg-orange-100 rounded-lg p-3">
                            <MousePointer className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Campaign Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Campaign Performance
                    </h2>
                </div>

                {recentCampaigns.length === 0 ? (
                    <div className="p-12 text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No campaign data yet</h3>
                        <p className="text-gray-500 mt-1">
                            Send your first campaign to start seeing performance metrics
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campaign
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sent
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Delivered
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Opens
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Open Rate
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Clicks
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Click Rate
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bounces
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentCampaigns.map((campaign) => {
                                    const openRate = campaign.sent_count
                                        ? ((campaign.open_count || 0) / campaign.sent_count * 100).toFixed(1)
                                        : "0";
                                    const clickRate = campaign.open_count
                                        ? ((campaign.click_count || 0) / campaign.open_count * 100).toFixed(1)
                                        : "0";

                                    return (
                                        <tr key={campaign.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{campaign.name}</p>
                                                <p className="text-sm text-gray-500">{campaign.subject}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {campaign.sent_count || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {campaign.delivered_count || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {campaign.open_count || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${parseFloat(openRate) > 25
                                                            ? "bg-green-100 text-green-700"
                                                            : parseFloat(openRate) > 15
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {openRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {campaign.click_count || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${parseFloat(clickRate) > 5
                                                            ? "bg-green-100 text-green-700"
                                                            : parseFloat(clickRate) > 2
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {clickRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900">
                                                {campaign.bounce_count || 0}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
