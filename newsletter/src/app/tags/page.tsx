"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Tag, Edit2, Trash2, X, Check } from "lucide-react";
import type { Tag as TagType } from "@/lib/types/database";

const PRESET_COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
];

export default function TagsPage() {
    const [tags, setTags] = useState<TagType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTag, setEditingTag] = useState<TagType | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        color: PRESET_COLORS[0],
        description: "",
    });

    useEffect(() => {
        const fetchTags = async () => {
            const supabase = createClient();
            const { data } = await supabase.from("newsletter_tags").select("*").order("name");
            if (data) setTags(data);
            setIsLoading(false);
        };
        fetchTags();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();

        if (editingTag) {
            const { error } = await supabase
                .from("newsletter_tags")
                .update(formData)
                .eq("id", editingTag.id);

            if (!error) {
                setTags(tags.map((t) => (t.id === editingTag.id ? { ...t, ...formData } : t)));
            }
        } else {
            const { data, error } = await supabase
                .from("newsletter_tags")
                .insert(formData)
                .select()
                .single();

            if (!error && data) {
                setTags([...tags, data]);
            }
        }

        resetForm();
    };

    const handleDelete = async (tag: TagType) => {
        if (!confirm(`Delete tag "${tag.name}"? Contacts will be untagged.`)) return;

        const supabase = createClient();
        const { error } = await supabase.from("newsletter_tags").delete().eq("id", tag.id);

        if (!error) {
            setTags(tags.filter((t) => t.id !== tag.id));
        }
    };

    const startEditing = (tag: TagType) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            color: tag.color || PRESET_COLORS[0],
            description: tag.description || "",
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingTag(null);
        setFormData({ name: "", color: PRESET_COLORS[0], description: "" });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
                    <p className="text-gray-500">Organize your contacts with tags</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Tag
                </button>
            </div>

            {/* Tags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : tags.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No tags yet</h3>
                        <p className="text-gray-500 mt-1 mb-4">
                            Create tags to organize your contacts into groups
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create Tag
                        </button>
                    </div>
                ) : (
                    tags.map((tag) => (
                        <div
                            key={tag.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: tag.color || PRESET_COLORS[0] }}
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-900">{tag.name}</h3>
                                        {tag.description && (
                                            <p className="text-sm text-gray-500 mt-1">{tag.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => startEditing(tag)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tag)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingTag ? "Edit Tag" : "New Tag"}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Board Members"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color
                                                ? "border-gray-900 scale-110"
                                                : "border-transparent hover:scale-110"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description for this tag"
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    <Check className="h-4 w-4" />
                                    {editingTag ? "Save Changes" : "Create Tag"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
