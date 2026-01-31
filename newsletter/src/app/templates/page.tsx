import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText, Edit } from "lucide-react";
import { format } from "date-fns";

async function getTemplates() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("newsletter_templates")
        .select("*")
        .order("created_at", { ascending: false });
    return data || [];
}

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                    <p className="text-gray-500">Create and manage reusable email templates</p>
                </div>
                <Link
                    href="/templates/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Template
                </Link>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No templates yet</h3>
                        <p className="text-gray-500 mt-1 mb-4">
                            Create reusable templates to speed up your email creation
                        </p>
                        <Link
                            href="/templates/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create Template
                        </Link>
                    </div>
                ) : (
                    templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Preview */}
                            <div className="h-40 bg-gray-100 relative overflow-hidden">
                                {template.html_content ? (
                                    <div
                                        className="p-4 text-xs transform scale-50 origin-top-left w-[200%] h-[200%]"
                                        dangerouslySetInnerHTML={{ __html: template.html_content }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <FileText className="h-12 w-12 text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90" />
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                                        {template.subject && (
                                            <p className="text-sm text-gray-500 truncate mt-1">{template.subject}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {template.created_at
                                                ? format(new Date(template.created_at), "MMM d, yyyy")
                                                : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/templates/${template.id}`}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${template.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {template.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <Link
                                        href={`/campaigns/new?template=${template.id}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Use Template →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
