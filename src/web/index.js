// Website routes here, if needed
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../public' });
});

module.exports = router;
