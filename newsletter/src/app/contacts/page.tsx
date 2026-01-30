import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Upload, Search, Filter } from "lucide-react";
import { ContactsTable } from "@/components/ContactsTable";

async function getContacts(searchParams: { search?: string; status?: string; tag?: string }) {
    const supabase = await createClient();

    let query = supabase
        .from("newsletter_contacts")
        .select(`
      *,
      newsletter_contact_tags(
        newsletter_tags(*)
      )
    `)
        .order("created_at", { ascending: false })
        .limit(100);

    if (searchParams.search) {
        query = query.or(
            `email.ilike.%${searchParams.search}%,first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%`
        );
    }

    if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq("status", searchParams.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching contacts:", error);
        return [];
    }

    return data || [];
}

async function getTags() {
    const supabase = await createClient();
    const { data } = await supabase.from("newsletter_tags").select("*").order("name");
    return data || [];
}

async function getContactStats() {
    const supabase = await createClient();

    const [total, active, inactive, unsubscribed] = await Promise.all([
        supabase.from("newsletter_contacts").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_contacts").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("newsletter_contacts").select("*", { count: "exact", head: true }).eq("status", "inactive"),
        supabase.from("newsletter_contacts").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
    ]);

    return {
        total: total.count || 0,
        active: active.count || 0,
        inactive: inactive.count || 0,
        unsubscribed: unsubscribed.count || 0,
    };
}

export default async function ContactsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string; tag?: string }>;
}) {
    const params = await searchParams;
    const [contacts, tags, stats] = await Promise.all([
        getContacts(params),
        getTags(),
        getContactStats(),
    ]);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-gray-500">Manage your newsletter subscribers</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/contacts/import"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Upload className="h-4 w-4" />
                        Import
                    </Link>
                    <Link
                        href="/contacts/new"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Contact
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Contacts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Unsubscribed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.unsubscribed}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="p-4 border-b border-gray-100">
                    <form className="flex gap-4" method="get">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Search by name or email..."
                                defaultValue={params.search}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            name="status"
                            defaultValue={params.status || "all"}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="unsubscribed">Unsubscribed</option>
                            <option value="bounced">Bounced</option>
                            <option value="blocked">Blocked</option>
                        </select>
                        <select
                            name="tag"
                            defaultValue={params.tag || ""}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Tags</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </form>
                </div>

                {/* Contacts Table */}
                <ContactsTable contacts={contacts} tags={tags} />
            </div>
        </div>
    );
}
