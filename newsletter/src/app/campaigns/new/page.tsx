"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Eye, Users } from "lucide-react";
import Link from "next/link";
import { EmailEditor } from "@/components/EmailEditor";
import type { Tag as TagType, Template, Segment } from "@/lib/types/database";

export default function NewCampaignPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [tags, setTags] = useState<TagType[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const [campaign, setCampaign] = useState({
        name: "",
        subject: "",
        from_name: "EDC Newsletter",
        from_email: "newsletter@edc-council.eu",
        reply_to: "",
        html_content: "",
        text_content: "",
        tag_ids: [] as string[],
        segment_id: null as string | null,
    });

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const [templatesRes, tagsRes, segmentsRes] = await Promise.all([
                supabase.from("newsletter_templates").select("*").eq("is_active", true),
                supabase.from("newsletter_tags").select("*"),
                supabase.from("newsletter_segments").select("*"),
            ]);
            if (templatesRes.data) setTemplates(templatesRes.data);
            if (tagsRes.data) setTags(tagsRes.data);
            if (segmentsRes.data) setSegments(segmentsRes.data);
        };
        fetchData();
    }, []);

    const handleTemplateSelect = (template: Template) => {
        setCampaign({
            ...campaign,
            subject: template.subject || "",
            html_content: template.html_content || "",
            text_content: template.text_content || "",
        });
    };

    const handleSave = async (status: "draft" | "scheduled" = "draft") => {
        if (!campaign.name || !campaign.subject || !campaign.html_content) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSaving(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from("newsletter_campaigns")
            .insert({
                ...campaign,
                status,
            })
            .select("id")
            .single();

        setIsSaving(false);

        if (error) {
            alert("Error saving campaign: " + error.message);
            return;
        }

        router.push(`/campaigns/${data.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/campaigns" className="text-gray-400 hover:text-gray-600">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">New Campaign</h1>
                            <p className="text-sm text-gray-500">Create a new email campaign</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </button>
                        <button
                            onClick={() => handleSave("draft")}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <Save className="h-4 w-4" />
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSave("scheduled")}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" />
                            Schedule
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-3 gap-8">
                    {/* Main Editor */}
                    <div className="col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Campaign Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={campaign.name}
                                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                                        placeholder="e.g., January 2026 Newsletter"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Subject *
                                    </label>
                                    <input
                                        type="text"
                                        value={campaign.subject}
                                        onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                                        placeholder="e.g., EDC Newsletter: Latest Updates from the Council"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            From Name
                                        </label>
                                        <input
                                            type="text"
                                            value={campaign.from_name}
                                            onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            From Email
                                        </label>
                                        <input
                                            type="email"
                                            value={campaign.from_email}
                                            onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Content</h2>
                            <EmailEditor
                                value={campaign.html_content}
                                onChange={(html) => setCampaign({ ...campaign, html_content: html })}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Templates */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
                            {templates.length === 0 ? (
                                <p className="text-sm text-gray-500">No templates available</p>
                            ) : (
                                <div className="space-y-2">
                                    {templates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <p className="font-medium text-gray-900">{template.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recipients */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Recipients
                            </h2>

                            {/* Tags */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Send to Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() =>
                                                setCampaign({
                                                    ...campaign,
                                                    tag_ids: campaign.tag_ids.includes(tag.id)
                                                        ? campaign.tag_ids.filter((t) => t !== tag.id)
                                                        : [...campaign.tag_ids, tag.id],
                                                })
                                            }
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${campaign.tag_ids.includes(tag.id)
                                                ? "text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                            style={{
                                                backgroundColor: campaign.tag_ids.includes(tag.id)
                                                    ? tag.color || "#3B82F6"
                                                    : undefined,
                                            }}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Segments */}
                            {segments.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Or use a Segment
                                    </label>
                                    <select
                                        value={campaign.segment_id || ""}
                                        onChange={(e) =>
                                            setCampaign({ ...campaign, segment_id: e.target.value || null })
                                        }
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="">All active contacts</option>
                                        {segments.map((segment) => (
                                            <option key={segment.id} value={segment.id}>
                                                {segment.name} ({segment.contact_count || 0} contacts)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Personalization Help */}
                        <div className="bg-indigo-50 rounded-xl p-6">
                            <h3 className="font-medium text-indigo-900 mb-2">Personalization Tags</h3>
                            <p className="text-sm text-indigo-700 mb-3">
                                Use these placeholders in your email:
                            </p>
                            <div className="space-y-1 text-sm font-mono text-indigo-800">
                                <p>{"{{first_name}}"}</p>
                                <p>{"{{last_name}}"}</p>
                                <p>{"{{email}}"}</p>
                                <p>{"{{organization}}"}</p>
                                <p>{"{{unsubscribe_url}}"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Email Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 bg-gray-100">
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                                <p className="text-sm text-gray-500">
                                    <strong>From:</strong> {campaign.from_name} &lt;{campaign.from_email}&gt;
                                </p>
                                <p className="text-sm text-gray-500">
                                    <strong>Subject:</strong> {campaign.subject}
                                </p>
                            </div>
                            <div
                                className="bg-white rounded-lg shadow-sm p-6 overflow-auto max-h-[60vh]"
                                dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
