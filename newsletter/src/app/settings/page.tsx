"use client";

import { useState } from "react";
import { Save, Mail, Shield, Globe, Key } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        // Email Settings
        from_name: "EDC Newsletter",
        from_email: "newsletter@edc-council.eu",
        reply_to: "contact@edc-council.eu",

        // Tracking
        track_opens: true,
        track_clicks: true,

        // Unsubscribe
        unsubscribe_url: "",
        unsubscribe_text:
            "If you no longer wish to receive these emails, you can unsubscribe here.",

        // Footer
        footer_address:
            "European Dealer Council\nBrussels, Belgium",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // TODO: Save settings to database or environment
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert("Settings saved successfully!");
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500">Configure your newsletter system</p>
                </div>
                <div className="flex gap-3">
                    <form action={signout}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </form>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Email Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Settings
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default From Name
                            </label>
                            <input
                                type="text"
                                value={settings.from_name}
                                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default From Email
                            </label>
                            <input
                                type="email"
                                value={settings.from_email}
                                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reply-To Email
                            </label>
                            <input
                                type="email"
                                value={settings.reply_to}
                                onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Tracking Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Tracking & Analytics
                    </h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.track_opens}
                                onChange={(e) => setSettings({ ...settings, track_opens: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Track Email Opens</p>
                                <p className="text-sm text-gray-500">
                                    Use a tracking pixel to detect when emails are opened
                                </p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.track_clicks}
                                onChange={(e) => setSettings({ ...settings, track_clicks: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Track Link Clicks</p>
                                <p className="text-sm text-gray-500">
                                    Wrap links to track when recipients click them
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* GDPR Compliance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        GDPR & Compliance
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unsubscribe Text
                            </label>
                            <textarea
                                value={settings.unsubscribe_text}
                                onChange={(e) => setSettings({ ...settings, unsubscribe_text: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                This text will appear at the bottom of every email with an unsubscribe link.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Footer Address
                            </label>
                            <textarea
                                value={settings.footer_address}
                                onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Required by CAN-SPAM and GDPR regulations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Keys Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Configuration
                    </h2>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            <strong>Important:</strong> API keys should be configured as environment variables
                            on your server or in Supabase secrets, not stored in the database.
                        </p>
                        <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                            <li>
                                <code>RESEND_API_KEY</code> - Your Resend API key for sending emails
                            </li>
                            <li>
                                <code>SUPABASE_SERVICE_ROLE_KEY</code> - For server-side operations
                            </li>
                            <li>
                                <code>NEXT_PUBLIC_TRACKING_URL</code> - Base URL for tracking pixels
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Domain Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Domain Configuration</h2>
                    <p className="text-gray-500 mb-4">
                        To ensure high deliverability, configure these DNS records for your sending domain:
                    </p>
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">SPF Record</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Add to your domain&apos;s TXT records to authorize Resend to send on your behalf.
                            </p>
                            <code className="block mt-2 text-sm bg-gray-100 p-2 rounded">
                                v=spf1 include:_spf.resend.com ~all
                            </code>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">DKIM Record</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Resend will provide specific DKIM keys in your domain verification dashboard.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-900">DMARC Record</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Recommended policy for email authentication.
                            </p>
                            <code className="block mt-2 text-sm bg-gray-100 p-2 rounded">
                                v=DMARC1; p=quarantine; rua=mailto:dmarc@edc-council.eu
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
