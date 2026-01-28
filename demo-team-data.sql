-- Demo Team Data for wOs Portfolio
-- Run this in Supabase SQL Editor

-- Clear existing team members (optional - remove this line if you want to keep existing)
-- DELETE FROM team_members;

-- Insert Demo Team Members
INSERT INTO team_members (name, role, bio, email, linkedin_url, github_url, active)
VALUES 
(
    'Engr Qasim Khan',
    'Founder & Lead Developer',
    'Passionate software developer with 5+ years of experience in mobile and web development. Specialized in Flutter, React Native, and full-stack solutions. Founder of Wave Of Solution Technology (wOs).',
    'engrqasimkhan001@gmail.com',
    'https://linkedin.com/in/engrqasimkhan',
    'https://github.com/engrqasimkhan',
    true
),
(
    'Ahmed Hassan',
    'Senior Mobile Developer',
    'Expert in native iOS and Android development with a focus on performance optimization. 4+ years of experience building scalable mobile applications for clients worldwide.',
    'ahmed.hassan@wos.tech',
    'https://linkedin.com/in/ahmedhassan',
    'https://github.com/ahmedhassan',
    true
),
(
    'Sara Ali',
    'UI/UX Designer',
    'Creative designer passionate about crafting beautiful and intuitive user experiences. Skilled in Figma, Adobe XD, and design systems. Brings ideas to life with pixel-perfect designs.',
    'sara.ali@wos.tech',
    'https://linkedin.com/in/saraali',
    NULL,
    true
),
(
    'Muhammad Bilal',
    'Backend Developer',
    'Full-stack developer specializing in Node.js, Python, and cloud infrastructure. Expert in building RESTful APIs, database design, and DevOps practices.',
    'bilal@wos.tech',
    'https://linkedin.com/in/muhammadbilal',
    'https://github.com/muhammadbilal',
    true
),
(
    'Fatima Zahra',
    'Flutter Developer',
    'Dedicated Flutter developer with expertise in cross-platform mobile development. Passionate about clean code and delivering high-quality applications.',
    'fatima@wos.tech',
    'https://linkedin.com/in/fatimazahra',
    'https://github.com/fatimazahra',
    true
);

-- Verify the data was inserted
SELECT id, name, role, email FROM team_members WHERE active = true;
