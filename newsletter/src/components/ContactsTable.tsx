"use client";

import { Contact, Tag } from "@/lib/types/database";
import { MoreHorizontal, Mail, Eye, MousePointer } from "lucide-react";
import { format } from "date-fns";

interface ContactWithTags extends Contact {
    newsletter_contact_tags?: {
        newsletter_tags: Tag;
    }[];
}

interface ContactsTableProps {
    contacts: ContactWithTags[];
    tags: Tag[];
}

export function ContactsTable({ contacts, tags }: ContactsTableProps) {
    if (contacts.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No contacts yet</h3>
                <p className="text-gray-500 mt-1">
                    Start by importing your member list or adding contacts manually.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Engagement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Added
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-medium">
                                            {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {contact.first_name || contact.last_name
                                                ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                                                : "No name"}
                                        </div>
                                        <div className="text-sm text-gray-500">{contact.email}</div>
                                        {contact.organization && (
                                            <div className="text-xs text-gray-400">{contact.organization}</div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {contact.newsletter_contact_tags?.map((ct) => (
                                        <span
                                            key={ct.newsletter_tags.id}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                            style={{
                                                backgroundColor: `${ct.newsletter_tags.color}20`,
                                                color: ct.newsletter_tags.color || '#3B82F6',
                                            }}
                                        >
                                            {ct.newsletter_tags.name}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contact.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : contact.status === "unsubscribed"
                                                ? "bg-red-100 text-red-800"
                                                : contact.status === "bounced"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {contact.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1" title="Opens">
                                        <Eye className="h-4 w-4" />
                                        <span>{contact.total_opens || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Clicks">
                                        <MousePointer className="h-4 w-4" />
                                        <span>{contact.total_clicks || 0}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {contact.created_at
                                    ? format(new Date(contact.created_at), "MMM d, yyyy")
                                    : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
