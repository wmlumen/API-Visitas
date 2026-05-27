const express = require('express');
const router = express.Router();
const { projectList } = require('../db/database');

router.get('/', (req, res) => {
  res.json(projectList());
});

module.exports = router;
