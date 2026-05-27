const path = require('path');
const fs = require('fs');

// Cargar .env silenciosamente
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (e) {}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'visits.json');
let data = { projects: [], visits: [], _nextPid: 1, _nextVid: 1 };
let dbDir = path.dirname(DB_PATH);

function load() {
  try {
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (fs.existsSync(DB_PATH)) {
      Object.assign(data, JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
    } else {
      save();
    }
    data._nextPid = data.projects.reduce((max, p) => Math.max(max, p.id + 1), 1);
    data._nextVid = data.visits.reduce((max, v) => Math.max(max, v.id + 1), 1);
  } catch (e) {
    console.error('DB load error, starting fresh:', e.message);
    data = { projects: [], visits: [], _nextPid: 1, _nextVid: 1 };
  }
}

function save() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch (e) {}
}

load();

function initDatabase() {
  getProjectId('default');
  return Promise.resolve(true);
}

function getProjectId(name) {
  let p = data.projects.find(p => p.name === name);
  if (p) return p.id;
  const id = data._nextPid++;
  data.projects.push({ id, name, api_key: null, created_at: new Date().toISOString() });
  save();
  return id;
}

function insertVisit(v) {
  const id = data._nextVid++;
  const now = new Date().toISOString();
  data.visits.push({
    id,
    project_id: v.projectId,
    page: v.page || '',
    ip: v.ip || '',
    country: v.country || '',
    region: v.region || '',
    city: v.city || '',
    lat: v.lat || null,
    lon: v.lon || null,
    isp: v.isp || '',
    browser: v.browser || '',
    os: v.os || '',
    device: v.device || '',
    referrer: v.referrer || '',
    visitor_hash: v.visitorHash || '',
    is_bot: v.isBot ? 1 : 0,
    created_at: now
  });
  save();
  return id;
}

// ─── Stats helpers ────────────────────────────────────────

function visitsByProject(projectId) {
  return data.visits.filter(v => v.project_id === projectId && !v.is_bot);
}

function todayVisits(projectId) {
  const today = new Date().toISOString().slice(0, 10);
  return visitsByProject(projectId).filter(v => v.created_at.slice(0, 10) === today);
}

function weekVisits(projectId) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  return visitsByProject(projectId).filter(v => v.created_at >= weekAgo);
}

function overview(projectId) {
  const all = visitsByProject(projectId);
  const today = todayVisits(projectId);
  const week = weekVisits(projectId);
  const uniqueVisitors = [...new Set(all.map(v => v.visitor_hash).filter(Boolean))];
  const uniqueToday = [...new Set(today.map(v => v.visitor_hash).filter(Boolean))];

  // Top pages
  const pageMap = {};
  all.forEach(v => {
    if (v.page) {
      pageMap[v.page] = (pageMap[v.page] || 0) + 1;
    }
  });
  const topPages = Object.entries(pageMap)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: all.length,
    unique_visitors: uniqueVisitors.length,
    today: today.length,
    unique_today: uniqueToday.length,
    this_week: week.length,
    top_pages: topPages
  };
}

function timeline(projectId, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const all = visitsByProject(projectId).filter(v => v.created_at.slice(0, 10) >= since);
  const dayMap = {};
  all.forEach(v => {
    const d = v.created_at.slice(0, 10);
    if (!dayMap[d]) dayMap[d] = { date: d, count: 0, unique_visitors: new Set() };
    dayMap[d].count++;
    if (v.visitor_hash) dayMap[d].unique_visitors.add(v.visitor_hash);
  });
  return Object.values(dayMap)
    .map(d => ({ date: d.date, count: d.count, unique_count: d.unique_visitors.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function devices(projectId) {
  const all = visitsByProject(projectId);
  const browsers = countGroup(all.filter(v => v.browser && v.browser !== 'Unknown'), 'browser');
  const os = countGroup(all.filter(v => v.os && v.os !== 'Unknown'), 'os');
  const devices = countGroup(all, 'device');
  return { browsers, os, devices };
}

function locations(projectId) {
  const all = visitsByProject(projectId);

  const countryMap = {};
  all.forEach(v => {
    if (!v.country || v.lat == null) return;
    const k = v.country;
    if (!countryMap[k]) countryMap[k] = { country: k, count: 0, latSum: 0, lonSum: 0 };
    countryMap[k].count++;
    countryMap[k].latSum += v.lat;
    countryMap[k].lonSum += v.lon;
  });
  const countries = Object.values(countryMap)
    .map(c => ({ country: c.country, count: c.count, lat: c.latSum / c.count, lon: c.lonSum / c.count }))
    .sort((a, b) => b.count - a.count);

  const cityMap = {};
  all.forEach(v => {
    if (!v.city || v.lat == null || v.lon == null) return;
    const k = `${v.country}|${v.city}`;
    if (!cityMap[k]) cityMap[k] = { country: v.country, city: v.city, region: v.region, lat: v.lat, lon: v.lon, count: 0 };
    cityMap[k].count++;
  });
  const cities = Object.values(cityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 500);

  return { countries, cities };
}

function recent(projectId, limit = 20) {
  return visitsByProject(projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(v => ({
      country: v.country, city: v.city, browser: v.browser,
      os: v.os, device: v.device, page: v.page, created_at: v.created_at
    }));
}

function projectList() {
  return data.projects.map(p => {
    const visits = data.visits.filter(v => v.project_id === p.id);
    const realVisits = visits.filter(v => !v.is_bot);
    const uniqueHashes = [...new Set(realVisits.map(v => v.visitor_hash).filter(Boolean))];
    const today = new Date().toISOString().slice(0, 10);
    const todayVisits = realVisits.filter(v => v.created_at.slice(0, 10) === today);
    const last = visits.length > 0 ? visits[visits.length - 1].created_at : null;
    return {
      id: p.id,
      name: p.name,
      created_at: p.created_at,
      total_visits: visits.length,
      unique_visitors: uniqueHashes.length,
      today_visits: todayVisits.length,
      real_visits: realVisits.length,
      last_visit: last
    };
  }).sort((a, b) => b.total_visits - a.total_visits);
}

function countGroup(arr, key) {
  const map = {};
  arr.forEach(item => {
    const val = item[key] || 'unknown';
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map)
    .map(([k, count]) => ({ [key]: k, count }))
    .sort((a, b) => b.count - a.count);
}

module.exports = { initDatabase, getProjectId, insertVisit, overview, timeline, devices, locations, recent, projectList, save };
