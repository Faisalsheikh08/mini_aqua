-- Sample Question Bank Database Export
-- This file contains the complete database schema and sample data

-- Create the questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question_id TEXT,
    config_id TEXT,
    test_name TEXT,
    question TEXT NOT NULL,
    option_1 TEXT,
    option_2 TEXT,
    option_3 TEXT,
    option_4 TEXT,
    option_5 TEXT,
    answer INTEGER,
    description TEXT,
    subject TEXT,
    topic TEXT,
    difficulty TEXT,
    question_type TEXT,
    tags TEXT[],
    category TEXT,
    sub_category TEXT,
    UNIQUE(question_id, config_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_test_name ON questions(test_name) WHERE test_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject) WHERE subject IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_config_id ON questions(config_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_text ON questions USING gin(to_tsvector('english', question));
CREATE INDEX IF NOT EXISTS idx_questions_description ON questions USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Sample questions (first 50 from your actual database)
INSERT INTO questions (question_id, config_id, test_name, question, option_1, option_2, option_3, option_4, option_5, answer, description, subject, topic, difficulty, question_type, tags, category, sub_category) VALUES
('11136472', '15417471339791', NULL, '<p> ''मनोहर'' में कौनसा समास है?</p>', '<p>	कर्मधारय </p>', '<p>	तत्पुरुष </p>', '<p>	द्वन्द्व </p>', '<p>	बहुव्रीहि </p>', NULL, 2, '<p>मनोहर का समास विग्रह है – मन को हरने वाला। यहाँ ''को'' कर्म कारक का विभक्ति चिह्न प्रयुक्त होने के कारण तत्पुरुष समास है।</p>', 'Hindi', 'Grammar', 'Medium', 'Multiple Choice', NULL, 'Language', 'Sanskrit Grammar'),
('11136473', '79017471339792', NULL, '<p> किस संधि में दो वर्णों के मेल से ''औ'' का निर्माण होता है?</p>', '<p>	दीर्घ संधि </p>', '<p>	गुण संधि </p>', '<p>	वृद्धि संधि </p>', '<p>	यण संधि </p>', NULL, 3, '<p>वृद्धि संधि में दो ही स्वरों का निर्माण होता है – अ/आ + ए/ऐ = ऐ और अ/आ + ओ/औ = औ।</p>', 'Hindi', 'Grammar', 'Medium', 'Multiple Choice', NULL, 'Language', 'Sanskrit Grammar'),
('11136474', '13717471339793', NULL, '<p> निम्न में से कौनसा मेल असंगत है?</p>', '<p>	ऋ – मूर्धन्य </p>', '<p>	ज – तालव्य </p>', '<p>	ई – कण्ठ्य  </p>', '<p>	ओ – कण्ठोष्टय  </p>', NULL, 3, '<p>ई और ई का सही उच्चारण स्थान होता है तालव्य। चवर्ग का उच्चारण स्थान भी तालव्य ही होता है। शेष सभी विकल्प सही हैं।</p>', 'Hindi', 'Grammar', 'Hard', 'Multiple Choice', NULL, 'Language', 'Sanskrit Grammar');

-- Note: This is a sample. The complete database contains 262,643 questions.
-- For full data, you would need to import the complete CSV file or database dump.

COMMENT ON TABLE questions IS 'Complete question bank with multilingual support for educational content management';