const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/database');

/**
 * GET /api/projects
 */
router.get('/', (req, res) => {
  const projects = queryAll(`
    SELECT 
      p.id,
      p.name,
      p.created_at,
      COUNT(v.id) as total_visits,
      COUNT(DISTINCT CASE WHEN v.is_bot = 0 THEN v.visitor_hash END) as unique_visitors,
      COUNT(CASE WHEN v.is_bot = 0 AND date(v.created_at) = date('now') THEN 1 END) as today_visits,
      COUNT(CASE WHEN v.is_bot = 0 THEN 1 END) as real_visits,
      MAX(v.created_at) as last_visit
    FROM projects p
    LEFT JOIN visits v ON v.project_id = p.id
    GROUP BY p.id
    ORDER BY total_visits DESC
  `);

  res.json(projects);
});

module.exports = router;
