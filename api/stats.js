const express = require('express');
const router = express.Router();
const { getProjectId, overview, timeline, devices, locations, recent } = require('../db/database');

router.get('/overview', (req, res) => {
  const projectId = getProjectId(req.query.project || 'default');
  res.json(overview(projectId));
});

router.get('/timeline', (req, res) => {
  const projectId = getProjectId(req.query.project || 'default');
  const days = parseInt(req.query.days) || 30;
  res.json({ project: req.query.project || 'default', days, timeline: timeline(projectId, days) });
});

router.get('/devices', (req, res) => {
  const projectId = getProjectId(req.query.project || 'default');
  res.json(devices(projectId));
});

router.get('/locations', (req, res) => {
  const projectId = getProjectId(req.query.project || 'default');
  res.json(locations(projectId));
});

router.get('/recent', (req, res) => {
  const projectId = getProjectId(req.query.project || 'default');
  const limit = parseInt(req.query.limit) || 20;
  res.json(recent(projectId, limit));
});

module.exports = router;
