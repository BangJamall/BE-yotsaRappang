ALTER TABLE posters
  DROP INDEX category,
  DROP INDEX category_2,
  ADD INDEX idx_posters_category (category);
