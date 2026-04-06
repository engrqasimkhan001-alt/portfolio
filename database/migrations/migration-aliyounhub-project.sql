-- Insert AliyounHub mobile app into portfolio_projects (run once in Supabase SQL Editor).
-- Requires image_urls column (see migration-project-images.sql).

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
    'AliyounHub – Wallet & Shop Management App',
    $DESC$
Client Balance & Mobile Shop Management Platform

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
• Performance Optimizations & Stability Improvements
$DESC$,
    'Mobile App',
    'Flutter, Dart, Firebase, SQLite',
    'https://play.google.com/store/apps/details?id=com.alishop.aliyounhub',
    'assets/images/portfolio/aliyounhub-showcase.png',
    '[
        "assets/images/portfolio/aliyounhub-showcase.png",
        "assets/images/portfolio/aliyounhub-dashboard.png",
        "assets/images/portfolio/aliyounhub-transactions.png",
        "assets/images/portfolio/aliyounhub-users.png"
    ]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_projects WHERE title LIKE 'AliyounHub%'
);
