-- Insert Trades Connect Platform (Skilled Trades Connect) into portfolio_projects.
-- Run once in Supabase SQL Editor. Requires image_urls column (see migration-project-images.sql).

INSERT INTO portfolio_projects (
    title,
    description,
    platform,
    technologies,
    project_link,
    image_url,
    image_urls
)
SELECT
    'Trades Connect Platform',
    $DESC$
End-to-End Intern Document Workflow & Role-Based Management System

A full-featured workflow platform designed to manage intern document lifecycles — from upload and validation to approval and secure release to agencies.

The system implements a robust role-based access control (RBAC) architecture with Supabase Row-Level Security (RLS), ensuring strict data isolation and secure access across multiple user roles including Interns, Admins, Employers, and Agencies.

It streamlines complex operational processes including document handling, approval pipelines, user-role management, and secure file distribution — enabling organizations to operate efficiently with full visibility and control.

Key features:
• Role-Based Access Control (Intern, Admin, Employer, Agency)
• Secure Data Access with Supabase RLS Policies
• Intern Document Upload System (Batch Upload + Progress Tracking)
• Document Workflow (Draft → Submitted → Approved → Released)
• Admin Dashboard with Approval & Bulk Actions
• User Management (Role Assignment, Employer–Intern Mapping)
• Audit Logging System for Activity Tracking
• Employer Dashboard for Intern Monitoring
• Agency Portal with Read-Only Secure Access
• Signed URL File Access (Secure Downloads)
• Realtime Notifications for Admin Actions
• Advanced Validation & Error Handling
$DESC$,
    'Web Application',
    'React, TypeScript, Supabase, PostgreSQL, Edge Functions',
    'https://www.skilledtradesconnect.com/',
    'assets/images/portfolio/trades-connect-showcase.png',
    '[
        "assets/images/portfolio/trades-connect-showcase.png",
        "assets/images/portfolio/trades-connect-who-its-for.png",
        "assets/images/portfolio/trades-connect-commitments.png"
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_projects WHERE title = 'Trades Connect Platform'
);
