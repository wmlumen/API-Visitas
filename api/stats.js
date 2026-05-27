const express = require('express');
const router = express.Router();
const { getProjectId, queryAll, queryOne } = require('../db/database');

/**
 * GET /api/stats/overview?project=nombre
 */
router.get('/overview', (req, res) => {
  const project = req.query.project || 'default';
  const projectId = getProjectId(project);

  const total = queryOne('SELECT COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0', [projectId]);
  const today = queryOne("SELECT COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND date(created_at) = date('now')", [projectId]);
  const week = queryOne("SELECT COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND created_at >= datetime('now', '-7 days')", [projectId]);
  const unique = queryOne('SELECT COUNT(DISTINCT visitor_hash) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND visitor_hash IS NOT NULL', [projectId]);
  const uniqueToday = queryOne("SELECT COUNT(DISTINCT visitor_hash) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND date(created_at) = date('now') AND visitor_hash IS NOT NULL", [projectId]);

  const topPages = queryAll("SELECT page, COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND page != '' GROUP BY page ORDER BY count DESC LIMIT 10", [projectId]);

  res.json({
    total: total?.count || 0,
    unique_visitors: unique?.count || 0,
    today: today?.count || 0,
    unique_today: uniqueToday?.count || 0,
    this_week: week?.count || 0,
    top_pages: topPages
  });
});

/**
 * GET /api/stats/timeline?project=nombre&days=30
 */
router.get('/timeline', (req, res) => {
  const project = req.query.project || 'default';
  const days = parseInt(req.query.days) || 30;
  const projectId = getProjectId(project);

  const timeline = queryAll(`
    SELECT date(created_at) as date, COUNT(*) as count,
           COUNT(DISTINCT visitor_hash) as unique_count
    FROM visits
    WHERE project_id = ? AND is_bot = 0
      AND created_at >= datetime('now', ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `, [projectId, -days]);

  res.json({ project, days, timeline });
});

/**
 * GET /api/stats/devices?project=nombre
 */
router.get('/devices', (req, res) => {
  const project = req.query.project || 'default';
  const projectId = getProjectId(project);

  const browsers = queryAll("SELECT browser, COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND browser != 'Unknown' GROUP BY browser ORDER BY count DESC", [projectId]);
  const os = queryAll("SELECT os, COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 AND os != 'Unknown' GROUP BY os ORDER BY count DESC", [projectId]);
  const devices = queryAll('SELECT device, COUNT(*) as count FROM visits WHERE project_id = ? AND is_bot = 0 GROUP BY device ORDER BY count DESC', [projectId]);

  res.json({ browsers, os, devices });
});

/**
 * GET /api/stats/locations?project=nombre
 */
router.get('/locations', (req, res) => {
  const project = req.query.project || 'default';
  const projectId = getProjectId(project);

  const countries = queryAll(`
    SELECT country, COUNT(*) as count,
           AVG(lat) as lat, AVG(lon) as lon
    FROM visits
    WHERE project_id = ? AND is_bot = 0 AND country != '' AND lat IS NOT NULL
    GROUP BY country
    ORDER BY count DESC
  `, [projectId]);

  const cities = queryAll(`
    SELECT country, city, region, lat, lon, COUNT(*) as count
    FROM visits
    WHERE project_id = ? AND is_bot = 0 AND city != '' AND lat IS NOT NULL AND lon IS NOT NULL
    GROUP BY country, city
    ORDER BY count DESC
    LIMIT 500
  `, [projectId]);

  res.json({ countries, cities });
});

/**
 * GET /api/stats/recent?project=nombre&limit=20
 */
router.get('/recent', (req, res) => {
  const project = req.query.project || 'default';
  const limit = parseInt(req.query.limit) || 20;
  const projectId = getProjectId(project);

  const recent = queryAll(`
    SELECT country, city, browser, os, device, page, created_at
    FROM visits
    WHERE project_id = ? AND is_bot = 0
    ORDER BY created_at DESC
    LIMIT ?
  `, [projectId, limit]);

  res.json(recent);
});

module.exports = router;
