-- Demo data for BizDNA MVP, centered around Denver, CO so the map has
-- something to show immediately. Password for every seed user is "password123".
-- Hash below is a bcrypt hash of "password123" (cost 10).

BEGIN;

-- 1) Users
INSERT INTO users (id, email, password_hash, full_name) VALUES
 ('da35abdc-ffac-4e1c-9488-f1fbf9fc0e4d','concrete@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Summit Concrete Co'),
 ('a269cb9b-7744-41a6-898d-32e7258832b7','staffing@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Peak Staffing Group'),
 ('f10f82fa-da4a-4ada-8910-6cc7fc693b88','devshop@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Front Range Dev Shop'),
 ('b8daa6db-fd6c-4153-b828-338b299f3a46','wholesale@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Rocky Mountain Wholesale'),
 ('59b32f4d-5e79-45ee-b32f-e9f200920d59','buyer.retail@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Denver Retail Buyer'),
 ('5b18a22e-e079-42f2-8ab6-5402a59a85da','buyer.startup@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Boulder Startup Founder'),
 ('df90f120-aeeb-448f-9676-91537e65513c','landscaping@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','GreenScape Landscaping'),
 ('86ff8719-5415-4fc3-a25a-d4f2de54436a','investor@demo.bizdna.app','$2b$10$jJc4cFKSIAmaQ/olFIF.sewU.bWm6J6XTyNMH1UPK/Q78Akz6T0iq','Front Range Ventures')
ON CONFLICT (id) DO NOTHING;

-- 2) Profiles
INSERT INTO profiles (id, user_id, profile_kind, role, display_name, category, headline, description, is_verified) VALUES
 ('738ce50c-0115-4a7a-b217-b7f8ab98eaaa','da35abdc-ffac-4e1c-9488-f1fbf9fc0e4d','business','seller','Summit Concrete Co','General Contractor','Licensed & insured commercial concrete contractor','We pour structural concrete for commercial and industrial projects across the Denver metro. 15 years in business, union crews available.', true),
 ('1e1c17d6-1100-448c-b9ec-d7e69d8a55f9','a269cb9b-7744-41a6-898d-32e7258832b7','business','seller','Peak Staffing Group','Recruiting / Staffing','Sales & ops staffing for growing companies','We place sales managers, ops leads, and skilled trades across Colorado. Fast turnaround, pre-vetted candidates.', true),
 ('f2d064de-e28d-420f-abb1-32c2f966a630','f10f82fa-da4a-4ada-8910-6cc7fc693b88','business','both','Front Range Dev Shop','Software / IT Services','Full-stack web & mobile development team accepting projects','5-person dev team building web apps, e-commerce, and internal tools. Also looking for a marketing partner to help us grow.', false),
 ('2c022534-6fed-4cc3-a05f-c38101381641','b8daa6db-fd6c-4153-b828-338b299f3a46','business','seller','Rocky Mountain Wholesale','Wholesale Supplier','Wholesale inventory available — seeking distributors','Bulk home goods and hardware supplier looking to expand our distributor network in the mountain west.', true),
 ('31ee063c-a18d-4e5c-b224-fbaf3b175b6b','59b32f4d-5e79-45ee-b32f-e9f200920d59','business','buyer','Denver Retail Buyer','Distributor','Looking for wholesale suppliers for our retail chain','We operate 6 retail locations and are sourcing new wholesale suppliers for home goods and hardware.', false),
 ('326e24ed-5e10-432f-a999-51900af90e00','5b18a22e-e079-42f2-8ab6-5402a59a85da','individual','buyer','Boulder Startup Founder','Software / IT Services','Need a dev team and seed investors','Pre-seed startup looking for a development partner and introductions to early-stage investors.', false),
 ('abc7f0c2-8861-4da3-93fa-e3ec2d6a5b89','df90f120-aeeb-448f-9676-91537e65513c','business','seller','GreenScape Landscaping','Landscaping','Commercial landscaping crew available','Full-service landscaping for commercial properties — design, install, and maintenance.', false),
 ('a19926d5-36a7-4f6b-a384-1ec88a66c5e6','86ff8719-5415-4fc3-a25a-d4f2de54436a','business','buyer','Front Range Ventures','Investor','Investing in Colorado-based B2B startups','Early-stage VC fund writing $100k-$500k checks into Colorado B2B software and construction-tech startups.', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Location profiles (real Denver-metro coordinates, display_geom == geom for demo simplicity)
INSERT INTO location_profiles (profile_id, geom, display_geom, city, state, country, service_radius_km, visibility_level, is_currently_visible) VALUES
 ('738ce50c-0115-4a7a-b217-b7f8ab98eaaa', ST_SetSRID(ST_MakePoint(-104.9903,39.7392),4326)::geography, ST_SetSRID(ST_MakePoint(-104.9903,39.7392),4326)::geography, 'Denver','CO','United States', 40, 'approximate', true),
 ('1e1c17d6-1100-448c-b9ec-d7e69d8a55f9', ST_SetSRID(ST_MakePoint(-104.9847,39.7645),4326)::geography, ST_SetSRID(ST_MakePoint(-104.9847,39.7645),4326)::geography, 'Denver','CO','United States', 60, 'approximate', true),
 ('f2d064de-e28d-420f-abb1-32c2f966a630', ST_SetSRID(ST_MakePoint(-105.2705,40.0150),4326)::geography, ST_SetSRID(ST_MakePoint(-105.2705,40.0150),4326)::geography, 'Boulder','CO','United States', 100, 'approximate', true),
 ('2c022534-6fed-4cc3-a05f-c38101381641', ST_SetSRID(ST_MakePoint(-104.8214,39.7008),4326)::geography, ST_SetSRID(ST_MakePoint(-104.8214,39.7008),4326)::geography, 'Aurora','CO','United States', 80, 'approximate', true),
 ('31ee063c-a18d-4e5c-b224-fbaf3b175b6b', ST_SetSRID(ST_MakePoint(-105.0844,39.6989),4326)::geography, ST_SetSRID(ST_MakePoint(-105.0844,39.6989),4326)::geography, 'Lakewood','CO','United States', 30, 'approximate', true),
 ('326e24ed-5e10-432f-a999-51900af90e00', ST_SetSRID(ST_MakePoint(-105.2811,40.0176),4326)::geography, ST_SetSRID(ST_MakePoint(-105.2811,40.0176),4326)::geography, 'Boulder','CO','United States', 50, 'approximate', true),
 ('abc7f0c2-8861-4da3-93fa-e3ec2d6a5b89', ST_SetSRID(ST_MakePoint(-104.9403,39.6531),4326)::geography, ST_SetSRID(ST_MakePoint(-104.9403,39.6531),4326)::geography, 'Englewood','CO','United States', 35, 'approximate', true),
 ('a19926d5-36a7-4f6b-a384-1ec88a66c5e6', ST_SetSRID(ST_MakePoint(-104.9878,39.7515),4326)::geography, ST_SetSRID(ST_MakePoint(-104.9878,39.7515),4326)::geography, 'Denver','CO','United States', 150, 'approximate', true)
ON CONFLICT (profile_id) DO NOTHING;

-- 4) Buyer requests
INSERT INTO buyer_requests (profile_id, title, description, category, budget_min, budget_max, urgency, remote_accepted, status, expires_at) VALUES
 ('31ee063c-a18d-4e5c-b224-fbaf3b175b6b','Need a wholesale hardware supplier','Looking for a reliable wholesale supplier of hardware and home goods for 6 retail locations.', 'Wholesale Supplier', 20000, 80000, 'normal', false, 'open', now() + interval '30 days'),
 ('326e24ed-5e10-432f-a999-51900af90e00','Need a dev team for MVP build','Pre-seed startup, need a full-stack team to build our MVP over the next 3 months.', 'Software / IT Services', 15000, 40000, 'high', true, 'open', now() + interval '30 days'),
 ('326e24ed-5e10-432f-a999-51900af90e00','Seeking seed investors','Raising a $500k pre-seed round for a B2B SaaS product, looking for Colorado-based angels/VCs.', 'Investor', NULL, NULL, 'normal', true, 'open', now() + interval '30 days'),
 ('f2d064de-e28d-420f-abb1-32c2f966a630','Looking for a marketing partner','We build software but need help with growth marketing and lead gen.', 'Marketing Agency', 3000, 8000, 'low', true, 'open', now() + interval '30 days')
