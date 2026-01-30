export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            newsletter_audit_log: {
                Row: {
                    action: string
                    created_at: string | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    ip_address: string | null
                    new_data: Json | null
                    old_data: Json | null
                    performed_by: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    ip_address?: string | null
                    new_data?: Json | null
                    old_data?: Json | null
                    performed_by?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    ip_address?: string | null
                    new_data?: Json | null
                    old_data?: Json | null
                    performed_by?: string | null
                }
                Relationships: []
            }
            newsletter_campaigns: {
                Row: {
                    ab_parent_id: string | null
                    ab_variant: string | null
                    bounce_count: number | null
                    click_count: number | null
                    completed_at: string | null
                    created_at: string | null
                    created_by: string | null
                    delivered_count: number | null
                    from_email: string
                    from_name: string | null
                    html_content: string
                    id: string
                    is_ab_test: boolean | null
                    name: string
                    open_count: number | null
                    reply_to: string | null
                    scheduled_at: string | null
                    segment_id: string | null
                    sent_count: number | null
                    started_at: string | null
                    status: string | null
                    subject: string
                    tag_ids: string[] | null
                    text_content: string | null
                    total_recipients: number | null
                    unsubscribe_count: number | null
                    updated_at: string | null
                }
                Insert: {
                    ab_parent_id?: string | null
                    ab_variant?: string | null
                    bounce_count?: number | null
                    click_count?: number | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    delivered_count?: number | null
                    from_email: string
                    from_name?: string | null
                    html_content: string
                    id?: string
                    is_ab_test?: boolean | null
                    name: string
                    open_count?: number | null
                    reply_to?: string | null
                    scheduled_at?: string | null
                    segment_id?: string | null
                    sent_count?: number | null
                    started_at?: string | null
                    status?: string | null
                    subject: string
                    tag_ids?: string[] | null
                    text_content?: string | null
                    total_recipients?: number | null
                    unsubscribe_count?: number | null
                    updated_at?: string | null
                }
                Update: {
                    ab_parent_id?: string | null
                    ab_variant?: string | null
                    bounce_count?: number | null
                    click_count?: number | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    delivered_count?: number | null
                    from_email?: string
                    from_name?: string | null
                    html_content?: string
                    id?: string
                    is_ab_test?: boolean | null
                    name?: string
                    open_count?: number | null
                    reply_to?: string | null
                    scheduled_at?: string | null
                    segment_id?: string | null
                    sent_count?: number | null
                    started_at?: string | null
                    status?: string | null
                    subject?: string
                    tag_ids?: string[] | null
                    text_content?: string | null
                    total_recipients?: number | null
                    unsubscribe_count?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_campaigns_ab_parent_id_fkey"
                        columns: ["ab_parent_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_campaigns"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "newsletter_campaigns_segment_id_fkey"
                        columns: ["segment_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_segments"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_clicks: {
                Row: {
                    clicked_at: string | null
                    id: string
                    ip_address: string | null
                    send_id: string
                    url: string
                    user_agent: string | null
                }
                Insert: {
                    clicked_at?: string | null
                    id?: string
                    ip_address?: string | null
                    send_id: string
                    url: string
                    user_agent?: string | null
                }
                Update: {
                    clicked_at?: string | null
                    id?: string
                    ip_address?: string | null
                    send_id?: string
                    url?: string
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_clicks_send_id_fkey"
                        columns: ["send_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_sends"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_consents: {
                Row: {
                    consent_type: string
                    contact_id: string
                    created_at: string | null
                    given: boolean
                    id: string
                    ip_address: string | null
                    source: string | null
                    user_agent: string | null
                }
                Insert: {
                    consent_type: string
                    contact_id: string
                    created_at?: string | null
                    given: boolean
                    id?: string
                    ip_address?: string | null
                    source?: string | null
                    user_agent?: string | null
                }
                Update: {
                    consent_type?: string
                    contact_id?: string
                    created_at?: string | null
                    given?: boolean
                    id?: string
                    ip_address?: string | null
                    source?: string | null
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_consents_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_contacts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_contact_tags: {
                Row: {
                    assigned_at: string | null
                    contact_id: string
                    tag_id: string
                }
                Insert: {
                    assigned_at?: string | null
                    contact_id: string
                    tag_id: string
                }
                Update: {
                    assigned_at?: string | null
                    contact_id?: string
                    tag_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_contact_tags_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "newsletter_contact_tags_tag_id_fkey"
                        columns: ["tag_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_tags"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_contacts: {
                Row: {
                    consent_given_at: string | null
                    consent_ip: string | null
                    consent_source: string | null
                    country: string | null
                    created_at: string | null
                    custom_fields: Json | null
                    email: string
                    email_history: Json | null
                    first_name: string | null
                    id: string
                    last_click_at: string | null
                    last_email_sent_at: string | null
                    last_name: string | null
                    last_open_at: string | null
                    organization: string | null
                    role: string | null
                    status: string | null
                    total_clicks: number | null
                    total_opens: number | null
                    updated_at: string | null
                }
                Insert: {
                    consent_given_at?: string | null
                    consent_ip?: string | null
                    consent_source?: string | null
                    country?: string | null
                    created_at?: string | null
                    custom_fields?: Json | null
                    email: string
                    email_history?: Json | null
                    first_name?: string | null
                    id?: string
                    last_click_at?: string | null
                    last_email_sent_at?: string | null
                    last_name?: string | null
                    last_open_at?: string | null
                    organization?: string | null
                    role?: string | null
                    status?: string | null
                    total_clicks?: number | null
                    total_opens?: number | null
                    updated_at?: string | null
                }
                Update: {
                    consent_given_at?: string | null
                    consent_ip?: string | null
                    consent_source?: string | null
                    country?: string | null
                    created_at?: string | null
                    custom_fields?: Json | null
                    email?: string
                    email_history?: Json | null
                    first_name?: string | null
                    id?: string
                    last_click_at?: string | null
                    last_email_sent_at?: string | null
                    last_name?: string | null
                    last_open_at?: string | null
                    organization?: string | null
                    role?: string | null
                    status?: string | null
                    total_clicks?: number | null
                    total_opens?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            newsletter_opens: {
                Row: {
                    id: string
                    ip_address: string | null
                    opened_at: string | null
                    send_id: string
                    user_agent: string | null
                }
                Insert: {
                    id?: string
                    ip_address?: string | null
                    opened_at?: string | null
                    send_id: string
                    user_agent?: string | null
                }
                Update: {
                    id?: string
                    ip_address?: string | null
                    opened_at?: string | null
                    send_id?: string
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_opens_send_id_fkey"
                        columns: ["send_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_sends"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_segments: {
                Row: {
                    contact_count: number | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    rules: Json
                    updated_at: string | null
                }
                Insert: {
                    contact_count?: number | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    rules: Json
                    updated_at?: string | null
                }
                Update: {
                    contact_count?: number | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    rules?: Json
                    updated_at?: string | null
                }
                Relationships: []
            }
            newsletter_sends: {
                Row: {
                    bounce_reason: string | null
                    bounce_type: string | null
                    campaign_id: string
                    contact_id: string
                    delivered_at: string | null
                    first_clicked_at: string | null
                    first_opened_at: string | null
                    id: string
                    last_opened_at: string | null
                    open_count: number | null
                    resend_id: string | null
                    sent_at: string | null
                    status: string | null
                    tracking_token: string
                }
                Insert: {
                    bounce_reason?: string | null
                    bounce_type?: string | null
                    campaign_id: string
                    contact_id: string
                    delivered_at?: string | null
                    first_clicked_at?: string | null
                    first_opened_at?: string | null
                    id?: string
                    last_opened_at?: string | null
                    open_count?: number | null
                    resend_id?: string | null
                    sent_at?: string | null
                    status?: string | null
                    tracking_token: string
                }
                Update: {
                    bounce_reason?: string | null
                    bounce_type?: string | null
                    campaign_id?: string
                    contact_id?: string
                    delivered_at?: string | null
                    first_clicked_at?: string | null
                    first_opened_at?: string | null
                    id?: string
                    last_opened_at?: string | null
                    open_count?: number | null
                    resend_id?: string | null
                    sent_at?: string | null
                    status?: string | null
                    tracking_token?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "newsletter_sends_campaign_id_fkey"
                        columns: ["campaign_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_campaigns"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "newsletter_sends_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "newsletter_contacts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_tags: {
                Row: {
                    color: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            newsletter_templates: {
                Row: {
                    created_at: string | null
                    html_content: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    subject: string | null
                    text_content: string | null
                    thumbnail_url: string | null
                    updated_at: string | null
                    variables: Json | null
                }
                Insert: {
                    created_at?: string | null
                    html_content?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    subject?: string | null
                    text_content?: string | null
                    thumbnail_url?: string | null
                    updated_at?: string | null
                    variables?: Json | null
                }
                Update: {
                    created_at?: string | null
                    html_content?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    subject?: string | null
                    text_content?: string | null
                    thumbnail_url?: string | null
                    updated_at?: string | null
                    variables?: Json | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_tracking_token: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient type aliases
export type Contact = Tables<'newsletter_contacts'>
export type Tag = Tables<'newsletter_tags'>
export type Campaign = Tables<'newsletter_campaigns'>
export type Template = Tables<'newsletter_templates'>
export type Segment = Tables<'newsletter_segments'>
export type Send = Tables<'newsletter_sends'>
export type Click = Tables<'newsletter_clicks'>
export type Open = Tables<'newsletter_opens'>
export type AuditLog = Tables<'newsletter_audit_log'>
export type Consent = Tables<'newsletter_consents'>
