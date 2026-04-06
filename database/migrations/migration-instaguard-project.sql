-- Replace legacy demo row with Instaguard CRM (run once in Supabase SQL Editor if that project exists).
-- After running, set image_url or image_urls in the admin panel to your hosted asset URLs if needed.

UPDATE portfolio_projects
SET
    title = 'Instaguard CRM System',
    description = $DESC$
End-to-End Sales, QA & Operations Management Platform

A full-featured CRM platform designed to manage the complete sales lifecycle — from lead generation to conversion and quality assurance.

The system implements secure role-based access control (RBAC) with Row-Level Security (RLS) to ensure data is accessible only to authorized users.

It integrates core business functions including sales pipeline management, email automation, Zoom call tracking, and QA workflows — enabling teams to operate efficiently with structured processes and real-time visibility.

Key features:
• Role-Based Access Control (Admin, Sales, QA, Operations)
• Secure Data Handling with Supabase RLS
• Sales Pipeline & Lead Management System
• Email Automation with Dynamic Templates
• Zoom Call Integration & Recording Playback
• QA Review & Approval Workflow
• Real-Time Dashboard & KPI Tracking
$DESC$,
    platform = 'Web Application',
    technologies = 'React, TypeScript, Supabase, PostgreSQL',
    project_link = 'https://instaguardapp.com/'
WHERE title = 'Project Management Dashboard';