ON CONFLICT DO NOTHING;

-- 5) Seller offers
INSERT INTO seller_offers (profile_id, title, description, category, price_min, price_max, remote_available, status, expires_at) VALUES
 ('738ce50c-0115-4a7a-b217-b7f8ab98eaaa','Concrete crew available next week','Structural concrete crew has open capacity starting next week for commercial jobs.', 'General Contractor', 10000, 250000, false, 'active', now() + interval '60 days'),
 ('1e1c17d6-1100-448c-b9ec-d7e69d8a55f9','Sales manager candidates ready now','We have 3 pre-vetted sales manager candidates ready for interviews this week.', 'Recruiting / Staffing', 8000, 15000, false, 'active', now() + interval '60 days'),
 ('f2d064de-e28d-420f-abb1-32c2f966a630','Dev team accepting new projects','5-person team with open capacity for a new web or mobile project starting this month.', 'Software / IT Services', 15000, 60000, true, 'active', now() + interval '60 days'),
 ('2c022534-6fed-4cc3-a05f-c38101381641','Wholesale inventory available, seeking distributors','Bulk home goods and hardware inventory available for new distributor partners.', 'Wholesale Supplier', 5000, 100000, false, 'active', now() + interval '60 days'),
 ('abc7f0c2-8861-4da3-93fa-e3ec2d6a5b89','Commercial landscaping crew available','Full landscaping crew with open capacity for new commercial contracts.', 'Landscaping', 2000, 30000, false, 'active', now() + interval '60 days'),
 ('a19926d5-36a7-4f6b-a384-1ec88a66c5e6','Actively investing in Colorado B2B startups','Writing checks $100k-$500k into Colorado-based B2B software and construction-tech companies.', 'Investor', 100000, 500000, true, 'active', now() + interval '90 days')
ON CONFLICT DO NOTHING;

COMMIT;
