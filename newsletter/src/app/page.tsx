import { createClient } from "@/lib/supabase/server";
import { Users, Mail, MousePointer, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const supabase = await createClient();

  const [contacts, campaigns, totalOpens, totalClicks] = await Promise.all([
    supabase.from("newsletter_contacts").select("*", { count: "exact", head: true }),
    supabase.from("newsletter_campaigns").select("*", { count: "exact", head: true }),
    supabase.from("newsletter_contacts").select("total_opens").then(({ data }) =>
      data?.reduce((sum, c) => sum + (c.total_opens || 0), 0) || 0
    ),
    supabase.from("newsletter_contacts").select("total_clicks").then(({ data }) =>
      data?.reduce((sum, c) => sum + (c.total_clicks || 0), 0) || 0
    ),
  ]);

  return {
    totalContacts: contacts.count || 0,
    totalCampaigns: campaigns.count || 0,
    totalOpens,
    totalClicks,
  };
}

async function getRecentCampaigns() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

async function getRecentContacts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentCampaigns = await getRecentCampaigns();
  const recentContacts = await getRecentContacts();

  const statCards = [
    {
      name: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      href: "/contacts",
    },
    {
      name: "Campaigns",
      value: stats.totalCampaigns.toLocaleString(),
      icon: Mail,
      color: "bg-green-500",
      href: "/campaigns",
    },
    {
      name: "Total Opens",
      value: stats.totalOpens.toLocaleString(),
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/reports",
    },
    {
      name: "Total Clicks",
      value: stats.totalClicks.toLocaleString(),
      icon: MousePointer,
      color: "bg-orange-500",
      href: "/reports",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to EDC Newsletter Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/contacts/import"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white hover:opacity-90 transition-opacity"
        >
          <h3 className="font-semibold text-lg mb-2">Import Contacts</h3>
          <p className="text-indigo-100 text-sm">
            Upload a CSV or Excel file with your member list
          </p>
        </Link>
        <Link
          href="/campaigns/new"
          className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white hover:opacity-90 transition-opacity"
        >
          <h3 className="font-semibold text-lg mb-2">Create Campaign</h3>
          <p className="text-green-100 text-sm">
            Design and send a new newsletter to your members
          </p>
        </Link>
        <Link
          href="/templates"
          className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white hover:opacity-90 transition-opacity"
        >
          <h3 className="font-semibold text-lg mb-2">Email Templates</h3>
          <p className="text-orange-100 text-sm">
            Browse and create reusable email templates
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Campaigns
            </h2>
            <Link
              href="/campaigns"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No campaigns yet. Create your first campaign!
            </p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.subject}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${campaign.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "draft"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Contacts
            </h2>
            <Link
              href="/contacts"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No contacts yet. Import your member list!
            </p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-medium">
                        {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${contact.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
