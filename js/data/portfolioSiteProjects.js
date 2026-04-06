/**
 * Default portfolio rows (same content as index.html / seed-portfolio-complete.sql).
 * Used by admin "Import site portfolio" to INSERT missing titles into Supabase.
 */

export const PORTFOLIO_SITE_PROJECTS = [
    {
        title: 'E-Commerce Mobile App',
        description:
            'A full-featured e-commerce application for iOS and Android with real-time inventory management, secure payment integration, and user-friendly interface.',
        platform: 'Mobile App',
        technologies: 'Flutter, Firebase, Stripe API',
        project_link: null,
        image_url: null,
        image_urls: [],
    },
    {
        title: 'Instaguard CRM System',
        description: `End-to-End Sales, QA & Operations Management Platform

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
• Real-Time Dashboard & KPI Tracking`,
        platform: 'Web Application',
        technologies: 'React, TypeScript, Supabase, PostgreSQL',
        project_link: 'https://instaguardapp.com/',
        image_url: 'assets/images/portfolio/instaguard-crm-showcase.png',
        image_urls: [
            'assets/images/portfolio/instaguard-crm-showcase.png',
            'assets/images/portfolio/instaguard-dashboard.png',
        ],
    },
    {
        title: 'Trades Connect Platform',
        description: `End-to-End Intern Document Workflow & Role-Based Management System

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
• Advanced Validation & Error Handling`,
        platform: 'Web Application',
        technologies: 'React, TypeScript, Supabase, PostgreSQL, Edge Functions',
        project_link: 'https://www.skilledtradesconnect.com/',
        image_url: 'assets/images/portfolio/trades-connect-showcase.png',
        image_urls: [
            'assets/images/portfolio/trades-connect-showcase.png',
            'assets/images/portfolio/trades-connect-who-its-for.png',
            'assets/images/portfolio/trades-connect-commitments.png',
        ],
    },
    {
        title: 'AliyounHub \u2013 Wallet & Shop Management App',
        description: `Client Balance & Mobile Shop Management Platform

A full-featured mobile application designed for shop owners to manage client balances, track transactions, and handle product sales — all in one secure and user-friendly system.

The app enables shopkeepers to maintain a digital Khata (ledger), allowing them to record client credits, debits, and transaction history with real-time updates and transparency.

It implements secure authentication, role-based access, and protected data storage to ensure that sensitive financial information remains safe and accessible only to authorized users.

AliyounHub streamlines daily shop operations by combining financial tracking, client management, and product sales into a single mobile solution — improving efficiency and reducing manual record-keeping.

Key features:
• Google Sign-In & Secure Authentication
• Admin & User Role Management
• Client Balance Tracking (Digital Khata System)
• Transaction History (Deposit & Withdraw Records)
• Product Management & Sales System
• Add Amount & Payment Tracking Module
• Real-Time Data Updates & Clean UI Experience
• Secure Data Storage & Privacy Protection
• Performance Optimizations & Stability Improvements`,
        platform: 'Mobile App',
        technologies: 'Flutter, Dart, Firebase, SQLite',
        project_link: 'https://play.google.com/store/apps/details?id=com.alishop.aliyounhub',
        image_url: 'assets/images/portfolio/aliyounhub-showcase.png',
        image_urls: [
            'assets/images/portfolio/aliyounhub-showcase.png',
            'assets/images/portfolio/aliyounhub-dashboard.png',
            'assets/images/portfolio/aliyounhub-transactions.png',
            'assets/images/portfolio/aliyounhub-users.png',
        ],
    },
    {
        title: 'Fitness Tracking App',
        description:
            'An iOS and Android fitness application with workout tracking, progress analytics, and social features for sharing achievements.',
        platform: 'Mobile App',
        technologies: 'React Native, Firebase, Charts API',
        project_link: null,
        image_url: null,
        image_urls: [],
    },
    {
        title: 'Restaurant Ordering System',
        description:
            'A complete online ordering system for restaurants with admin panel, customer interface, and real-time order tracking.',
        platform: 'Web Application',
        technologies: 'Vue.js, Python, PostgreSQL',
        project_link: null,
        image_url: null,
        image_urls: [],
    },
    {
        title: 'Social Media App',
        description:
            'A cross-platform social media application with messaging, photo sharing, and content discovery features.',
        platform: 'Mobile App',
        technologies: 'Flutter, Firebase, Cloud Storage',
        project_link: null,
        image_url: null,
        image_urls: [],
    },
    {
        title: 'Analytics Dashboard',
        description:
            'A data visualization dashboard with interactive charts, real-time data processing, and customizable reporting features.',
        platform: 'Web Application',
        technologies: 'React, D3.js, REST API',
        project_link: null,
        image_url: null,
        image_urls: [],
    },
];
