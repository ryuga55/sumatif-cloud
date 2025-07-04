/*
  # Add unique constraint to scores table

  1. Changes
    - Add unique constraint on `scores` table for combination of:
      - `user_id`
      - `student_id` 
      - `subject_id`
      - `category_id`
      - `assessment_name`
    
  2. Purpose
    - This constraint ensures that each student can only have one score per assessment
    - Enables proper upsert functionality in the application
    - Prevents duplicate score entries for the same assessment

  3. Impact
    - Fixes the upsert operations in the Scores page
    - Maintains data integrity by preventing duplicate scores
*/

-- Add unique constraint to scores table
ALTER TABLE scores ADD CONSTRAINT unique_score_per_assessment 
UNIQUE (user_id, student_id, subject_id, category_id, assessment_name);